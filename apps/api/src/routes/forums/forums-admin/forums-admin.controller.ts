import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumAdminService } from './forums-admin.service';
import {
  ForumAdminStatsResponseDto,
  ForumAdminCategoryListResponseDto,
  ForumAdminCategoryDetailResponseDto,
  CreateForumCategoryBodyDto,
  UpdateForumCategoryBodyDto,
  ForumAdminCommentListResponseDto,
  PendingForumPostListResponseDto,
  ReviewForumPostResponseDto,
  ForumTrashPostListResponseDto,
  ForumTrashCommentListResponseDto,
  ForumRestorePostResponseDto,
  ForumRestoreCommentResponseDto,
} from './forums-admin.dto';

@Controller('forums/admin')
export class ForumAdminController {
  constructor(private readonly adminService: ForumAdminService) {}

  @Get('stats')
  @ZodSerializerDto(ForumAdminStatsResponseDto)
  getAdminStats(@UserActive('roleName') roleName: string) {
    return this.adminService.getAdminStats(roleName);
  }

  @Get('categories')
  @ZodSerializerDto(ForumAdminCategoryListResponseDto)
  getAdminCategoryLists(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('sortBy') sortBy: 'id' | 'name' | 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
  ) {
    return this.adminService.getAdminCategoryLists(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
      sortBy || undefined,
      sortOrder || undefined,
    );
  }

  @Get('categories/:id')
  @ZodSerializerDto(ForumAdminCategoryDetailResponseDto)
  getAdminCategoryById(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getAdminCategoryById(roleName, id);
  }

  @Post('categories')
  @ZodSerializerDto(ForumAdminCategoryDetailResponseDto)
  createAdminCategory(
    @UserActive('roleName') roleName: string,
    @Body() body: CreateForumCategoryBodyDto,
  ) {
    return this.adminService.createAdminCategory(roleName, body);
  }

  @Patch('categories/:id')
  @ZodSerializerDto(ForumAdminCategoryDetailResponseDto)
  updateAdminCategory(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateForumCategoryBodyDto,
  ) {
    return this.adminService.updateAdminCategory(roleName, id, body);
  }

  @Get('comments')
  @ZodSerializerDto(ForumAdminCommentListResponseDto)
  getAdminCommentLists(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.adminService.getAdminCommentLists(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
    );
  }

  // Danh sách bài viết PENDING chờ kiểm duyệt
  @Get('pending-posts')
  @ZodSerializerDto(PendingForumPostListResponseDto)
  getPendingPosts(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getPendingPosts(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // Danh sách bài viết trong trash (đã xóa / bị reject)
  @Get('trash/posts')
  @ZodSerializerDto(ForumTrashPostListResponseDto)
  getTrashPosts(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getTrashPosts(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // Danh sách bình luận trong trash (đã xóa)
  @Get('trash/comments')
  @ZodSerializerDto(ForumTrashCommentListResponseDto)
  getTrashComments(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.adminService.getTrashComments(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // Khôi phục bài viết khỏi trash
  @Patch('trash/posts/:id/restore')
  @ZodSerializerDto(ForumRestorePostResponseDto)
  restoreTrashPost(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.restoreTrashPost(roleName, id);
  }

  // Khôi phục bình luận khỏi trash
  @Patch('trash/comments/:id/restore')
  @ZodSerializerDto(ForumRestoreCommentResponseDto)
  restoreTrashComment(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.restoreTrashComment(roleName, id);
  }

  // Duyệt bài: Approve -> APPROVED (hiển thị công khai)
  @Patch('posts/:id/approve')
  @ZodSerializerDto(ReviewForumPostResponseDto)
  approvePendingPost(
    @UserActive('roleName') roleName: string,
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.reviewPendingPost(
      roleName,
      id,
      'APPROVED',
      userId,
    );
  }

  // Từ chối bài -> REJECTED (bài không hiển thị, chuyển vào Trash)
  @Patch('posts/:id/reject')
  @ZodSerializerDto(ReviewForumPostResponseDto)
  rejectPendingPost(
    @UserActive('roleName') roleName: string,
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.reviewPendingPost(
      roleName,
      id,
      'REJECTED',
      userId,
    );
  }
}
