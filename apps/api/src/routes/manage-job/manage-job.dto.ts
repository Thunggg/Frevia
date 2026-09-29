import { createZodDto } from 'nestjs-zod';

import {
  ViewBookmarkedJobFilterSchema,
  ViewBookmarkedJobResponseSchema,
} from '@shared/types';

export class ViewBookmarkedJobQueryDto extends createZodDto(
  ViewBookmarkedJobFilterSchema,
) {}

export class ViewBookmarkedJobResponseDto extends createZodDto(
  ViewBookmarkedJobResponseSchema,
) {}
