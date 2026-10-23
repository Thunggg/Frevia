import { createZodDto } from 'nestjs-zod';
import {
  JobCategoryBrowseListResponseSchema,
  JobCategoryBrowseQuerySchema,
  ViewJobCategoryDetailResponseSchema,
} from '@shared/types';

export class JobCategoryBrowseQueryDto extends createZodDto(
  JobCategoryBrowseQuerySchema,
) {}

export class JobCategoryBrowseListResponseDto extends createZodDto(
  JobCategoryBrowseListResponseSchema,
) {}

export class JobCategoryDetailResponseDto extends createZodDto(
  ViewJobCategoryDetailResponseSchema,
) {}

// Query riêng cho trang chi tiết danh mục: phân trang danh sách job thuộc danh mục.
export class JobCategoryDetailQueryDto extends createZodDto(
  JobCategoryBrowseQuerySchema.pick({ page: true, limit: true }),
) {}
