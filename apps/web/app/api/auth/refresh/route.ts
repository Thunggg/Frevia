import ms, { StringValue } from "ms";
import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return Response.json(
      { success: false, message: "Không tìm thấy refresh token" },
      { status: 401 },
    );
  }

  // Server-to-server fetch KHÔNG tự gửi cookie của browser,
  // nên phải tự forward refreshToken qua header Cookie thủ công
  // (khớp với cách NestJS /auth/refresh đọc refresh token từ cookie cho web).
  const nestRes = await fetch(`${envConfig?.NESTJS_API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `refreshToken=${refreshToken}`,
    },
  });

  const data = await nestRes.json();

  if (!data.success) {
    // Refresh token không hợp lệ / đã bị revoke (reuse detection) -> xoá cookie,
    // buộc user đăng nhập lại thay vì giữ cookie rác.
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return Response.json(data, { status: nestRes.status });
  }

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

  return Response.json({ success: true });
}
