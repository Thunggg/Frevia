import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';

import type { EmbeddingOutboxService } from './embedding-outbox.service';
import type { RecommendationIndexService } from './recommendation-index.service';
import type { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';

describe('RecommendationController', () => {
  const recommendationService = {} as RecommendationService;
  let recommendationIndexService: { rebuild: jest.Mock };
  let embeddingOutboxService: { processPending: jest.Mock };
  let controller: RecommendationController;

  beforeEach(() => {
    recommendationIndexService = {
      rebuild: jest.fn().mockResolvedValue({ indexed: 3 }),
    };
    embeddingOutboxService = {
      processPending: jest.fn().mockResolvedValue({ processed: 2, failed: 0 }),
    };
    controller = new RecommendationController(
      recommendationService,
      recommendationIndexService as unknown as RecommendationIndexService,
      embeddingOutboxService as unknown as EmbeddingOutboxService,
    );
  });

  describe('reindex', () => {
    it('lets an admin rebuild the index', async () => {
      await expect(controller.reindex(RoleName.ADMIN)).resolves.toEqual({
        indexed: 3,
      });
      expect(recommendationIndexService.rebuild).toHaveBeenCalled();
    });

    it('forbids non-admin users from rebuilding the index', async () => {
      await expect(
        controller.reindex(RoleName.FREELANCER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(recommendationIndexService.rebuild).not.toHaveBeenCalled();
    });

    it('maps AI failures during rebuild to a service-unavailable error', async () => {
      recommendationIndexService.rebuild.mockRejectedValue(
        new Error('AI down'),
      );

      await expect(controller.reindex(RoleName.ADMIN)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('processOutbox', () => {
    it('lets an admin drain the outbox', async () => {
      await expect(controller.processOutbox(RoleName.ADMIN)).resolves.toEqual({
        processed: 2,
        failed: 0,
      });
      expect(embeddingOutboxService.processPending).toHaveBeenCalled();
    });

    it('forbids non-admin users from processing the outbox', async () => {
      await expect(
        controller.processOutbox(RoleName.CLIENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(embeddingOutboxService.processPending).not.toHaveBeenCalled();
    });
  });
});
