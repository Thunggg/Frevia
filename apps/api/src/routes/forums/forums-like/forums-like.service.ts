import { HttpException, Injectable } from '@nestjs/common';
import { ForumLikeRepository } from './forums-like.repo';
import { ToggleLikeResponseType } from '@shared/types';
import {
  ForumPostNotFoundException,
  FailedToLikeForumPostException,
  FailedToViewForumLikeDetailException,
} from './forums-like.error';

@Injectable()
export class ForumLikeService {
  constructor(private readonly forumLikeRepository: ForumLikeRepository) {}

  async toggleLikePost(
    userId: number,
    postId: number,
  ): Promise<ToggleLikeResponseType> {
    try {
      const existingPost = await this.forumLikeRepository.findPostById(postId);

      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      const existingLike = await this.forumLikeRepository.findLikeByUserAndPost(
        userId,
        postId,
      );

      // Nếu người dùng đã like post -> bỏ like post
      if (existingLike) {
        await this.forumLikeRepository.deletePostLike(userId, postId);

        return {
          liked: false,
        };
      }

      // Nếu người dùng chưa like post -> like post
      await this.forumLikeRepository.createPostLike(userId, postId);

      return {
        liked: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw FailedToLikeForumPostException();
    }
  }

  // Xem tất cả người dùng đã like post
  async viewForumLikeDetail(postId: number) {
    try {
      const likes = await this.forumLikeRepository.viewForumLikeDetail(postId);
      // Trả về danh sách người dùng đã like post
      return likes;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToViewForumLikeDetailException();
    }
  }
}
