import { createZodDto } from 'nestjs-zod';
import {
  ViewJobDetailResSchema,
  ViewListJobFilterSchema,
  ViewListJobResponseSchema,
} from '@shared/types';

export class ViewListJobQueryDto extends createZodDto(
  ViewListJobFilterSchema,
) {}

export class ViewListJobResponseDto extends createZodDto(
  ViewListJobResponseSchema,
) {}

export class ViewJobDetailResponseDto extends createZodDto(
  ViewJobDetailResSchema,
) {}
