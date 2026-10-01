import {
  ForumCategoryListResponseType,
  ForumCategoryDetailResponseType,
  ForumPostListResponseType,
  ForumPostFilterType,
  ViewForumPostDetailResponseType,
  ForumCommentListResponseType,
  ForumCommentType,
  ToggleLikeResponseType,
  ToggleLikeCommentType,
  ForumLikeDetailResponseType,
  ForumPostType,
  CreateForumPostType,
  UpdateForumPostType,
  ForumReportType,
  ForumTopPostListResponseType,
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

export const forumApiRequest = {
  getCategories: () =>
    http.get<ForumCategoryListResponseType>("/api/forums/categories"),

  getCategoryById: (categoryId: number) =>
    http.get<ForumCategoryDetailResponseType>(
      `/api/forums/categories/${categoryId}`,
    ),

  getPosts: (filter: ForumPostFilterType) => {
    const query = buildQueryString({
      page: filter.page,
      limit: filter.limit,
      categoryId: filter.categoryId,
      userId: filter.userId,
    });
    return http.get<ForumPostListResponseType>(`/api/forums/posts${query}`);
  },

  getPostDetail: (postId: number) =>
    http.get<ViewForumPostDetailResponseType>(`/api/forums/posts/${postId}`),

  createPost: (data: CreateForumPostType) =>
    http.post<ForumPostType>("/api/forums/posts", data),

  updatePost: (postId: number, data: UpdateForumPostType) =>
    http.patch<ForumPostType>(`/api/forums/posts/${postId}`, data),

  deletePost: (postId: number) =>
    http.delete<unknown>(`/api/forums/posts/${postId}`),

  getComments: (postId: number, page: number = 1, limit: number = 5) =>
    http.get<ForumCommentListResponseType>(
      `/api/forums/posts/${postId}/comments?page=${page}&limit=${limit}`,
    ),

  createComment: (postId: number, content: string) =>
    http.post<ForumCommentType>(`/api/forums/posts/${postId}/comments`, {
      content,
    }),

  editComment: (postId: number, commentId: number, content: string) =>
    http.patch<ForumCommentType>(
      `/api/forums/posts/${postId}/comments/${commentId}`,
      { content },
    ),

  deleteComment: (postId: number, commentId: number) =>
    http.delete<ForumCommentType>(
      `/api/forums/posts/${postId}/comments/${commentId}`,
    ),

  toggleLikePost: (postId: number) =>
    http.post<ToggleLikeResponseType>(`/api/forums/posts/${postId}/like`, {}),

  toggleLikeComment: (postId: number, commentId: number) =>
    http.post<ToggleLikeCommentType>(
      `/api/forums/posts/${postId}/comments/${commentId}/like`,
      {},
    ),

  getPostLikes: (postId: number) =>
    http.get<ForumLikeDetailResponseType>(`/api/forums/posts/${postId}/like`),

  reportPost: (postId: number, reason: string) =>
    http.post<ForumReportType>(`/api/forums/posts/${postId}/reports`, {
      reason,
    }),

  checkPostReported: (postId: number) =>
    http.get<{ reported: boolean }>(`/api/forums/posts/${postId}/is-reported`),

  reportComment: (postId: number, commentId: number, reason: string) =>
    http.post<ForumReportType>(
      `/api/forums/posts/${postId}/comments/${commentId}/reports`,
      { reason },
    ),

  checkCommentReported: (postId: number, commentId: number) =>
    http.get<{ reported: boolean }>(
      `/api/forums/posts/${postId}/comments/${commentId}/is-reported`,
    ),

  getTopPosts: (limit: number = 3) =>
    http.get<ForumTopPostListResponseType>(
      `/api/forums/posts/top?limit=${limit}`,
    ),
};
