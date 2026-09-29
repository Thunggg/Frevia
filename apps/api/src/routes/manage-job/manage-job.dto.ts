import { createZodDto } from 'nestjs-zod';

import {
  BookmarkJobBodySchema,
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
