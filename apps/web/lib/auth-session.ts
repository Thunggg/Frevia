import { envConfig } from "@/configs/validate-env";
import ms, { StringValue } from "ms";
import { cookies, headers } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Single-flight map keyed by refreshToken so concurrent 401s from the SAME user
 * share one refresh call, while concurrent users NEVER receive each other's tokens.
 */
const refreshInFlightByToken = new Map<
  string,
  Promise<RefreshedTokens | null>
>();

/**
 * Đọc accessToken trong Server Components: ưu tiên token mới mà proxy.ts
 * vừa refresh trong cùng request (`x-refreshed-access-token`) trước cookie cũ.
 */
export async function getServerAccessToken(): Promise<string | undefined> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return (
    headerStore.get("x-refreshed-access-token") ??
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("access_token")?.value
  );
}

// Hàm để set các cookies accessToken và refreshToken
export function setAuthCookies(
  cookieStore: CookieStore,
  tokens: RefreshedTokens,
) {
  cookieStore.set(
    "accessToken",
    tokens.accessToken,
    authCookieBaseOptions("access"),
  );
  cookieStore.set(
    "refreshToken",
    tokens.refreshToken,
    authCookieBaseOptions("refresh"),
  );
}

// Hàm để xóa các cookies accessToken và refreshToken
export function clearAuthCookies(cookieStore: CookieStore) {
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/** Cookie options dùng chung (Route Handler + middleware response). */
export function authCookieBaseOptions(kind: "access" | "refresh") {
  const ttl = ms(
    (kind === "access"
      ? envConfig?.ACCESS_TOKEN_EXPIRES_IN
      : envConfig?.REFRESH_TOKEN_EXPIRES_IN) as StringValue,
  ) as number;

  return {
    httpOnly: true as const,
    secure: envConfig?.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(ttl / 1000),
    expires: new Date(Date.now() + ttl),
  };
}

// Decode access token và kiểm tra xem token có cần refresh không
export function accessTokenNeedsRefresh(
  accessToken: string | undefined,
): boolean {
  if (!accessToken) return true;
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return true;

    // Decode base64
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");

    // Parse payload
    const payload = JSON.parse(atob(base64)) as { exp?: number };

    // Kiểm tra xem exp có phải là number không
    if (typeof payload.exp !== "number") return true;

    // Yêu cầu refresh nếu token hết hạn trước 10s
    return payload.exp * 1000 <= Date.now() + 10_000;
  } catch {
    return true;
  }
}

// Hàm để exchange refresh token
export async function exchangeRefreshToken(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  if (!envConfig?.NESTJS_API_URL) return null;

  const nestRes = await fetch(
    `${envConfig.NESTJS_API_URL}/api/auth/refresh-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  const data = await nestRes.json().catch(() => null);
  if (!nestRes.ok || !data?.success || !data?.data?.accessToken) {
    return null;
  }

  return {
    accessToken: data.data.accessToken as string,
    refreshToken: data.data.refreshToken as string,
  };
}

// Hàm để refresh các tokens sử dụng cookie store + per-token single-flight.
export async function refreshAuthTokens(
  cookieStore: CookieStore,
): Promise<RefreshedTokens | null> {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken) {
    clearAuthCookies(cookieStore);
    return null;
  }

  let pending = refreshInFlightByToken.get(refreshToken);
  if (!pending) {
    pending = exchangeRefreshToken(refreshToken).finally(() => {
      refreshInFlightByToken.delete(refreshToken);
    });
    refreshInFlightByToken.set(refreshToken, pending);
  }

  const tokens = await pending;
  if (!tokens) {
    clearAuthCookies(cookieStore);
    return null;
  }

  setAuthCookies(cookieStore, tokens);
  return tokens;
}
