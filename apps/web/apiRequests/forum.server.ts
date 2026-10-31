import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumCategoryDetailResponseType,
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";

async function forumServerFetch<T>(url: string): Promise<T | null> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}

/** Server-side forum reads (RSC). Mutations stay in `apiRequests/forum.ts`. */
const forumServerRequest = {
  async getCategories(): Promise<ForumCategoryListResponseType> {
    return (
      (await forumServerFetch<ForumCategoryListResponseType>(
        "/api/forums/categories",
      )) ?? []
    );
  },

  getCategoryById(categoryId: number) {
    return forumServerFetch<ForumCategoryDetailResponseType>(
      `/api/forums/categories/${categoryId}`,
    );
  },

  async getTopCategories(
    limit: number = 3,
  ): Promise<ForumCategoryTopListResponseType> {
    return (
      (await forumServerFetch<ForumCategoryTopListResponseType>(
        `/api/forums/categories/top?limit=${limit}`,
      )) ?? []
    );
  },

  async getTopUsers(
    limit: number = 5,
  ): Promise<ForumTopActiveUserListResponseType> {
    return (
      (await forumServerFetch<ForumTopActiveUserListResponseType>(
        `/api/forums/users/top?limit=${limit}`,
      )) ?? []
    );
  },
};

export default forumServerRequest;
