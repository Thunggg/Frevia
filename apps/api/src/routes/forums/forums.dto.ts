import {
  ForumCategoryDetailResponseSchema,
  ForumCategoryListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

// DTO cho response của API lấy danh sách forum categories
export class ForumCategoryListResponseDto extends createZodDto(
  ForumCategoryListResponseSchema,
) {}

export class ForumCategoryDetailResponseDto extends createZodDto(
  ForumCategoryDetailResponseSchema,
) {}
