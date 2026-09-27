import { z } from "zod";
import { ManageForumPostMessage } from "../message/manage-forum-post.message";

export const ForumPostSchema = z.object({
  id: z.number(),
  categoryId: z.number().nullable(),
  userId: z.number(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tạo schema cho phân trang (pagination) của danh sách forum posts
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

// Tạo schema cho response của danh sách forum posts, bao gồm dữ liệu và thông tin phân trang
export const ForumPostListResponseSchema = z.object({
  data: z.array(ForumPostSchema),
  pagination: PaginationSchema,
});

// Tạo schema cho filter của danh sách forum posts, bao gồm các thông tin để lọc danh sách forum posts theo categoryId, userId, page, limit
export const ForumPostFilterSchema = z.object({
  // z.coerce.number() sẽ ép kiểu dữ liệu từ string sang number
  // positive sẽ kiểm tra xem số có phải là số dương hay không
  // optional sẽ cho phép giá trị này có thể là undefined
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  categoryId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export const CreateForumPostSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
});

export const CreateForumPostResponseSchema = ForumPostSchema;

export const ViewForumPostDetailSchema = z.object({
  id: z.number(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Lấy ID và tên Category của post hiện tại
  category: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  // Lấy thông tin user của post hiện tại bao gồm id, displayName và avatarUrl
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

export const ViewForumPostDetailResponseType = z.object({
  data: ViewForumPostDetailSchema,
});

export type ViewForumPostDetailResponseType = z.infer<
  typeof ViewForumPostDetailResponseType
>;

export type ViewForumPostDetailType = z.infer<typeof ViewForumPostDetailSchema>;

export type CreateForumPostResponseType = z.infer<
  typeof CreateForumPostResponseSchema
>;

export type CreateForumPostType = z.infer<typeof CreateForumPostSchema>;

export type ForumPostFilterType = z.infer<typeof ForumPostFilterSchema>;

export type ForumPostType = z.infer<typeof ForumPostSchema>;

export type ForumPostListResponseType = z.infer<
  typeof ForumPostListResponseSchema
>;

export const UpdateForumPostSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  title: z.string(ManageForumPostMessage.FORUM_POST_TITLE_REQUIRED).min(1),
  content: z.string(ManageForumPostMessage.FORUM_POST_CONTENT_REQUIRED).min(1),
});

export const UpdateForumPostResponseSchema = ForumPostSchema;

export type UpdateForumPostResponseType = z.infer<
  typeof UpdateForumPostResponseSchema
>;

export type UpdateForumPostType = z.infer<typeof UpdateForumPostSchema>;
