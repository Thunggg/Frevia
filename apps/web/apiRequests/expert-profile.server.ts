import "server-only";

import { cache } from "react";
import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  PublicExpertListType,
  PublicExpertType,
} from "@shared/types";

async function publicExpertFetch<T>(
  path: string,
  revalidateTime: number = 120,
): Promise<T | null> {
  if (!envConfig?.NESTJS_API_URL) return null;

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${path}`, {
      next: { revalidate: revalidateTime },
    });
    const payload = (await response.json()) as ApiResponse<T>;
    return response.ok && payload.success ? payload.data : null;
  } catch {
    return null;
  }
}

const expertProfileServerRequest = {
  getExperts: cache(
    (params: {
      page?: number;
      limit?: number;
      search?: string;
      expertise?: string;
    }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.set(key, String(value));
        }
      });
      const query = searchParams.toString();
      return publicExpertFetch<PublicExpertListType>(
        `/api/experts${query ? `?${query}` : ""}`,
        60,
      );
    },
  ),

  getExpert: cache((id: number) => {
    return publicExpertFetch<PublicExpertType>(`/api/experts/${id}`, 120);
  }),
};

export default expertProfileServerRequest;
