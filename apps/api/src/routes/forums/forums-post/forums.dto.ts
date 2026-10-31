import {
  ForumCategoryDetailResponseSchema,
  ForumCategoryListResponseSchema,
  ForumCategoryTopListResponseSchema,
  ForumTopActiveUserListResponseSchema,
  ForumPostListResponseSchema,
  ForumPostFilterSchema,
  CreateForumPostSchema,
  CreateForumPostResponseSchema,
  ViewForumPostDetailResponseSchema,
  UpdateForumPostSchema,
  UpdateForumPostResponseSchema,
  ForumTopPostListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

// DTO cho response của API lấy danh sách forum categories
export class ForumCategoryListResponseDto extends createZodDto(
  ForumCategoryListResponseSchema,
) {}

export class ForumCategoryDetailResponseDto extends createZodDto(
  ForumCategoryDetailResponseSchema,
) {}

// DTO cho response của API lấy top forum categories
export class ForumCategoryTopListResponseDto extends createZodDto(
  ForumCategoryTopListResponseSchema,
) {}

// DTO cho response của API lấy top người dùng hoạt động nhiều nhất
export class ForumTopActiveUserListResponseDto extends createZodDto(
  ForumTopActiveUserListResponseSchema,
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

export class ForumTopPostListResponseDto extends createZodDto(
  ForumTopPostListResponseSchema,
) {}
