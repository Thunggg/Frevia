import { ToggleLikeResponseSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class ToggleLikeResponseDto extends createZodDto(
  ToggleLikeResponseSchema,
) {}
