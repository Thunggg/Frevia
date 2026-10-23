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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(status: number, message: string, locale: Locale) {
  return Response.json(
    translateBackendPayload(
      {
        success: false,
        error: { code: String(status), message },
        timestamp: new Date().toISOString(),
      },
      locale,
    ),
    { status },
  );
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Bad Request", locale);
  }

  if (!envConfig?.NESTJS_API_URL) {
    return errorResponse(503, "Service Unavailable", locale);
  }

  let nestRes: Response;
  try {
    nestRes = await fetch(`${envConfig.NESTJS_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return errorResponse(503, "Service Unavailable", locale);
  }

  let data: unknown;
  try {
    data = await nestRes.json();
  } catch {
    return errorResponse(502, "Bad Gateway", locale);
  }

  const localizedData = translateBackendPayload(data, locale);

  if (!isRecord(data) || data.success !== true) {
    return Response.json(localizedData, { status: nestRes.status });
  }

  if (
    !isRecord(data.data) ||
    typeof data.data.accessToken !== "string" ||
    typeof data.data.refreshToken !== "string"
  ) {
    return errorResponse(502, "Bad Gateway", locale);
  }

  setAuthCookies(cookieStore, {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  });

  // Không trả token về client — client chỉ cần biết login thành công hay chưa
  return Response.json({ success: true });
}
