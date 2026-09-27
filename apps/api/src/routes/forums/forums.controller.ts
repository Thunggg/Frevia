import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  ForumCategoryDetailResponseDto,
  ForumCategoryListResponseDto,
  ForumPostListResponseDto,
  CreateForumPostResponseDto,
} from './forums.dto';
import { ForumService } from './forums.service';
import { ForumPostFilterSchema } from '@shared/types';
import { CreateForumPostSchema } from '@shared/types';
import type { ForumPostFilterType } from '@shared/types';
import type { CreateForumPostType } from '@shared/types';
import { UserActive } from '../../shared/decorators/user-active.decorators';

@Controller('api/forums')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('categories')
  @IsPublic() // Dùng cho các API không cần phải đăng nhập
  @ZodSerializerDto(ForumCategoryListResponseDto)
  getForumCategories() {
    return this.forumService.getForumCategories();
  }

  @Get('categories/:id')
  @IsPublic()
  @ZodSerializerDto(ForumCategoryDetailResponseDto)
  getForumCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.forumService.getForumCategoryById(id);
  }

  @Get('posts')
  @IsPublic()
  @ZodSerializerDto(ForumPostListResponseDto)
  getForumPostLists(
    // Sử dụng ZodValidationPipe để validate query params theo schema ForumPostFilterSchema
    // Có thể có filter hoặc không nhưng băt buộc phải có page và limit, nếu không có thì mặc định là page = 1, limit = 10
    @Query(new ZodValidationPipe(ForumPostFilterSchema))
    filter: ForumPostFilterType,
  ) {
    return this.forumService.getForumPostLists(filter);
  }

  @Post('posts')
  @ZodSerializerDto(CreateForumPostResponseDto)
  createForumPost(
    @UserActive('userId') userId: number,
    @Body(new ZodValidationPipe(CreateForumPostSchema))
    body: CreateForumPostType,
  ) {
    return this.forumService.createForumPost(userId, body);
  }
}
