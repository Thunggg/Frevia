import "server-only";

import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";
import type { RecommendedJobResponseType } from "@shared/types";

export const recommendationServerRequest = {
  async getRecommendedJobs(limit: number = 10): Promise<RecommendedJobResponseType | null> {
    const baseUrl = envConfig?.NESTJS_API_URL;
    if (!baseUrl) return null;

    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("accessToken")?.value ??
      cookieStore.get("access_token")?.value;

    if (!accessToken) return null;

    try {
      const response = await fetch(`${baseUrl}/api/recommendations/jobs?limit=${limit}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) return null;
      const res = (await response.json()) as { data?: RecommendedJobResponseType["data"] | RecommendedJobResponseType };
      if (res && "data" in res) {
        if (Array.isArray(res.data)) {
          return { data: res.data };
        }
        if (typeof res.data === "object" && res.data !== null && "data" in res.data && Array.isArray((res.data as any).data)) {
          return res.data as RecommendedJobResponseType;
        }
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default recommendationServerRequest;

