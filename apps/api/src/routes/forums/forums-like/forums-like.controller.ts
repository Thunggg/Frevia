import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumLikeService } from './forums-like.service';
import { CreateForumLikeResponseDto } from './forums-like.dto';

@Controller('api/forums/posts')
export class ForumLikeController {
  constructor(private readonly forumLikeService: ForumLikeService) {}

  // Like post
  @Post(':id/like')
  @ZodSerializerDto(CreateForumLikeResponseDto)
  likePost(
    // Lấy thông tin user đang đăng nhập
    @UserActive('userId') userId: number,
    // Lấy id của post
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.forumLikeService.likePost(userId, id);
  }
}
