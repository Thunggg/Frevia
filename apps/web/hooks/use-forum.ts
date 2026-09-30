import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forumApiRequest } from "@/apiRequests/forum";
import type {
  ForumPostFilterType,
  ForumLikeDetailResponseType,
} from "@shared/types";
import type { ApiResponse } from "@shared/types";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const forumKeys = {
  // Key gốc cho toàn bộ forum module - dùng để invalidate tất cả
  all: ["forum"] as const,

  // Key cho danh sách posts (có filter)
  posts: (filter?: ForumPostFilterType) => ["forum", "posts", filter] as const,

  // Key cho chi tiết 1 post
  post: (postId: number) => ["forum", "post", postId] as const,

  // Key cho danh sách comments của 1 post
  comments: (postId: number) => ["forum", "comments", postId] as const,

  // Key cho likes của 1 post
  likes: (postId: number) => ["forum", "likes", postId] as const,

  // Key cho danh sách categories
  categories: () => ["forum", "categories"] as const,

  // Key cho chi tiết 1 category
  category: (categoryId: number) => ["forum", "category", categoryId] as const,

  // Key cho top posts
  topPosts: (limit: number) => ["forum", "topPosts", limit] as const,
};

// Lấy danh sách posts theo filter.
// staleTime: 2 phút - dữ liệu posts list fresh trong 2 phút
export function useForumPosts(filter: ForumPostFilterType) {
  return useQuery({
    queryKey: forumKeys.posts(filter),
    queryFn: () => forumApiRequest.getPosts(filter).then(extractData),
    staleTime: 2 * 60 * 1000, // 2 phút
  });
}

/**
 * Lấy chi tiết 1 post.
 * staleTime: 1 phút
 */
export function useForumPost(postId: number) {
  return useQuery({
    queryKey: forumKeys.post(postId),
    queryFn: () => forumApiRequest.getPostDetail(postId).then(extractData),
    enabled: postId > 0,
    staleTime: 1 * 60 * 1000, // 1 phút
  });
}

/**
 * Lấy danh sách comments của 1 post.
 * staleTime: 45 giây
 */
export function useForumComments(
  postId: number,
  page: number = 1,
  limit: number = 5,
) {
  return useQuery({
    queryKey: forumKeys.comments(postId),
    queryFn: () =>
      forumApiRequest.getComments(postId, page, limit).then(extractData),
    enabled: postId > 0,
    staleTime: 45 * 1000, // 45 giây
  });
}

/**
 * Lấy danh sách likes của 1 post.
 */
