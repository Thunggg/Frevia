import { clearAuthCookies } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // Nest yêu cầu body { refreshToken } + Bearer access (AuthGuard).
  // Không chặn xoá cookie phía Next kể cả khi Nest lỗi.
  if (accessToken && refreshToken) {
    await fetch(`${envConfig?.NESTJS_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  clearAuthCookies(cookieStore);

  return Response.json({ success: true });
}
