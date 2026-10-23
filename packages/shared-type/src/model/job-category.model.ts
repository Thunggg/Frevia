// ====== Schema dùng cho trang Admin: quản lý danh mục công việc (Job Category — UC-46.01 → UC-46.05) ======
// Schema cho người dùng xem danh mục (UC-46.06, UC-46.07) nằm ở cuối file.
import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";
import { MessageResSchema } from "./response.model";

// Trạng thái danh mục: ACTIVE (đang dùng) / INACTIVE (tạm ngưng — không xoá dữ liệu)
export const JobCategoryStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export type JobCategoryStatusType = z.infer<typeof JobCategoryStatusEnum>;

// Công việc liên quan hiển thị ở trang chi tiết danh mục (UC-46.02)
export const JobCategoryJobItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  status: z.string(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

// 1 dòng danh mục trong danh sách (jobCount = số công việc đang gắn danh mục này)
export const JobCategoryAdminItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  status: JobCategoryStatusEnum,
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  jobCount: z.number().optional(),
});

// Query: phân trang + tìm kiếm + lọc trạng thái + lọc soft-deleted + sort
export const JobCategoryAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: JobCategoryStatusEnum.optional(),
  deleted: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["id", "createdAt", "name"]).optional().default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const JobCategoryAdminListResponseSchema = z.object({
  jobCategories: z.array(JobCategoryAdminItemSchema),
  pagination: PaginationSchema,
});

// Chi tiết 1 danh mục: bắt buộc có jobCount + danh sách công việc liên quan
export const JobCategoryAdminDetailResponseSchema =
  JobCategoryAdminItemSchema.extend({
    jobCount: z.number(),
    jobs: z.array(JobCategoryJobItemSchema),
  });

// --- Admin: Create Job Category ---
export const AdminCreateJobCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Error.JobCategoryNameRequired")
    .max(100, "Error.JobCategoryNameTooLong"),
  description: z
    .string()
    .max(500, "Error.JobCategoryDescriptionTooLong")
    .optional()
    .nullable(),
  status: JobCategoryStatusEnum.optional().default("ACTIVE"),
});

// --- Admin: Update Job Category (PATCH /api/admin/job-categories/:id) ---
export const AdminUpdateJobCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Error.JobCategoryNameRequired")
    .max(100, "Error.JobCategoryNameTooLong")
    .optional(),
  description: z
    .string()
    .max(500, "Error.JobCategoryDescriptionTooLong")
    .optional()
    .nullable(),
  status: JobCategoryStatusEnum.optional(),
});

// --- Admin: Delete Job Category (DELETE /api/admin/job-categories/:id) ---
export const JobCategoryAdminDeleteResponseSchema = MessageResSchema;

export type JobCategoryJobItemType = z.infer<typeof JobCategoryJobItemSchema>;
export type JobCategoryAdminItemType = z.infer<
  typeof JobCategoryAdminItemSchema
>;
export type JobCategoryAdminQueryType = z.infer<
  typeof JobCategoryAdminQuerySchema
>;
export type JobCategoryAdminListResponseType = z.infer<
  typeof JobCategoryAdminListResponseSchema
>;
export type JobCategoryAdminDetailResponseType = z.infer<
  typeof JobCategoryAdminDetailResponseSchema
>;
export type AdminCreateJobCategoryBodyType = z.infer<
  typeof AdminCreateJobCategoryBodySchema
>;
export type AdminUpdateJobCategoryBodyType = z.infer<
  typeof AdminUpdateJobCategoryBodySchema
>;
export type JobCategoryAdminDeleteResponseType = z.infer<
  typeof JobCategoryAdminDeleteResponseSchema
>;

// ====== Schema dùng cho phía người dùng (Freelancer): xem danh mục công việc (UC-46.06, UC-46.07) ======
// Danh mục công việc là dữ liệu công khai (BR-CAT-02): không cần đăng nhập để xem.

// Tham chiếu danh mục được nhúng vào mỗi công việc (JobSchema.jobCategories)
export const JobCategoryRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

// Một danh mục trong danh sách công khai.
// Chỉ trả về danh mục đang ACTIVE và chưa bị xoá (BR-CAT-01).
// jobCount = số công việc đang mở thuộc danh mục.
export const JobCategoryBrowseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  jobCount: z.number(),
});

export const JobCategoryBrowseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

export const JobCategoryBrowseListResponseSchema = z.object({
  jobCategories: z.array(JobCategoryBrowseItemSchema),
  pagination: PaginationSchema,
});

export type JobCategoryRefType = z.infer<typeof JobCategoryRefSchema>;
export type JobCategoryBrowseItemType = z.infer<
  typeof JobCategoryBrowseItemSchema
>;
/** Dữ liệu query trước khi Zod ép kiểu (dùng cho URL/tham số HTTP). */
export type JobCategoryBrowseQueryType = z.input<
  typeof JobCategoryBrowseQuerySchema
>;
/** Dữ liệu query đã validate, dùng ở tầng service/repository. */
export type JobCategoryBrowseParsedQueryType = z.output<
  typeof JobCategoryBrowseQuerySchema
>;
export type JobCategoryBrowseListResponseType = z.infer<
  typeof JobCategoryBrowseListResponseSchema
>;
