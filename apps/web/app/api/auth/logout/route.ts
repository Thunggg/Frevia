import { clearAuthCookies } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // Nest logout là public: chỉ cần body { refreshToken } để revoke session.
  // Không chặn xoá cookie phía Next kể cả khi Nest lỗi.
  if (refreshToken) {
    await fetch(`${envConfig?.NESTJS_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  clearAuthCookies(cookieStore);

  return Response.json({ success: true });
}
