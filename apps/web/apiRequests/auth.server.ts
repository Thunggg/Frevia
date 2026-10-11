import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type { ApiResponse, GetMeResType } from "@shared/types";

const authServerRequest = {
  async getMe(): Promise<GetMeResType | null> {
    const accessToken = (await cookies()).get("accessToken")?.value;

    if (!accessToken || !envConfig?.NESTJS_API_URL) {
      return null;
    }

    const res = await fetch(`${envConfig.NESTJS_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const data = (await res.json()) as ApiResponse<GetMeResType>;

    if (!res.ok || !data.success) {
      return null;
    }

    return data.data;
  },
};

export default authServerRequest;