export function useForumPostLikes(postId: number) {
  return useQuery({
    queryKey: forumKeys.likes(postId),
    queryFn: () => forumApiRequest.getPostLikes(postId).then(extractData),
    enabled: postId > 0,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Lấy danh sách categories.
 * staleTime: 30 phút - categories ít thay đổi
 */
export function useForumCategories() {
  return useQuery({
    queryKey: forumKeys.categories(),
    queryFn: () => forumApiRequest.getCategories().then(extractData),
    staleTime: 30 * 60 * 1000, // 30 phút
  });
}

/**
 * Lấy chi tiết 1 category.
 */
export function useForumCategoryDetail(categoryId: number) {
  return useQuery({
    queryKey: forumKeys.category(categoryId),
    queryFn: () =>
      forumApiRequest.getCategoryById(categoryId).then(extractData),
    enabled: categoryId > 0,
  });
}

/**
 * Lấy danh sách top posts (tương tác nhiều).
 */
export function useForumTopPosts(limit: number = 3) {
  return useQuery({
    queryKey: forumKeys.topPosts(limit),
    queryFn: () => forumApiRequest.getTopPosts(limit).then(extractData),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

/**
 * Tạo post mới.
 * Sau khi tạo thành công → invalidate posts list để refetch.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      title,
      content,
    }: {
      categoryId: number;
      title: string;
      content: string;
    }) =>
      forumApiRequest
        .createPost({ categoryId, title, content })
        .then(extractData),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "posts"] });
    },
  });
}

/**
 * Cập nhật post.
 * Sau khi update → invalidate post detail + posts list.
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      title,
      content,
    }: {
      postId: number;
      title: string;
      content: string;
    }) =>
      forumApiRequest.updatePost(postId, { title, content }).then(extractData),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.post(variables.postId),
      });
      queryClient.invalidateQueries({ queryKey: ["forum", "posts"] });
    },
  });
}

/**
 * Xóa post.
 * Sau khi xóa → invalidate posts list.
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) =>
      forumApiRequest.deletePost(postId).then(extractData),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "posts"] });
    },
  });
}

/**
 * Tạo comment mới.
 * Sau khi tạo → invalidate comments list để refetch.
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      forumApiRequest.createComment(postId, content).then(extractData),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.comments(variables.postId),
      });
    },
  });
}

/**
 * Cập nhật comment.
 * Sau khi update → invalidate comments list.
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      commentId,
      content,
    }: {
      postId: number;
      commentId: number;
      content: string;
    }) =>
      forumApiRequest.editComment(postId, commentId, content).then(extractData),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.comments(variables.postId),
      });
    },
  });
}

/**
 * Xóa comment.
 * Sau khi xóa → invalidate comments list.
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: number;
      commentId: number;
    }) => forumApiRequest.deleteComment(postId, commentId).then(extractData),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.comments(variables.postId),
      });
    },
  });
}

/**
 * Xử lý Like/Unlike bài viết bằng Optimistic Update.
 *
 * Quy trình:
 * - onMutate: Cập nhật giao diện ngay trước khi gọi API.
 * - onError: Nếu API thất bại, khôi phục dữ liệu ban đầu.
 * - onSettled: Fetch lại dữ liệu để đồng bộ với server.
 */
export function useTogglePostLike(
  postId: number,
  currentUserId: number | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => forumApiRequest.toggleLikePost(postId).then(extractData),

    // Cập nhật cache ngay khi user bấm like
    onMutate: async () => {
      if (!currentUserId) return {};

      // Dừng các lần fetch đang chạy để tránh ghi đè dữ liệu vừa cập nhật trong cache.
      await queryClient.cancelQueries({
        queryKey: forumKeys.likes(postId),
      });

      // Lưu data trước khi update để rollback nếu API lỗi
      const previousLikes =
        queryClient.getQueryData<ForumLikeDetailResponseType>(
          forumKeys.likes(postId),
        );

      // Cập nhật cache ngay lập tức
      queryClient.setQueryData<ForumLikeDetailResponseType>(
        forumKeys.likes(postId),
        (old) => {
          if (!old) return old;
          const hasLiked = old.some((l) => l.userId === currentUserId);
          if (hasLiked) {
            return old.filter((l) => l.userId !== currentUserId);
          } else {
            return [...old, { userId: currentUserId } as (typeof old)[number]];
          }
        },
      );

      return { previousLikes };
    },

    // Nếu lỗi → rollback về data trước đó
    onError: (_err, _variables, context) => {
      if (context?.previousLikes) {
        queryClient.setQueryData(
          forumKeys.likes(postId),
          context.previousLikes,
        );
      }
    },

    // Luôn chạy sau onMutate/onError để đảm bảo data nhất quán
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.likes(postId),
      });
      queryClient.invalidateQueries({
        queryKey: forumKeys.post(postId),
      });
    },
  });
}
/**
 * Xử lý Like/Unlike bình luận bằng cách cập nhật ngay lập tức
 *
 * - onMutate: Cập nhật cache ngay để giao diện phản hồi tức thì.
 * - onError: Khôi phục dữ liệu nếu gọi API thất bại.
 * - onSettled: Fetch lại danh sách bình luận để đồng bộ với server.
 */
export function useToggleCommentLike(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) =>
      forumApiRequest.toggleLikeComment(postId, commentId).then(extractData),

    // Cập nhật cache ngay lập tức
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({
        queryKey: forumKeys.comments(postId),
      });

      const previousData = queryClient.getQueryData(forumKeys.comments(postId));

      // Cập nhật comment's like state trong cache
      queryClient.setQueryData(forumKeys.comments(postId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments.map((comment: any) => {
            if (comment.id !== commentId) return comment;
            return {
              ...comment,
              likedByMe: !comment.likedByMe,
              likeCount: comment.likedByMe
                ? comment.likeCount - 1
                : comment.likeCount + 1,
            };
          }),
        };
      });

      return { previousData };
    },

    // Rollback nếu lỗi
    onError: (_err, _commentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          forumKeys.comments(postId),
          context.previousData,
        );
      }
    },

    // Đảm bảo data nhất quán với server
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: forumKeys.comments(postId),
      });
    },
  });
}
