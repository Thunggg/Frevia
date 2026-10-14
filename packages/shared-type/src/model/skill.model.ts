// ====== Schema dùng cho trang Admin: danh sách & chi tiết kỹ năng (Skill) ======
import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";
import { MessageResSchema } from "./response.model";

// 1 dòng skill trong danh sách (jobCount là số công việc đang dùng skill này)
export const SkillAdminItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  jobCount: z.number().optional(),
});

// Query: phân trang + tìm kiếm + lọc trạng thái soft-deleted (deletedAt)
export const SkillAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  deleted: z.enum(["true", "false"]).optional(),
});

export const SkillAdminListResponseSchema = z.object({
  skills: z.array(SkillAdminItemSchema),
  pagination: PaginationSchema,
});

// Chi tiết 1 skill (bắt buộc có jobCount)
export const SkillAdminDetailResponseSchema = SkillAdminItemSchema.extend({
  jobCount: z.number(),
});

// --- Admin: Create Skill ---
export const AdminCreateSkillBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Error.SkillNameRequired")
    .max(100, "Error.SkillNameTooLong"),
  description: z
    .string()
    .max(500, "Error.SkillDescriptionTooLong")
    .optional()
    .nullable(),
});

// --- Admin: Update Skill (PATCH /api/admin/skills/:id) ---
export const AdminUpdateSkillBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Error.SkillNameRequired")
    .max(100, "Error.SkillNameTooLong")
    .optional(),
  description: z
    .string()
    .max(500, "Error.SkillDescriptionTooLong")
    .optional()
    .nullable(),
});

export type AdminUpdateSkillBodyType = z.infer<
  typeof AdminUpdateSkillBodySchema
>;

export type AdminCreateSkillBodyType = z.infer<
  typeof AdminCreateSkillBodySchema
>;

// --- Admin: Delete Skill (DELETE /api/admin/skills/:id) ---
export const SkillAdminDeleteResponseSchema = MessageResSchema;

export type SkillAdminDeleteResponseType = z.infer<
  typeof SkillAdminDeleteResponseSchema
>;

export type SkillAdminItemType = z.infer<typeof SkillAdminItemSchema>;
export type SkillAdminQueryType = z.infer<typeof SkillAdminQuerySchema>;
export type SkillAdminListResponseType = z.infer<
  typeof SkillAdminListResponseSchema
>;
export type SkillAdminDetailResponseType = z.infer<
  typeof SkillAdminDetailResponseSchema
>;
