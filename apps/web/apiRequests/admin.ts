import {
  AdminClientProfileResponseType,
  AdminCreatePortfolioItemBodyType,
  AdminCreateUserBodyType,
  AdminCreateUserResponseType,
  AdminReplaceFreelancerSkillsBodyType,
  AdminSkillCatalogListType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateFreelancerProfileBodyType,
  AdminUpdatePortfolioItemBodyType,
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
  MessageResType,
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

  // Lấy catalog Skill active (dùng cho dialog chọn kỹ năng)
  getSkillCatalog: () =>
    http.get<AdminSkillCatalogListType>("/api/users/skills-catalog"),

  getUserById: (id: number) =>
    http.get<AdminUserDetailResponseType>(`/api/users/${id}`),

  // ====== Admin quản lý User ======
  // Tạo tài khoản mới
  createUser: (body: AdminCreateUserBodyType) =>
    http.post<AdminCreateUserResponseType>("/api/users", body),

  // Sửa thông tin chung account (email / displayName / isBanned)
  updateUser: (id: number, body: AdminUpdateUserBodyType) =>
    http.patch<AdminUpdateUserResponseType>(`/api/users/${id}`, body),

  // Sửa hồ sơ Client (công ty) của 1 user
  updateClientProfile: (id: number, body: AdminUpdateClientProfileBodyType) =>
    http.patch<AdminClientProfileResponseType>(
      `/api/users/${id}/client-profile`,
      body,
    ),

  // ====== Admin sửa hồ sơ FREELANCER ======
  // Giới thiệu (title + bio)
  updateFreelancerProfile: (
    id: number,
    body: AdminUpdateFreelancerProfileBodyType,
  ) =>
    http.patch<MessageResType>(`/api/users/${id}/freelancer-profile`, body),

  // Thay thế toàn bộ kỹ năng (danh sách chọn từ catalog)
  replaceFreelancerSkills: (
    id: number,
    body: AdminReplaceFreelancerSkillsBodyType,
  ) =>
    http.put<MessageResType>(`/api/users/${id}/freelancer-profile/skills`, body),

  // Portfolio items (tạo mới / sửa / xoá mềm)
  createPortfolioItem: (
    id: number,
    body: AdminCreatePortfolioItemBodyType,
  ) =>
    http.post<MessageResType>(
      `/api/users/${id}/freelancer-profile/portfolio-items`,
      body,
    ),

  updatePortfolioItem: (
    id: number,
    itemId: number,
    body: AdminUpdatePortfolioItemBodyType,
  ) =>
    http.patch<MessageResType>(
      `/api/users/${id}/freelancer-profile/portfolio-items/${itemId}`,
      body,
    ),

  deletePortfolioItem: (id: number, itemId: number) =>
    http.delete<MessageResType>(
      `/api/users/${id}/freelancer-profile/portfolio-items/${itemId}`,
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
