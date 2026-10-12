import { envConfig } from "@/configs/validate-env";
import { authCookieBaseOptions } from "@/lib/auth-session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const appUrl = envConfig!.APP_URL;

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/login?error=google", appUrl));
  }

  // Gắn cookie vào chính response redirect. `cookies().set()` rồi
  // `NextResponse.redirect()` sẽ làm cookie không được gửi kèm → user
  // vào `/` không có session và bị đẩy lại `/login`.
  const response = NextResponse.redirect(new URL("/", appUrl));
  response.cookies.set(
    "accessToken",
    accessToken,
    authCookieBaseOptions("access"),
  );
  response.cookies.set(
    "refreshToken",
    refreshToken,
    authCookieBaseOptions("refresh"),
  );

  return response;
}
