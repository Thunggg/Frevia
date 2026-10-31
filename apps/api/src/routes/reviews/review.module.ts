import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repo';
import { ReviewService } from './review.service';

@Module({
  imports: [SharedModule],
  controllers: [ReviewController],
  providers: [ReviewRepository, ReviewService],
})
export class ReviewModule {}
