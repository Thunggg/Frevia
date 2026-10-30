import { Injectable } from '@nestjs/common';

import {
  AiIndexDocument,
  AiRecommendationService,
} from '../../shared/services/ai-recommendation.service';
import { buildCvPayload, buildJobPayload } from './recommendation.payload';
import { RecommendationRepository } from './recommendation.repo';

// AI `/internal/index` chấp nhận tối đa 500 tài liệu/request.
const MAX_BATCH = 500;

export const cvDocumentId = (profileId: number): string => `cv_${profileId}`;
export const jobDocumentId = (jobId: number): string => `jd_${jobId}`;

/**
 * "Engine" đồng bộ index Chroma của AI service với dữ liệu Postgres (H26).
 *
 * Các phương thức `sync*`/`remove*` **ném lỗi** khi AI service không sẵn sàng;
 * `EmbeddingOutboxService` chịu trách nhiệm bọc retry qua bảng outbox. `rebuild()`
 * dùng cho endpoint vận hành cũng ném lỗi để caller trả về 503.
 */
@Injectable()
export class RecommendationIndexService {
  constructor(
    private readonly repository: RecommendationRepository,
    private readonly ai: AiRecommendationService,
  ) {}

  /** Upsert job nếu còn OPEN; ngược lại gỡ khỏi index. Trả về `true` khi đã upsert. */
  async syncJob(jobId: number): Promise<boolean> {
    const job = await this.repository.findJobById(jobId);
    if (!job || job.status !== 'OPEN') {
      await this.removeJob(jobId);
      return false;
    }

    await this.ai.indexDocuments([
      {
        id: jobDocumentId(job.id),
        type: 'jd',
        owner_id: String(job.clientId),
        visibility: 'public',
        ...buildJobPayload(job),
      },
    ]);
    return true;
  }

  /** Upsert hồ sơ freelancer; hồ sơ không còn tồn tại sẽ bị gỡ khỏi index. */
  async syncCv(profileId: number): Promise<boolean> {
    const cv = await this.repository.findFreelancerByProfileId(profileId);
    if (!cv) {
      await this.removeCv(profileId);
      return false;
    }

    await this.ai.indexDocuments([
      {
        id: cvDocumentId(cv.profileId),
        type: 'cv',
        owner_id: String(cv.userId),
        visibility: 'public',
        ...buildCvPayload(cv),
      },
    ]);
    return true;
  }

  async removeJob(jobId: number): Promise<void> {
    await this.ai.deleteDocuments([{ id: jobDocumentId(jobId), type: 'jd' }]);
  }

  async removeCv(profileId: number): Promise<void> {
    await this.ai.deleteDocuments([
      { id: cvDocumentId(profileId), type: 'cv' },
    ]);
  }

  /** Nạp lại toàn bộ job OPEN + hồ sơ freelancer có kỹ năng (§16). */
  async rebuild(): Promise<{ indexed: number }> {
    const jobs = await this.repository.listOpenJobs({ limit: MAX_BATCH });
    const cvs = await this.repository.listFreelancers({ limit: MAX_BATCH });

    const documents: AiIndexDocument[] = [
      ...jobs.map((job) => ({
        id: jobDocumentId(job.id),
        type: 'jd' as const,
        owner_id: String(job.clientId),
        visibility: 'public',
        ...buildJobPayload(job),
      })),
      ...cvs.map((cv) => ({
        id: cvDocumentId(cv.profileId),
        type: 'cv' as const,
        owner_id: String(cv.userId),
        visibility: 'public',
        ...buildCvPayload(cv),
      })),
    ];

    if (documents.length === 0) {
      return { indexed: 0 };
    }

    let indexed = 0;
    for (let start = 0; start < documents.length; start += MAX_BATCH) {
      const batch = documents.slice(start, start + MAX_BATCH);
      const result = await this.ai.indexDocuments(batch);
      indexed += result.indexed;
    }

    return { indexed };
  }
}
