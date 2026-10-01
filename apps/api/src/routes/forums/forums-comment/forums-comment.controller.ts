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
import { ForumCommentService } from './forums-comment.service';
import {
  CreateForumCommentDto,
  CreateForumCommentResponseDto,
  DeleteForumCommentResponseDto,
  EditForumCommentDto,
  EditForumCommentResponseDto,
  ForumCommentFilterDto,
  ForumCommentListResponseDto,
  ToggleLikeCommentResponseDto,
} from './forums-comment.dto';
import type {
  CreateForumCommentType,
  EditForumCommentType,
  ForumCommentFilterType,
} from '@shared/types';
import { UserActive } from '../../../shared/decorators/user-active.decorators';

@Controller('forums/posts')
export class ForumCommentController {
  constructor(private readonly forumCommentService: ForumCommentService) {}

  @Get(':postId/comments')
  @ZodSerializerDto(ForumCommentListResponseDto)
  getForumCommentLists(
    @Param('postId', ParseIntPipe) postId: number,
    @Query(new ZodValidationPipe(ForumCommentFilterDto))
    filter: ForumCommentFilterType,
    @UserActive('userId') userId: number,
  ) {
    return this.forumCommentService.getForumCommentLists({
      ...filter,
      postId,
      userId,
    });
  }

  @Post(':postId/comments')
  @ZodSerializerDto(CreateForumCommentResponseDto)
  createForumComment(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body(new ZodValidationPipe(CreateForumCommentDto))
    body: CreateForumCommentType,
  ) {
    return this.forumCommentService.createForumComment(postId, userId, body);
  }

  @Patch(':postId/comments/:id')
  @ZodSerializerDto(EditForumCommentResponseDto)
  updateForumComment(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(EditForumCommentDto))
    body: EditForumCommentType,
  ) {
    return this.forumCommentService.updateForumComment(
      postId,
      id,
      userId,
      body,
    );
  }

  @Delete(':postId/comments/:id')
  @ZodSerializerDto(DeleteForumCommentResponseDto)
  deleteForumComment(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.forumCommentService.deleteForumComment(
      postId,
      id,
      userId,
      roleName,
    );
  }

  @Post(':postId/comments/:commentId/like')
  @ZodSerializerDto(ToggleLikeCommentResponseDto)
  toggleLikeComment(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.forumCommentService.toggleLikeComment(
      userId,
      postId,
      commentId,
    );
  }
}
