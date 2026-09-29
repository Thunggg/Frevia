import { envConfig } from "@/configs/validate-env";
import ms, { StringValue } from "ms";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");

  const cookieStore = await cookies();

  if (!accessToken || !refreshToken) {
    return Response.json(
      { success: false, message: "Invalid access token or refresh token" },
      { status: 400 },
    );
  }

  cookieStore.set("accessToken", accessToken as string, {
    httpOnly: true,
    secure: envConfig?.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(
      Date.now() +
        (ms(envConfig?.ACCESS_TOKEN_EXPIRES_IN as StringValue) as number),
    ),
  });

  cookieStore.set("refreshToken", refreshToken as string, {
    httpOnly: true,
    secure: envConfig?.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(
      Date.now() +
        (ms(envConfig?.REFRESH_TOKEN_EXPIRES_IN as StringValue) as number),
    ),
  });

  return NextResponse.redirect(new URL("/", request.url));
}
