import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { EmbeddingOutboxService } from './embedding-outbox.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationIndexService } from './recommendation-index.service';
import { RecommendationRepository } from './recommendation.repo';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [SharedModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationRepository,
    RecommendationIndexService,
    EmbeddingOutboxService,
  ],
  exports: [RecommendationIndexService, EmbeddingOutboxService],
})
export class RecommendationModule {}
