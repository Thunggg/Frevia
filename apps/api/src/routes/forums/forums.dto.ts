import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * DTOs cho Forum Module
 * Định nghĩa các schema validation và response types
 */

// Forum Category DTOs
/**
 * Schema cho một Forum Category
 */
export const ForumCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema cho response danh sách Forum Categories
 */
export const ForumCategoryListResponseSchema = z.object({
  data: z.array(ForumCategorySchema),
});

// DTO Classes
export class ForumCategoryListResponseDto extends createZodDto(
  ForumCategoryListResponseSchema,
) {}
