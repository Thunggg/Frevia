import "server-only";

import { cookies } from "next/headers";
import {
  accessTokenNeedsRefresh,
  exchangeRefreshToken,
} from "@/lib/auth-session";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  IdentityVerificationStatusType,
} from "@shared/types";

const accountProfileServerRequest = {
  /**
   * GET /api/identity-verifications/status (server-side).
   * Dùng trong layout dashboard để chặn freelancer chưa xác minh danh tính.
   * Throw khi backend lỗi/thất bại (fail-open ở caller); trả null khi hết session.
   */
  async getIdentityStatus(): Promise<IdentityVerificationStatusType | null> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!envConfig?.NESTJS_API_URL || (!accessToken && !refreshToken)) {
      return null;
    }

    if (accessTokenNeedsRefresh(accessToken) && refreshToken) {
      const refreshed = await exchangeRefreshToken(refreshToken);
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
      }
    }

    if (!accessToken) {
      return null;
    }

    const doFetch = () =>
      fetch(`${envConfig.NESTJS_API_URL}/api/identity-verifications/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

    let res = await doFetch();
    if (res.status === 401 && refreshToken) {
      const refreshed = await exchangeRefreshToken(refreshToken);
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
        res = await doFetch();
      }
    }

    if (!res.ok) {
      throw new Error(`Identity status request failed (${res.status}).`);
    }

    const data = (await res.json()) as ApiResponse<
      IdentityVerificationStatusType
    >;
    if (!data.success) {
      throw new Error("Identity status request failed.");
    }

    return data.data;
  },
};

export default accountProfileServerRequest;
