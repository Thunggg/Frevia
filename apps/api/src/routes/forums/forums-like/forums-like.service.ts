import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ForumLikeRepository } from './forums-like.repo';
import { ToggleLikeResponseType } from '@shared/types';
import {
  ForumPostNotFoundException,
  FailedToLikeForumPostException,
  FailedToViewForumLikeDetailException,
} from './forums-like.error';
import { NotificationRealtimeService } from '../../../shared/services/notification-realtime.service';

@Injectable()
export class ForumLikeService {
  private readonly logger = new Logger(ForumLikeService.name);

  constructor(
    private readonly forumLikeRepository: ForumLikeRepository,
    private readonly notificationRealtime: NotificationRealtimeService,
  ) {}

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

      // Thông báo cho chủ bài viết (không chặn like nếu lỗi)
      try {
        const notification =
          await this.forumLikeRepository.createPostLikeNotification({
            postAuthorId: existingPost.userId,
            likerId: userId,
            postId: existingPost.id,
            postSlug: existingPost.slug,
            categoryId: existingPost.categoryId,
            categorySlug: existingPost.category?.slug ?? null,
          });

        if (notification) {
          this.notificationRealtime.emit(existingPost.userId, notification);
        }
      } catch (notifyError) {
        this.logger.warn(
          `Failed to create like notification: ${(notifyError as Error).message}`,
        );
      }

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
