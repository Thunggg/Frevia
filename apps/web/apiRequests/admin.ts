import { http } from "@/lib/http";
import {
  CreateForumCategoryBodyType,
  ForumAdminCommentListResponseType,
  ForumAdminCommentType,
  ForumAdminStatsType,
  ForumCategoryType,
  ForumPostListResponseType,
  ForumPostType,
  ForumReportListResponseType,
  ForumReportType,
  IdentityVerificationAdminDetailType,
  IdentityVerificationAdminListResponseType,
  PendingForumPostListResponseType,
  ReviewForumPostResponseType,
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

export const adminApiRequest = {
  getStats: () => http.get<ForumAdminStatsType>("/api/forums/admin/stats"),

  createCategory: (body: CreateForumCategoryBodyType) =>
    http.post<ForumCategoryType>("/api/forums/admin/categories", body),

  getPosts: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number,
  ) => {
    const query = buildQueryString({ page, limit, search, categoryId });
    return http.get<ForumPostListResponseType>(`/api/forums/posts${query}`);
  },

  deletePost: (postId: number) =>
    http.delete<unknown>(`/api/forums/posts/${postId}`),

  getPendingPosts: (page: number = 1, limit: number = 10) => {
    const query = buildQueryString({ page, limit });
    return http.get<PendingForumPostListResponseType>(
      `/api/forums/admin/pending-posts${query}`,
    );
  },

  approvePost: (postId: number) =>
    http.patch<ReviewForumPostResponseType>(
      `/api/forums/admin/posts/${postId}/approve`,
      {},
    ),

  rejectPost: (postId: number) =>
    http.patch<ReviewForumPostResponseType>(
      `/api/forums/admin/posts/${postId}/reject`,
      {},
    ),

  getComments: (page: number = 1, limit: number = 10, search?: string) => {
    const query = buildQueryString({ page, limit, search });
    return http.get<ForumAdminCommentListResponseType>(
      `/api/forums/admin/comments${query}`,
    );
  },

  deleteComment: (postId: number, commentId: number) =>
    http.delete<unknown>(`/api/forums/posts/${postId}/comments/${commentId}`),

  restorePost: (postId: number) =>
    http.patch<ForumPostType>(
      `/api/forums/admin/trash/posts/${postId}/restore`,
      {},
    ),

  restoreComment: (commentId: number) =>
    http.patch<ForumAdminCommentType>(
      `/api/forums/admin/trash/comments/${commentId}/restore`,
      {},
    ),

  getReports: (
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) => {
    const query = buildQueryString({ page, limit, status, search });
    return http.get<ForumReportListResponseType>(`/api/forums/reports${query}`);
  },

  updateReportStatus: (reportId: number, status: string) =>
    http.patch<ForumReportType>(`/api/forums/reports/${reportId}/status`, {
      status,
    }),

  getIdentityVerifications: (
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) => {
    const query = buildQueryString({ page, limit, status, search });
    return http.get<IdentityVerificationAdminListResponseType>(
      `/api/admin/identity-verifications${query}`,
    );
  },

  getIdentityVerificationDetail: (id: number) =>
    http.get<IdentityVerificationAdminDetailType>(
      `/api/admin/identity-verifications/${id}`,
    ),

  approveIdentityVerification: (id: number, reviewNotes?: string | null) =>
    http.patch<IdentityVerificationAdminDetailType>(
      `/api/admin/identity-verifications/${id}/approve`,
      { reviewNotes: reviewNotes ?? null },
    ),

  rejectIdentityVerification: (id: number, reviewNotes?: string | null) =>
    http.patch<IdentityVerificationAdminDetailType>(
      `/api/admin/identity-verifications/${id}/reject`,
      { reviewNotes: reviewNotes ?? null },
    ),
};
