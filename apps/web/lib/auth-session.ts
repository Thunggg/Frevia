import { envConfig } from "@/configs/validate-env";
import ms, { StringValue } from "ms";
import { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

let refreshInFlight: Promise<RefreshedTokens | null> | null = null;

// Hàm để set các cookies accessToken và refreshToken
export function setAuthCookies(
  cookieStore: CookieStore,
  tokens: RefreshedTokens,
) {
  const accessTtl = ms(
    envConfig?.ACCESS_TOKEN_EXPIRES_IN as StringValue,
  ) as number;
  const refreshTtl = ms(
    envConfig?.REFRESH_TOKEN_EXPIRES_IN as StringValue,
  ) as number;

  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: envConfig?.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + accessTtl),
  });

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: envConfig?.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + refreshTtl),
  });
}

// Hàm để xóa các cookies accessToken và refreshToken
export function clearAuthCookies(cookieStore: CookieStore) {
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
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

// Hàm để refresh các tokens sử dụng cookie store + single-flight (parallel 401s share one refresh).
export async function refreshAuthTokens(
  cookieStore: CookieStore,
): Promise<RefreshedTokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(cookieStore).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(
  cookieStore: CookieStore,
): Promise<RefreshedTokens | null> {
  const refreshToken = cookieStore.get("refreshToken")?.value;
  // Nếu không có refresh token thì xóa các cookies và trả về null
  if (!refreshToken) {
    clearAuthCookies(cookieStore);
    return null;
  }

  const tokens = await exchangeRefreshToken(refreshToken);
  // Nếu không thể exchange refresh token thì xóa các cookies và trả về null
  if (!tokens) {
    clearAuthCookies(cookieStore);
    return null;
  }

  setAuthCookies(cookieStore, tokens);
  return tokens;
}
