import { z } from "zod";
import { ManageForumPostMessage } from "../message/manage-forum-post.message";

// Schema cơ bản của ForumPost
export const ForumPostSchema = z.object({
  id: z.number(),
  categoryId: z.number().nullable(),
  userId: z.number(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema cho filter query params (page, limit, categoryId, userId, search)
export const ForumPostFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  categoryId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

// Schema cho phân trang (pagination)
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

// Schema cho request body khi tạo post mới
export const CreateForumPostSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
});

// Schema cho request body khi cập nhật post
export const UpdateForumPostSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
});

// --- Response Schemas ---

// Schema response khi lấy danh sách posts (data + pagination), bao gồm user info
export const ForumPostWithUserSchema = ForumPostSchema.extend({
  user: z.object({
    id: z.number(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
});

// Schema response khi lấy danh sách posts (data + pagination)
export const ForumPostListResponseSchema = z.object({
  posts: z.array(ForumPostWithUserSchema),
  pagination: PaginationSchema,
});

// Schema response khi tạo post thành công
export const CreateForumPostResponseSchema = ForumPostSchema;

// Schema response khi cập nhật post thành công
export const UpdateForumPostResponseSchema = ForumPostSchema;

// Schema response khi xem chi tiết post (bao gồm category + user info)
export const ViewForumPostDetailResponseSchema = z.object({
  id: z.number(),
  categoryId: z.number().nullable(),
  userId: z.number(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  category: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  user: z.object({
    id: z.number(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
});

// Schema cho top posts (most interactions in last week)
export const ForumTopPostSchema = ForumPostSchema.extend({
  likeCount: z.number(),
  commentCount: z.number(),
  interactionScore: z.number(),
  user: z.object({
    id: z.number(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
  category: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
});

export const ForumTopPostListResponseSchema = z.array(ForumTopPostSchema);

// Type của ForumPost
export type ForumPostType = z.infer<typeof ForumPostSchema>;

// Type của ForumPost bao gồm user info
export type ForumPostWithUserType = z.infer<typeof ForumPostWithUserSchema>;

// Type của filter query params
export type ForumPostFilterType = z.infer<typeof ForumPostFilterSchema>;

// Type của danh sách posts response
export type ForumPostListResponseType = z.infer<
  typeof ForumPostListResponseSchema
>;

// Type của request body khi tạo post
export type CreateForumPostType = z.infer<typeof CreateForumPostSchema>;

// Type của response khi tạo post thành công
export type CreateForumPostResponseType = z.infer<
  typeof CreateForumPostResponseSchema
>;

// Type của request body khi cập nhật post
export type UpdateForumPostType = z.infer<typeof UpdateForumPostSchema>;

// Type của response khi cập nhật post thành công
export type UpdateForumPostResponseType = z.infer<
  typeof UpdateForumPostResponseSchema
>;

// Type của response khi xem chi tiết post
export type ViewForumPostDetailResponseType = z.infer<
  typeof ViewForumPostDetailResponseSchema
>;

// Type của top posts response
export type ForumTopPostType = z.infer<typeof ForumTopPostSchema>;
export type ForumTopPostListResponseType = z.infer<
  typeof ForumTopPostListResponseSchema
>;

// --- Admin Schemas ---

export const ForumAdminStatsSchema = z.object({
  totalCategories: z.number(),
  totalPosts: z.number(),
  totalComments: z.number(),
  totalReports: z.number(),
  pendingReports: z.number(),
  totalUsers: z.number(),
  recentPosts: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      createdAt: z.date(),
      user: z.object({
        id: z.number(),
        profile: z
          .object({
            displayName: z.string().nullable(),
            avatarUrl: z.string().nullable(),
          })
          .nullable(),
      }),
    }),
  ),
});

export type ForumAdminStatsType = z.infer<typeof ForumAdminStatsSchema>;
