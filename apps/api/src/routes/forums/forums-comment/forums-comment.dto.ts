import { createZodDto } from 'nestjs-zod';
import {
  CreateForumCommentSchema,
  CreateForumCommentResponseSchema,
  DeleteForumCommentResponseSchema,
  EditForumCommentSchema,
  EditForumCommentResponseSchema,
  ForumCommentFilterSchema,
  ForumCommentListResponseSchema,
  ToggleLikeCommentSchema,
} from '@shared/types';

export class ForumCommentListResponseDto extends createZodDto(
  ForumCommentListResponseSchema,
) {}

export class ForumCommentFilterDto extends createZodDto(
  ForumCommentFilterSchema,
) {}

export class CreateForumCommentDto extends createZodDto(
  CreateForumCommentSchema,
) {}

export class CreateForumCommentResponseDto extends createZodDto(
  CreateForumCommentResponseSchema,
) {}

export class EditForumCommentDto extends createZodDto(EditForumCommentSchema) {}

export class EditForumCommentResponseDto extends createZodDto(
  EditForumCommentResponseSchema,
) {}

export class DeleteForumCommentResponseDto extends createZodDto(
  DeleteForumCommentResponseSchema,
) {}

export class ToggleLikeCommentResponseDto extends createZodDto(
  ToggleLikeCommentSchema,
) {}
