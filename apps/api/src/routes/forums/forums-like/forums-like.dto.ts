import { CreateForumLikeResponseSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateForumLikeResponseDto extends createZodDto(
  CreateForumLikeResponseSchema,
) {}
