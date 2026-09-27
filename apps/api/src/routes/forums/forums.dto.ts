import {
  ForumCategoryDetailResponseSchema,
  ForumCategoryListResponseSchema,
  ForumPostListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

// DTO cho response của API lấy danh sách forum categories
export class ForumCategoryListResponseDto extends createZodDto(
  ForumCategoryListResponseSchema,
) {}

export class ForumCategoryDetailResponseDto extends createZodDto(
  ForumCategoryDetailResponseSchema,
) {}

export class ForumPostListResponseDto extends createZodDto(
  ForumPostListResponseSchema,
) {}
