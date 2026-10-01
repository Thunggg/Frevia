import {
  ForumAdminStatsType,
  ForumPostListResponseType,
  ForumAdminCommentListResponseType,
  ForumReportListResponseType,
  ForumReportType,
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
  getStats: () =>
    http.get<ForumAdminStatsType>("/api/forums/admin/stats"),

  getPosts: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number,
  ) => {
    const query = buildQueryString({ page, limit, search, categoryId });
    return http.get<ForumPostListResponseType>(
      `/api/forums/posts${query}`,
    );
  },

  deletePost: (postId: number) =>
    http.delete<unknown>(`/api/forums/posts/${postId}`),

  getComments: (page: number = 1, limit: number = 10, search?: string) => {
    const query = buildQueryString({ page, limit, search });
    return http.get<ForumAdminCommentListResponseType>(
      `/api/forums/admin/comments${query}`,
    );
  },

  deleteComment: (postId: number, commentId: number) =>
    http.delete<unknown>(
      `/api/forums/posts/${postId}/comments/${commentId}`,
    ),

  getReports: (
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) => {
    const query = buildQueryString({ page, limit, status, search });
    return http.get<ForumReportListResponseType>(
      `/api/forums/reports${query}`,
    );
  },

  updateReportStatus: (reportId: number, status: string) =>
    http.patch<ForumReportType>(
      `/api/forums/reports/${reportId}/status`,
      { status },
    ),
};
