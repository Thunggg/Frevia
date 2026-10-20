import "server-only";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  PublicExpertListType,
  PublicExpertType,
} from "@shared/types";

async function publicExpertFetch<T>(path: string): Promise<T | null> {
  if (!envConfig?.NESTJS_API_URL) return null;

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${path}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiResponse<T>;
    return response.ok && payload.success ? payload.data : null;
  } catch {
    return null;
  }
}

const expertProfileServerRequest = {
  getExperts(params: {
    page?: number;
    limit?: number;
    search?: string;
    expertise?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    });
    const query = searchParams.toString();
    return publicExpertFetch<PublicExpertListType>(
      `/api/experts${query ? `?${query}` : ""}`,
    );
  },

  getExpert(id: number) {
    return publicExpertFetch<PublicExpertType>(`/api/experts/${id}`);
  },
};

export default expertProfileServerRequest;
