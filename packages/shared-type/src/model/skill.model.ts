// ====== Schema dùng cho trang Admin: danh sách & chi tiết kỹ năng (Skill) ======
import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";

// 1 dòng skill trong danh sách (jobCount là số công việc đang dùng skill này)
export const SkillAdminItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  jobCount: z.number().optional(),
});

// Query: phân trang + tìm kiếm + lọc trạng thái active
export const SkillAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const SkillAdminListResponseSchema = z.object({
  skills: z.array(SkillAdminItemSchema),
  pagination: PaginationSchema,
});

// Chi tiết 1 skill (bắt buộc có jobCount)
export const SkillAdminDetailResponseSchema = SkillAdminItemSchema.extend({
  jobCount: z.number(),
});

export type SkillAdminItemType = z.infer<typeof SkillAdminItemSchema>;
export type SkillAdminQueryType = z.infer<typeof SkillAdminQuerySchema>;
export type SkillAdminListResponseType = z.infer<
  typeof SkillAdminListResponseSchema
>;
export type SkillAdminDetailResponseType = z.infer<
  typeof SkillAdminDetailResponseSchema
>;
