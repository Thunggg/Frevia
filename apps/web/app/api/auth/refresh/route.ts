import { cookies } from "next/headers";
import { refreshAuthTokens } from "@/lib/auth-session";

export async function POST() {
  const cookieStore = await cookies();
  const tokens = await refreshAuthTokens(cookieStore);

  if (!tokens) {
    return Response.json(
      { success: false, message: "Không thể làm mới phiên đăng nhập" },
      { status: 401 },
    );
  }

  return Response.json({ success: true });
}
