import "server-only";

import { cookies } from "next/headers";
import {
  accessTokenNeedsRefresh,
  exchangeRefreshToken,
} from "@/lib/auth-session";

import { envConfig } from "@/configs/validate-env";
import type { ApiResponse, GetMeResType } from "@shared/types";

const authServerRequest = {
  async getMe(): Promise<GetMeResType | null> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!envConfig?.NESTJS_API_URL || (!accessToken && !refreshToken)) {
      return null;
    }

    try {
      if (accessTokenNeedsRefresh(accessToken) && refreshToken) {
        const refreshed = await exchangeRefreshToken(refreshToken);
        if (refreshed?.accessToken) {
          accessToken = refreshed.accessToken;
        }
      }

      if (!accessToken) {
        return null;
      }

      let res = await fetch(`${envConfig.NESTJS_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 401 && refreshToken) {
        const refreshed = await exchangeRefreshToken(refreshToken);
        if (refreshed?.accessToken) {
          accessToken = refreshed.accessToken;
          res = await fetch(`${envConfig.NESTJS_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          });
        }
      }

      const data = (await res.json()) as ApiResponse<GetMeResType>;

      if (!res.ok || !data.success) {
        return null;
      }

      if (data.data.isBanned) {
        return null;
      }

      return data.data;
    } catch (error) {
      if (
        error instanceof TypeError ||
        error instanceof SyntaxError ||
        (error instanceof Error &&
          ["AbortError", "TimeoutError"].includes(error.name))
      ) {
        console.error("Unable to read the current user: backend unavailable.");
        return null;
      }
      throw error;
    }
  },
};

export default authServerRequest;
