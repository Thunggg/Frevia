import { envConfig } from "@/configs/validate-env";
import {
  accessTokenNeedsRefresh,
  authCookieBaseOptions,
  exchangeRefreshToken,
  type RefreshedTokens,
} from "@/lib/auth-session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ====== Routes công khai (guest chưa đăng nhập vẫn truy cập được) ======
//   - "/"           : trang chủ (marketing)
//   - "/find-work"  : duyệt danh sách công việc   (GET /api/jobs public)
//   - "/job"        : chi tiết công việc           (GET /api/jobs/:slug public)
//   - "/forum"      : đọc diễn đàn (danh mục, bài viết, chi tiết) — các GET /api/forums public
//   - "/profiles"   : hồ sơ công khai của freelancer (GET /api/profiles/:id public)
//   - "/clients"    : hồ sơ công khai của client    (GET /api/clients/:userId public)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_ROUTES = [
  "/",
  "/find-work",
  "/job",
  "/forum",
  "/profiles",
  "/clients",
];

const isAuthRoute = (pathname: string) =>
  AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

const isPublicRoute = (pathname: string) =>
  isAuthRoute(pathname) ||
  PUBLIC_ROUTES.some(
    // "/" chỉ khớp đúng pathname; các route khác khớp cả đường dẫn con
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

function applyAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  response.cookies.set(
    "accessToken",
    tokens.accessToken,
    authCookieBaseOptions("access"),
  );
  response.cookies.set(
    "refreshToken",
    tokens.refreshToken,
    authCookieBaseOptions("refresh"),
  );
}

function clearAuthCookiesOnResponse(response: NextResponse) {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Session = còn refreshToken (access có thể hết hạn / hỏng)
  let hasSession = Boolean(refreshToken);
  const response = NextResponse.next();

  // Nếu có refresh token và access token cần refresh thì exchange refresh token
  if (refreshToken && accessTokenNeedsRefresh(accessToken)) {
    const tokens = await exchangeRefreshToken(refreshToken);
    if (tokens) {
      applyAuthCookies(response, tokens);
      hasSession = true;
    } else {
      clearAuthCookiesOnResponse(response);

      // Nếu không có session thì xóa các cookies và trả về login
      hasSession = false;

      // Nếu không phải là route auth thì redirect đến login
      if (!isPublicRoute(pathname)) {
        const login = NextResponse.redirect(
          new URL("/login", envConfig!.APP_URL),
        );
        clearAuthCookiesOnResponse(login);
        return login;
      }

      return response;
    }
  }

  // Nếu không có session và không phải là route auth thì redirect đến login
  if (!hasSession && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", envConfig!.APP_URL));
  }

  // Nếu có session và là route auth thì redirect đến home
  if (hasSession && isAuthRoute(pathname)) {
    const home = NextResponse.redirect(new URL("/", envConfig!.APP_URL));
    for (const cookie of response.cookies.getAll()) {
      home.cookies.set(cookie);
    }
    return home;
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
