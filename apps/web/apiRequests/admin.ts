import {
  AdminClientProfileResponseType,
  AdminCreateUserBodyType,
  AdminCreateUserResponseType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateUserBodyType,
  AdminUpdateUserResponseType,
  CreateForumCategoryBodyType,
  UpdateForumCategoryBodyType,
  DeleteForumCategoryResponseType,
  ForumAdminCommentListResponseType,
  ForumAdminCommentType,
  ForumCategoryType,
  ForumPostListResponseType,
  ForumPostType,
  ForumReportListResponseType,
  ForumReportType,
  IdentityVerificationAdminDetailType,
  IdentityVerificationAdminListResponseType,
  PendingForumPostListResponseType,
  ReviewForumPostResponseType,
  AdminUserListResponseType,
  AdminUserDetailResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

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
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const query = buildQueryString(params || {});
    return http.get<AdminUserListResponseType>(`/api/users${query}`);
  },

  getUserById: (id: number) =>
    http.get<AdminUserDetailResponseType>(`/api/users/${id}`),

  createUser: (body: AdminCreateUserBodyType) =>
    http.post<AdminCreateUserResponseType>("/api/users", body),

  updateUser: (id: number, body: AdminUpdateUserBodyType) =>
    http.patch<AdminUpdateUserResponseType>(`/api/users/${id}`, body),

  updateClientProfile: (id: number, body: AdminUpdateClientProfileBodyType) =>
    http.patch<AdminClientProfileResponseType>(
      `/api/users/${id}/client-profile`,
      body,
    ),

  createCategory: (body: CreateForumCategoryBodyType) =>
    http.post<ForumCategoryType>("/api/forums/admin/categories", body),

  updateCategory: (id: number, body: UpdateForumCategoryBodyType) =>
    http.patch<ForumCategoryType>(`/api/forums/admin/categories/${id}`, body),

  deleteCategory: (id: number) =>
    http.delete<DeleteForumCategoryResponseType>(
      `/api/forums/admin/categories/${id}`,
    ),

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
