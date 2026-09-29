import { createZodDto } from 'nestjs-zod';

import {
  BookmarkJobBodySchema,
  CreateJobBodySchema,
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
