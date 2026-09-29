import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// hàm này để kiểm tra xem route có phải là route auth không
const isAuthRoute = (pathname: string) => {
  return AUTH_ROUTES.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  });
};

// hàm này để kiểm tra xem đã login và có access và refresh token không
const isAuthenticated = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  return accessToken && refreshToken;
};

// This function can be marked `async` if using `await` inside
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua API routes (login, google, refresh...)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const authenticated = await isAuthenticated(request);

  // nếu chưa đăng nhập và ko phải protected route thì redirect về login
  if (!authenticated && !isAuthRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // (Tuỳ chọn) Đã login → không cho vào /login nữa
  if (authenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }

export const config = {
  matcher: [
    /*
     * Match all routes except static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
