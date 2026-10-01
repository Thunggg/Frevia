import { createZodDto } from 'nestjs-zod';
import {
  ForumAdminStatsSchema,
  ForumAdminCommentListResponseSchema,
} from '@shared/types';

export class ForumAdminStatsResponseDto extends createZodDto(
  ForumAdminStatsSchema,
) {}

export class ForumAdminCommentListResponseDto extends createZodDto(
  ForumAdminCommentListResponseSchema,
) {}
