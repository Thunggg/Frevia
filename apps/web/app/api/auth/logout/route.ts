import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // Báo NestJS xoá refresh token trong DB (hard delete theo thiết kế của bạn),
  // không chặn việc xoá cookie phía Next kể cả khi bước này lỗi.
  if (accessToken) {
    await fetch(`${envConfig?.NESTJS_API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
  }

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  return Response.json({ success: true });
}
