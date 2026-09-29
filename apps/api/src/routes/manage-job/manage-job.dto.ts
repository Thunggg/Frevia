import { createZodDto } from 'nestjs-zod';

import {
  BookmarkJobBodySchema,
  ChangeJobStatusBodySchema,
  ChangeJobStatusResponseSchema,
  CreateJobBodySchema,
  UpdateJobBodySchema,
  UpdateJobResponseSchema,
  ViewBookmarkedJobFilterSchema,
  ViewBookmarkedJobResponseSchema,
} from '@shared/types';

export class ViewBookmarkedJobQueryDto extends createZodDto(
  ViewBookmarkedJobFilterSchema,
) {}

export class ViewBookmarkedJobResponseDto extends createZodDto(
  ViewBookmarkedJobResponseSchema,
) {}

export class BookmarkJobBodyDto extends createZodDto(BookmarkJobBodySchema) {}

export class CreateJobBodyDto extends createZodDto(CreateJobBodySchema) {}
export class UpdateJobBodyDto extends createZodDto(UpdateJobBodySchema) {}
export class UpdateJobResponseDto extends createZodDto(
  UpdateJobResponseSchema,
) {}

export class ChangeJobStatusBodyDto extends createZodDto(
  ChangeJobStatusBodySchema,
) {}

export class ChangeJobStatusResponseDto extends createZodDto(
  ChangeJobStatusResponseSchema,
) {}
