import { refreshAuthTokens } from "@/lib/auth-session";
import { cookies } from "next/headers";

function isJwtExpiringSoon(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return true;
    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    ) as { exp?: number };
    if (typeof decoded.exp !== "number") return false;
    return decoded.exp * 1000 <= Date.now() + bufferSeconds * 1000;
  } catch {
    return true;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value ?? null;

  if (!accessToken || isJwtExpiringSoon(accessToken)) {
    const refreshed = await refreshAuthTokens(cookieStore);
    if (refreshed?.accessToken) {
      accessToken = refreshed.accessToken;
    }
  }

  if (!accessToken) {
    return Response.json(
      { success: false, error: { message: "Authentication required." } },
      { status: 401 },
    );
  }

  return Response.json({
    success: true,
    data: { token: accessToken },
  });
}
