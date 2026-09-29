import ms, { StringValue } from "ms";
import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

export async function POST(request: Request) {
  const body = await request.json();

  const nestRes = await fetch(`${envConfig?.NESTJS_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await nestRes.json();

  if (!data.success) {
    return Response.json(data, { status: nestRes.status });
  }

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

  // Không trả token về client — client chỉ cần biết login thành công hay chưa
  return Response.json({ success: true });
}
