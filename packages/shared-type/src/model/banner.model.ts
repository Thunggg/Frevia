import { z } from "zod";
import { BannerMessage } from "../message/banner.message";
import { PaginationSchema } from "./forum-post.model";
import { MessageResSchema } from "./response.model";

// Vị trí hiển thị banner trên giao diện người dùng.
export const BannerPositionEnum = z.enum([
  "GLOBAL_HEADER",
  "HOME_HERO",
  "HOME_BODY",
  "SEARCH_RESULTS",
  "FOOTER",
]);

export type BannerPosition = z.infer<typeof BannerPositionEnum>;

// 1 banner trong danh sách (trang Admin)
export const BannerAdminItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  linkUrl: z.string().nullable(),
  position: BannerPositionEnum,
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  isActive: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Query: phân trang + tìm kiếm (title) + lọc trạng thái soft-deleted + vị trí + sort
export const BannerAdminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  deleted: z.enum(["true", "false"]).optional(),
  position: BannerPositionEnum.optional(),
  sortBy: z.enum(["id", "createdAt"]).optional().default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const BannerAdminListResponseSchema = z.object({
  banners: z.array(BannerAdminItemSchema),
  pagination: PaginationSchema,
});

export const BannerAdminDetailResponseSchema = BannerAdminItemSchema;

// --- Admin: Create Banner ---
export const BannerCreateBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, BannerMessage.BANNER_TITLE_REQUIRED)
    .max(255, BannerMessage.BANNER_TITLE_TOO_LONG),
  imageUrl: z
    .string()
    .url()
    .max(500, BannerMessage.BANNER_IMAGE_URL_TOO_LONG)
    .optional()
    .nullable(),
  linkUrl: z
    .string()
    .url()
    .max(500, BannerMessage.BANNER_LINK_URL_TOO_LONG)
    .optional()
    .nullable(),
  position: BannerPositionEnum.default("GLOBAL_HEADER"),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: BannerMessage.BANNER_INVALID_DATE_RANGE, path: ["endDate"] },
);

// --- Admin: Update Banner (PATCH /api/admin/banners/:id) ---
export const BannerUpdateBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, BannerMessage.BANNER_TITLE_REQUIRED)
      .max(255, BannerMessage.BANNER_TITLE_TOO_LONG)
      .optional(),
    imageUrl: z
      .string()
      .url()
      .max(500, BannerMessage.BANNER_IMAGE_URL_TOO_LONG)
      .optional()
      .nullable(),
    linkUrl: z
      .string()
      .url()
      .max(500, BannerMessage.BANNER_LINK_URL_TOO_LONG)
      .optional()
      .nullable(),
    position: BannerPositionEnum.optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    { message: BannerMessage.BANNER_INVALID_DATE_RANGE, path: ["endDate"] },
  );

// --- Public: lấy banner hiển thị theo vị trí (không cần đăng nhập) ---
export const BannerPublicQuerySchema = z.object({
  position: BannerPositionEnum,
});

export const BannerPublicListResponseSchema = z.object({
  banners: z.array(BannerAdminItemSchema),
});

// --- Admin: upload ảnh banner lên Cloudinary ---
export const BannerUploadImageResponseSchema = z.object({
  imageUrl: z.string(),
  publicId: z.string(),
});

// --- Admin: Delete Banner (DELETE /api/admin/banners/:id) ---
export const BannerAdminDeleteResponseSchema = MessageResSchema;

export type BannerAdminItemType = z.infer<typeof BannerAdminItemSchema>;
export type BannerAdminQueryType = z.infer<typeof BannerAdminQuerySchema>;
export type BannerAdminListResponseType = z.infer<
  typeof BannerAdminListResponseSchema
>;
export type BannerAdminDetailResponseType = z.infer<
  typeof BannerAdminDetailResponseSchema
>;
export type BannerCreateBodyType = z.infer<typeof BannerCreateBodySchema>;
export type BannerUpdateBodyType = z.infer<typeof BannerUpdateBodySchema>;
export type BannerPublicQueryType = z.infer<typeof BannerPublicQuerySchema>;
export type BannerPublicListResponseType = z.infer<
  typeof BannerPublicListResponseSchema
>;
export type BannerAdminDeleteResponseType = z.infer<
  typeof BannerAdminDeleteResponseSchema
>;
export type BannerUploadImageResponseType = z.infer<
  typeof BannerUploadImageResponseSchema
>;
