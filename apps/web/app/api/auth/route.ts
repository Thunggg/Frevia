import ms, { StringValue } from "ms";
import { cookies } from "next/headers";
import { envConfig } from "../../../configs/validate-env";

export async function POST(request: Request) {
  const body = await request.json();

  // Gọi NestJS server-to-server — không qua browser, nên không có
  const nestRes = await fetch(`${envConfig?.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // để browser gửi/nhận cookie same-origin
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await nestRes.json();

  // Nếu thành công thì set cookie
  if (data.success) {
    const cookieStore = await cookies();

    cookieStore.set("accessToken", data.data.accessToken, {
      httpOnly: true,
      secure: envConfig?.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(
        Date.now() +
          (ms(envConfig?.ACCESS_TOKEN_EXPIRES_IN as StringValue) as number),
      ),
    });

    cookieStore.set("refreshToken", data.data.refreshToken, {
      httpOnly: true,
      secure: envConfig?.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(
        Date.now() +
          (ms(envConfig?.REFRESH_TOKEN_EXPIRES_IN as StringValue) as number),
      ),
    });
  }

  // Không trả token về client nữa — client không cần biết token,
  // chỉ cần biết login thành công hay chưa.
  return Response.json(data);
}
