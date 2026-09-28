import ms, { StringValue } from "ms";
import { cookies } from "next/headers";
import { envConfig } from "../../../configs/validate-env";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const res = await request.json();
  cookieStore.set("accessToken", res.accessToken, {
    httpOnly: true,
    expires: new Date(
      Date.now() + ms(envConfig?.ACCESS_TOKEN_EXPIRES_IN as StringValue),
    ),
    sameSite: "strict",
    secure: false,
  });
  cookieStore.set("refreshToken", res.refreshToken, {
    httpOnly: true,
    expires: new Date(
      Date.now() + ms(envConfig?.REFRESH_TOKEN_EXPIRES_IN as StringValue),
    ),
    sameSite: "strict",
    secure: false,
  });
  return Response.json(res);
}
