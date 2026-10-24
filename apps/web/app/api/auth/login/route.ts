import { envConfig } from "@/configs/validate-env";
import { translateBackendPayload } from "@/i18n/backend-message";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { setAuthCookies } from "@/lib/auth-session";
import { cookies } from "next/headers";

const resolveLocale = (value: string | undefined): Locale =>
  isLocale(value) ? value : defaultLocale;

export async function POST(request: Request) {
  const body = await request.json();

  const nestRes = await fetch(`${envConfig?.NESTJS_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await nestRes.json();

  if (!data.success) {
    const cookieStore = await cookies();
    const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
    return Response.json(translateBackendPayload(data, locale), {
      status: nestRes.status,
    });
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  });

  // Không trả token về client — client chỉ cần biết login thành công hay chưa
  return Response.json({ success: true });
}
