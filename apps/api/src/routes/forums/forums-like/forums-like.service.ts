import { Injectable } from '@nestjs/common';
import { ForumLikeRepository } from './forums-like.repo';
import { ToggleLikeResponseType } from '@shared/types';
import {
  ForumPostNotFoundException,
  FailedToLikeForumPostException,
} from './forums-like.error';

@Injectable()
export class ForumLikeService {
  constructor(private readonly forumLikeRepository: ForumLikeRepository) {}

  // Nếu ấn 1 lần thì nhận là like post, còn 2 lần thì bỏ like
  async toggleLikePost(
    userId: number,
    postId: number,
  ): Promise<ToggleLikeResponseType> {
    try {
      const existingPost = await this.forumLikeRepository.findPostById(postId);
      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      // Kiểm tra xem post có được người dùng like trước đó không
      const existingLike = await this.forumLikeRepository.findLikeByUserAndPost(
        userId,
        postId,
      );

      // Nếu post được like thì bỏ like
      if (existingLike) {
        await this.forumLikeRepository.deleteLike(userId, postId);
        return { liked: false };
      }

      // Tạo like cho post
      await this.forumLikeRepository.createLike(userId, postId);
      return { liked: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundException') {
        throw error;
      }
      throw FailedToLikeForumPostException();
    }
  }
}
