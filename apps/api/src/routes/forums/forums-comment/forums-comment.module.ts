import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { ForumCommentController } from './forums-comment.controller';
import { ForumCommentService } from './forums-comment.service';
import { ForumCommentRepository } from './forums-comment.repo';

@Module({
  controllers: [ForumCommentController],
  providers: [ForumCommentService, ForumCommentRepository],
  imports: [SharedModule],
})
export class ForumCommentModule {}
