import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumLikeService } from './forums-like.service';
import {
  ToggleLikeResponseDto,
  ViewForumLikeDetailResponseDto,
} from './forums-like.dto';
import { IsPublic } from '../../../shared/decorators/auth.decorator';

@Controller('forums/posts')
export class ForumLikeController {
  constructor(private readonly forumLikeService: ForumLikeService) {}

  @Post(':id/like')
  @ZodSerializerDto(ToggleLikeResponseDto)
  toggleLikePost(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.forumLikeService.toggleLikePost(userId, id);
  }

  @Get(':id/like')
  @IsPublic()
  @ZodSerializerDto(ViewForumLikeDetailResponseDto)
  viewForumLikeDetail(@Param('id', ParseIntPipe) postId: number) {
    return this.forumLikeService.viewForumLikeDetail(postId);
  }
}
