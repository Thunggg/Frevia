import { envConfig } from "@/configs/validate-env";
import { authCookieBaseOptions, refreshAuthTokens } from "@/lib/auth-session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;
  const apiUrl = envConfig?.NESTJS_API_URL;
  if (!accessToken || !apiUrl) {
    return Response.json(
      { success: false, error: { message: "Authentication required." } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const forward = (token: string) =>
    fetch(`${apiUrl}/api/auth/switch-role`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let nestResponse = await forward(accessToken);
  if (nestResponse.status === 401) {
    const refreshed = await refreshAuthTokens(cookieStore);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      nestResponse = await forward(accessToken);
    }
  }
  const data = await nestResponse.json();

  if (!nestResponse.ok || !data?.success || !data?.data?.accessToken) {
    return Response.json(data, { status: nestResponse.status });
  }

  cookieStore.set(
    "accessToken",
    data.data.accessToken,
    authCookieBaseOptions("access"),
  );

  return Response.json({
    success: true,
    data: { roleName: body.role },
  });
}
