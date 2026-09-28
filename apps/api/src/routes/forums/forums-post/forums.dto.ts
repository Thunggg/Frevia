import {
  ForumCategoryDetailResponseSchema,
  ForumCategoryListResponseSchema,
  ForumPostListResponseSchema,
  ForumPostFilterSchema,
  CreateForumPostSchema,
  CreateForumPostResponseSchema,
  ViewForumPostDetailResponseSchema,
  UpdateForumPostSchema,
  UpdateForumPostResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

// DTO cho response của API lấy danh sách forum categories
export class ForumCategoryListResponseDto extends createZodDto(
  ForumCategoryListResponseSchema,
) {}

export class ForumCategoryDetailResponseDto extends createZodDto(
  ForumCategoryDetailResponseSchema,
) {}

export class ForumPostListResponseDto extends createZodDto(
  ForumPostListResponseSchema,
) {}

export class ForumPostFilterDto extends createZodDto(ForumPostFilterSchema) {}

export class CreateForumPostDto extends createZodDto(CreateForumPostSchema) {}

export class CreateForumPostResponseDto extends createZodDto(
  CreateForumPostResponseSchema,
) {}

export class ViewForumPostDetailResponseDto extends createZodDto(
  ViewForumPostDetailResponseSchema,
) {}

export class UpdateForumPostDto extends createZodDto(UpdateForumPostSchema) {}

export class UpdateForumPostResponseDto extends createZodDto(
  UpdateForumPostResponseSchema,
) {}
