import { Injectable } from '@nestjs/common';
import { ForumLikeRepository } from './forums-like.repo';
import { CreateForumLikeResponseType } from '@shared/types';
import {
  ForumPostNotFoundException,
  FailedToLikeForumPostException,
} from './forums-like.error';

@Injectable()
export class ForumLikeService {
  constructor(private readonly forumLikeRepository: ForumLikeRepository) {}

  // Tạo like cho post
  async likePost(
    userId: number,
    postId: number,
  ): Promise<CreateForumLikeResponseType> {
    try {
      const existingPost = await this.forumLikeRepository.findPostById(postId);
      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      const like = await this.forumLikeRepository.createLike(userId, postId);
      return like;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundException') {
        throw error;
      }
      throw FailedToLikeForumPostException();
    }
  }
}
