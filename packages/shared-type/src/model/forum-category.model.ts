import { z } from "zod";
import { ManageForumMessage } from "../message/manage-forum.message";
import { PaginationSchema } from "./forum-post.model";

export const ForumCategorySchema = z.object({
  id: z.number(),
  name: z
    .string()
    .trim()
    .min(1, ManageForumMessage.FORUM_CATEGORY_NAME_REQUIRED)
    .max(100, ManageForumMessage.FORUM_CATEGORY_NAME_TOO_LONG),
  slug: z.string(),
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

// --- Admin: list + search theo tên ---

export const ForumAdminCategoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["id", "name", "createdAt"]).optional().default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const ForumAdminCategoryListResponseSchema = z.object({
  categories: z.array(ForumCategorySchema),
  pagination: PaginationSchema,
});

export type ForumAdminCategoryFilterType = z.infer<
  typeof ForumAdminCategoryFilterSchema
>;
export type ForumAdminCategoryListResponseType = z.infer<
  typeof ForumAdminCategoryListResponseSchema
>;
