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
  ViewListJobFilterSchema,
  ViewListJobResponseSchema,
} from '@shared/types';

export class ViewBookmarkedJobQueryDto extends createZodDto(
  ViewBookmarkedJobFilterSchema,
) {}

export class ViewBookmarkedJobResponseDto extends createZodDto(
  ViewBookmarkedJobResponseSchema,
) {}

export class ViewClientJobQueryDto extends createZodDto(ViewListJobFilterSchema) {}

export class ViewClientJobResponseDto extends createZodDto(ViewListJobResponseSchema) {}

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
