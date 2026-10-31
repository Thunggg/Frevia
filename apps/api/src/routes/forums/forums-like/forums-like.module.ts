import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { ForumLikeController } from './forums-like.controller';
import { ForumLikeRepository } from './forums-like.repo';
import { ForumLikeService } from './forums-like.service';

@Module({
  controllers: [ForumLikeController],
  providers: [ForumLikeService, ForumLikeRepository],
  imports: [SharedModule],
})
export class ForumLikeModule {}
