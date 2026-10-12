import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumAdminStatsType,
  ForumPostListResponseType,
  ForumAdminCommentListResponseType,
  ForumReportListResponseType,
  IdentityVerificationAdminListResponseType,
  PendingForumPostListResponseType,
  ForumTrashPostListResponseType,
  ForumTrashCommentListResponseType,
} from "@shared/types";

function buildQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

async function adminServerFetch<T>(url: string): Promise<T | null> {
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

/** Server-side admin reads (RSC). Mutations stay in `apiRequests/admin.ts`. */
const adminServerRequest = {
  getStats() {
    return adminServerFetch<ForumAdminStatsType>("/api/forums/admin/stats");
  },

  async getPosts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number,
  ): Promise<ForumPostListResponseType> {
    const query = buildQueryString({ page, limit, search, categoryId });
    const result = await adminServerFetch<ForumPostListResponseType>(
      `/api/forums/posts${query}`,
    );
    return (
      result ?? {
        posts: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getComments(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<ForumAdminCommentListResponseType> {
    const query = buildQueryString({ page, limit, search });
    const result = await adminServerFetch<ForumAdminCommentListResponseType>(
      `/api/forums/admin/comments${query}`,
    );
    return (
      result ?? {
        comments: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getPendingPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<PendingForumPostListResponseType> {
    const query = buildQueryString({ page, limit });
    const result = await adminServerFetch<PendingForumPostListResponseType>(
      `/api/forums/admin/pending-posts${query}`,
    );
    return (
      result ?? {
        posts: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getTrashPosts(
    page: number = 1,
    limit: number = 10,
  ): Promise<ForumTrashPostListResponseType> {
    const query = buildQueryString({ page, limit });
    const result = await adminServerFetch<ForumTrashPostListResponseType>(
      `/api/forums/admin/trash/posts${query}`,
    );
    return (
      result ?? {
        posts: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getTrashComments(
    page: number = 1,
    limit: number = 10,
  ): Promise<ForumTrashCommentListResponseType> {
    const query = buildQueryString({ page, limit });
    const result = await adminServerFetch<ForumTrashCommentListResponseType>(
      `/api/forums/admin/trash/comments${query}`,
    );
    return (
      result ?? {
        comments: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getReports(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ): Promise<ForumReportListResponseType> {
    const query = buildQueryString({ page, limit, status, search });
    const result = await adminServerFetch<ForumReportListResponseType>(
      `/api/forums/reports${query}`,
    );
    return (
      result ?? {
        reports: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },

  async getIdentityVerifications(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ): Promise<IdentityVerificationAdminListResponseType> {
    const query = buildQueryString({ page, limit, status, search });
    const result = await adminServerFetch<IdentityVerificationAdminListResponseType>(
      `/api/admin/identity-verifications${query}`,
    );
    return (
      result ?? {
        documents: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    );
  },
};

export default adminServerRequest;
