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
} from './forums-comment.dto';
import type {
  CreateForumCommentType,
  EditForumCommentType,
  ForumCommentFilterType,
} from '@shared/types';
import { IsPublic } from '../../../shared/decorators/auth.decorator';
import { UserActive } from '../../../shared/decorators/user-active.decorators';

@Controller('api/forums/posts')
export class ForumCommentController {
  constructor(private readonly forumCommentService: ForumCommentService) {}

  @Get(':postId/comments')
  @IsPublic()
  @ZodSerializerDto(ForumCommentListResponseDto)
  getForumCommentLists(
    @Param('postId', ParseIntPipe) postId: number,
    @Query(new ZodValidationPipe(ForumCommentFilterDto))
    filter: ForumCommentFilterType,
  ) {
    return this.forumCommentService.getForumCommentLists({
      ...filter,
      postId,
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
}
