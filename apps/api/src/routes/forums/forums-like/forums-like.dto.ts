import {
  ToggleLikeResponseSchema,
  ForumLikeDetailResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class ToggleLikeResponseDto extends createZodDto(
  ToggleLikeResponseSchema,
) {}

export class ViewForumLikeDetailResponseDto extends createZodDto(
  ForumLikeDetailResponseSchema,
) {}
