import { createZodDto } from 'nestjs-zod';
import {
  AdminCreateJobCategoryBodySchema,
  AdminUpdateJobCategoryBodySchema,
  JobCategoryAdminDeleteResponseSchema,
  JobCategoryAdminDetailResponseSchema,
  JobCategoryAdminListResponseSchema,
  JobCategoryAdminQuerySchema,
} from '@shared/types';

export class JobCategoryAdminQueryDto extends createZodDto(
  JobCategoryAdminQuerySchema,
) {}

export class JobCategoryAdminListResponseDto extends createZodDto(
  JobCategoryAdminListResponseSchema,
) {}

export class JobCategoryAdminDetailResponseDto extends createZodDto(
  JobCategoryAdminDetailResponseSchema,
) {}

export class JobCategoryAdminDeleteResponseDto extends createZodDto(
  JobCategoryAdminDeleteResponseSchema,
) {}

export class CreateJobCategoryBodyDto extends createZodDto(
  AdminCreateJobCategoryBodySchema,
) {}

export class UpdateJobCategoryBodyDto extends createZodDto(
  AdminUpdateJobCategoryBodySchema,
) {}
