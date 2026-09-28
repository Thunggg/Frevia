import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { IsPublic } from '../../../shared/decorators/auth.decorator';
import {
  ForumCategoryDetailResponseDto,
  ForumCategoryListResponseDto,
  ForumPostListResponseDto,
  ForumPostFilterDto,
  CreateForumPostDto,
  CreateForumPostResponseDto,
  ViewForumPostDetailResponseDto,
  UpdateForumPostDto,
  UpdateForumPostResponseDto,
} from './forums.dto';
import { ForumService } from './forums.service';
import type {
  ForumPostFilterType,
  CreateForumPostType,
  UpdateForumPostType,
} from '@shared/types';
import { UserActive } from '../../../shared/decorators/user-active.decorators';

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
    @Query(new ZodValidationPipe(ForumPostFilterDto))
    filter: ForumPostFilterType,
  ) {
    return this.forumService.getForumPostLists(filter);
  }

  @Get('posts/:id')
  @IsPublic()
  @ZodSerializerDto(ViewForumPostDetailResponseDto)
  viewForumPostDetail(@Param('id', ParseIntPipe) id: number) {
    return this.forumService.viewForumPostDetail(id);
  }

  @Post('posts')
  @ZodSerializerDto(CreateForumPostResponseDto)
  createForumPost(
    @UserActive('userId') userId: number,
    @Body(new ZodValidationPipe(CreateForumPostDto))
    body: CreateForumPostType,
  ) {
    return this.forumService.createForumPost(userId, body);
  }

  @Patch('posts/:id')
  @ZodSerializerDto(UpdateForumPostResponseDto)
  updateForumPost(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    // Lấy Body và Validate theo schema UpdateForumPostSchema
    @Body(new ZodValidationPipe(UpdateForumPostDto))
    body: UpdateForumPostType,
  ) {
    return this.forumService.updateForumPost(id, userId, body);
  }

  @Delete('posts/:id')
  deleteForumPost(
    // Lấy thông tin user đang đăng nhập
    @UserActive('userId') userId: number,
    // Lấy vai trò để kiểm tra quyền sở hữu
    @UserActive('roleName') roleName: string,
    // Lấy id của post
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.forumService.deleteForumPost(id, userId, roleName);
  }
}
