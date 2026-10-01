import { z } from "zod";
import { ManageForumMessage } from "../message/manage-forum.message";

export const ForumCategorySchema = z.object({
  id: z.number(),
  name: z
    .string()
    .trim()
    .min(1, ManageForumMessage.FORUM_CATEGORY_NAME_REQUIRED)
    .max(100, ManageForumMessage.FORUM_CATEGORY_NAME_TOO_LONG),
  description: z
    .string()
    .max(500, ManageForumMessage.FORUM_CATEGORY_DESCRIPTION_TOO_LONG)
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  postCount: z.number(),
});

// Schema response khi lấy danh sách categories
export const ForumCategoryListResponseSchema = z.array(ForumCategorySchema);

// Schema response khi lấy chi tiết category
export const ForumCategoryDetailResponseSchema = ForumCategorySchema;

// Schema response khi lấy top categories
export const ForumCategoryTopListResponseSchema = z.array(ForumCategorySchema);

// Schema response khi lấy top người dùng hoạt động nhiều nhất
export const ForumTopActiveUserSchema = z.object({
  id: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  postCount: z.number(),
  commentCount: z.number(),
});

export const ForumTopActiveUserListResponseSchema = z.array(
  ForumTopActiveUserSchema,
);

export type ForumCategoryType = z.infer<typeof ForumCategorySchema>;
export type ForumCategoryListResponseType = z.infer<
  typeof ForumCategoryListResponseSchema
>;
export type ForumCategoryDetailResponseType = z.infer<
  typeof ForumCategoryDetailResponseSchema
>;
export type ForumCategoryTopListResponseType = z.infer<
  typeof ForumCategoryTopListResponseSchema
>;
export type ForumTopActiveUserType = z.infer<typeof ForumTopActiveUserSchema>;
export type ForumTopActiveUserListResponseType = z.infer<
  typeof ForumTopActiveUserListResponseSchema
>;
