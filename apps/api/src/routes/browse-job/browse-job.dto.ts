import { createZodDto } from 'nestjs-zod';
import {
  ViewListJobFilterSchema,
  ViewListJobResponseSchema,
} from '@shared/types';

export class ViewListJobQueryDto extends createZodDto(
  ViewListJobFilterSchema,
) {}

export class ViewListJobResponseDto extends createZodDto(
  ViewListJobResponseSchema,
) {}
