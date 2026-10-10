import { envConfig } from "@/configs/validate-env";
import { setAuthCookies } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");

  if (!accessToken || !refreshToken) {
    return Response.json(
      { success: false, message: "Invalid access token or refresh token" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, { accessToken, refreshToken });

  return NextResponse.redirect(new URL("/", envConfig!.APP_URL));
}
