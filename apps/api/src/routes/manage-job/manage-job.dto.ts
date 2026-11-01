import { createZodDto } from 'nestjs-zod';

import {
  BookmarkJobBodySchema,
  CloseJobResponseSchema,
  CreateJobBodySchema,
  PublishJobResponseSchema,
  ReopenJobResponseSchema,
  UpdateJobBodySchema,
  UpdateJobResponseSchema,
  ViewBookmarkedJobFilterSchema,
  ViewBookmarkedJobResponseSchema,
  ViewJobDetailResSchema,
  ViewListJobFilterSchema,
  ViewListJobResponseSchema,
} from '@shared/types';

export class ViewBookmarkedJobQueryDto extends createZodDto(
  ViewBookmarkedJobFilterSchema,
) {}

export class ViewBookmarkedJobResponseDto extends createZodDto(
  ViewBookmarkedJobResponseSchema,
) {}

export class ViewClientJobQueryDto extends createZodDto(
  ViewListJobFilterSchema,
) {}

export class ViewClientJobResponseDto extends createZodDto(
  ViewListJobResponseSchema,
) {}

export class ViewJobDetailResponseDto extends createZodDto(
  ViewJobDetailResSchema,
) {}

export class BookmarkJobBodyDto extends createZodDto(BookmarkJobBodySchema) {}

export class CreateJobBodyDto extends createZodDto(CreateJobBodySchema) {}

export class UpdateJobBodyDto extends createZodDto(UpdateJobBodySchema) {}
export class UpdateJobResponseDto extends createZodDto(
  UpdateJobResponseSchema,
) {}

export class PublishJobResponseDto extends createZodDto(
  PublishJobResponseSchema,
) {}

export class CloseJobResponseDto extends createZodDto(CloseJobResponseSchema) {}

export class ReopenJobResponseDto extends createZodDto(
  ReopenJobResponseSchema,
) {}
