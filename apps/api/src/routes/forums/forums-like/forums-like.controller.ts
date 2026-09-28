import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumLikeService } from './forums-like.service';
import { ToggleLikeResponseDto } from './forums-like.dto';

@Controller('api/forums/posts')
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
}
