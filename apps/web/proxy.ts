import { envConfig } from "@/configs/validate-env";
import {
  accessTokenNeedsRefresh,
  authCookieBaseOptions,
  exchangeRefreshToken,
  type RefreshedTokens,
} from "@/lib/auth-session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const isAuthRoute = (pathname: string) =>
  AUTH_ROUTES.some(
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
      if (!isAuthRoute(pathname)) {
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
  if (!hasSession && !isAuthRoute(pathname)) {
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
