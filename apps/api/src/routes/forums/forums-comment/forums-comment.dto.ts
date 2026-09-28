import { createZodDto } from 'nestjs-zod';
import {
  ForumCommentFilterSchema,
  ForumCommentListResponseSchema,
} from '@shared/types';

export class ForumCommentListResponseDto extends createZodDto(
  ForumCommentListResponseSchema,
) {}

export class ForumCommentFilterDto extends createZodDto(
  ForumCommentFilterSchema,
) {}
