import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumCategoryDetailResponseType,
  ForumPostListResponseType,
  ForumPostFilterType,
  ViewForumPostDetailResponseType,
  ForumCommentListResponseType,
  ForumLikeDetailResponseType,
  ForumTopPostListResponseType,
} from "@shared/types";
import { cookies } from "next/headers";

export async function getForumCategoryDetailServer(
  categoryId: number,
): Promise<ForumCategoryDetailResponseType | null> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/categories/${categoryId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumCategoryDetailResponseType>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}

export async function getForumPostsServer(
  filter: ForumPostFilterType,
): Promise<ForumPostListResponseType> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(filter.page));
  searchParams.set("limit", String(filter.limit));
  if (filter.categoryId !== undefined) {
    searchParams.set("categoryId", String(filter.categoryId));
  }
  if (filter.userId !== undefined) {
    searchParams.set("userId", String(filter.userId));
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/posts?${searchParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumPostListResponseType>;

  if (!res.ok || !data.success) {
    return { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  return data.data;
}

export async function getForumPostDetailServer(
  postId: number,
): Promise<ViewForumPostDetailResponseType | null> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/posts/${postId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ViewForumPostDetailResponseType>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}

export async function getForumCommentsServer(
  postId: number,
  page: number = 1,
  limit: number = 5,
): Promise<ForumCommentListResponseType> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return {
      comments: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    };
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/posts/${postId}/comments?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumCommentListResponseType>;

  if (!res.ok || !data.success) {
    return {
      comments: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    };
  }

  return data.data;
}

export async function getForumPostLikesServer(
  postId: number,
): Promise<ForumLikeDetailResponseType> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return [];
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/posts/${postId}/like`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumLikeDetailResponseType>;

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}

export async function getTopInteractedPostsServer(
  limit: number = 3,
): Promise<ForumTopPostListResponseType> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return [];
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/posts/top?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumTopPostListResponseType>;

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}
