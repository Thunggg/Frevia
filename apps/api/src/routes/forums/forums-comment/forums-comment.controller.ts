import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { ForumCommentService } from './forums-comment.service';
import {
  ForumCommentFilterDto,
  ForumCommentListResponseDto,
} from './forums-comment.dto';
import type { ForumCommentFilterType } from '@shared/types';
import { IsPublic } from '../../../shared/decorators/auth.decorator';

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
}
