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
});

// Schema response khi lấy danh sách categories
export const ForumCategoryListResponseSchema = z.array(ForumCategorySchema);

// Schema response khi lấy chi tiết category
export const ForumCategoryDetailResponseSchema = ForumCategorySchema;

export type ForumCategoryType = z.infer<typeof ForumCategorySchema>;
export type ForumCategoryListResponseType = z.infer<
  typeof ForumCategoryListResponseSchema
>;
export type ForumCategoryDetailResponseType = z.infer<
  typeof ForumCategoryDetailResponseSchema
>;
