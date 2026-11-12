import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumCategoryDetailResponseType,
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";

async function forumServerFetch<T>(
  url: string,
  revalidateTime: number = 60,
  tags?: string[],
): Promise<T | null> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    next: {
      revalidate: revalidateTime,
      ...(tags ? { tags } : {}),
    },
  });

  const data = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}

/** Server-side forum reads (RSC) with Request Memoization & Time-based Revalidation. */
const forumServerRequest = {
  getCategories: cache(async (): Promise<ForumCategoryListResponseType> => {
    return (
      (await forumServerFetch<ForumCategoryListResponseType>(
        "/api/forums/categories",
        60,
        ["forum-categories"],
      )) ?? []
    );
  }),

  getCategoryById: cache((categoryId: number) => {
    return forumServerFetch<ForumCategoryDetailResponseType>(
      `/api/forums/categories/${categoryId}`,
      60,
    );
  }),

  getTopCategories: cache(
    async (limit: number = 3): Promise<ForumCategoryTopListResponseType> => {
      return (
        (await forumServerFetch<ForumCategoryTopListResponseType>(
          `/api/forums/categories/top?limit=${limit}`,
          120,
        )) ?? []
      );
    },
  ),

  getTopUsers: cache(
    async (limit: number = 5): Promise<ForumTopActiveUserListResponseType> => {
      return (
        (await forumServerFetch<ForumTopActiveUserListResponseType>(
          `/api/forums/users/top?limit=${limit}`,
          120,
        )) ?? []
      );
    },
  ),
};

export default forumServerRequest;
