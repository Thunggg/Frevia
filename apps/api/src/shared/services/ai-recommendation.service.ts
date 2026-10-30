import { Injectable, Logger } from '@nestjs/common';

import { aiInternalAuthHeaders } from './ai-internal-auth';

const AI_SERVICE_URL =
  process.env.FREVIA_AI_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 20_000;

export type AiVector = number[];

export type AiRecommendComponents = {
  semantic: number;
  skills: number;
  experience: number;
  budget: number;
  preferences: number;
  keyword: number | null;
};

export type AiRecommendItem = {
  id: string;
  score: number;
  components: AiRecommendComponents;
  section_components: Record<string, number>;
};

export type AiExplainClaim = {
  statement: string;
  verdict: 'hit' | 'missing' | 'unknown';
  evidence: string | null;
  source: 'job' | 'cv' | null;
  confidence: number | null;
};

export type AiExplanation = {
  ready: boolean;
  summary: string | null;
  claims: AiExplainClaim[];
  fallbackReason: string | null;
  model: string;
  durationMs: number;
};

export type AiDocumentType = 'cv' | 'jd';

/** Tài liệu upsert vào Chroma: `id`/`type` bắt buộc, các field còn lại là payload. */
export type AiIndexDocument = Record<string, unknown> & {
  id: string;
  type: AiDocumentType;
};

export type AiIndexReference = {
  id: string;
  type: AiDocumentType;
};

/**
 * Client gọi service AI nội bộ (`section-aware-cv-job-matching/apps/ai`).
 *
 * - `embed`: nhúng text (dùng để tính điểm semantic full-text phía NestJS).
 * - `recommend`: Hybrid Ranking §7 ở chế độ stateless (candidates gửi kèm).
 * - `explain`: explanation có bằng chứng (§8) qua Qwen.
 */
export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);

  async embed(
    texts: string[],
  ): Promise<{ model: string; vectors: AiVector[] }> {
    if (texts.length === 0) {
      return { model: '', vectors: [] };
    }

    const payload = await this.post('/internal/embeddings', { texts });
    const data = payload as { model?: unknown; vectors?: unknown };
    const vectors = data.vectors;

    if (!Array.isArray(vectors) || vectors.length !== texts.length) {
      throw new AiServiceError(
        'AI service returned an invalid embedding payload.',
      );
    }

    return {
      model: typeof data.model === 'string' ? data.model : '',
      vectors: vectors.map((vector) =>
        Array.isArray(vector) ? vector.map((value) => Number(value)) : [],
      ),
    };
  }

  async recommend(input: {
    direction: 'jd2cv' | 'cv2jd';
    query: Record<string, unknown>;
    candidates: Array<Record<string, unknown>>;
    topK: number;
    keywordAlpha?: number;
  }): Promise<AiRecommendItem[]> {
    const payload = await this.post('/internal/recommend', {
      direction: input.direction,
      query: input.query,
      candidates: input.candidates,
      top_k: input.topK,
      ...(input.keywordAlpha !== undefined
        ? { keyword_alpha: input.keywordAlpha }
        : {}),
    });

    const results = (payload as { results?: unknown }).results;
    if (!Array.isArray(results)) {
      throw new AiServiceError(
        'AI service returned an invalid recommendation payload.',
      );
    }

    return results as AiRecommendItem[];
  }

  async explain(
    job: Record<string, unknown>,
    cv: Record<string, unknown>,
    match?: Record<string, unknown>,
  ): Promise<AiExplanation> {
    const payload = await this.post('/internal/explain', { job, cv, match });

    const data = payload as {
      ready?: unknown;
      summary?: unknown;
      claims?: unknown;
      fallback_reason?: unknown;
      model?: unknown;
      duration_ms?: unknown;
    };

    const claims = Array.isArray(data.claims) ? data.claims : [];

    return {
      ready: Boolean(data.ready),
      summary: typeof data.summary === 'string' ? data.summary : null,
      claims: claims as AiExplainClaim[],
      fallbackReason:
        typeof data.fallback_reason === 'string' ? data.fallback_reason : null,
      model: typeof data.model === 'string' ? data.model : '',
      durationMs: Number(data.duration_ms ?? 0),
    };
  }

  /**
   * Upsert CV/JD vào Chroma + payload store của AI service (`/internal/index`).
   * Trả về số tài liệu đã nạp; rỗng thì bỏ qua để tránh request vô nghĩa.
   */
  async indexDocuments(
    documents: AiIndexDocument[],
  ): Promise<{ indexed: number }> {
    if (documents.length === 0) {
      return { indexed: 0 };
    }

    const payload = await this.post('/internal/index', { documents });
    const data = payload as { indexed?: unknown };

    return {
      indexed: typeof data.indexed === 'number' ? data.indexed : 0,
    };
  }

  /** Xoá CV/JD khỏi Chroma + payload store của AI service (`/internal/index/delete`). */
  async deleteDocuments(
    documents: AiIndexReference[],
  ): Promise<{ deleted: number }> {
    if (documents.length === 0) {
      return { deleted: 0 };
    }

    const payload = await this.post('/internal/index/delete', { documents });
    const data = payload as { deleted?: unknown };

    return {
      deleted: typeof data.deleted === 'number' ? data.deleted : 0,
    };
  }

  /** Cosine similarity, chuẩn hoá về [0, 1] cho phù hợp thang điểm semantic. */
  cosine(a: AiVector, b: AiVector): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    const normalized = (cosine + 1) / 2;

    return Math.min(1, Math.max(0, normalized));
  }

  private async post(
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(`${AI_SERVICE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...aiInternalAuthHeaders(),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`AI service unreachable at ${path}`, error);
      throw new AiServiceError('AI service is unreachable.');
    }

    if (!response.ok) {
      throw new AiServiceError(`AI service failed (${response.status}).`);
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new AiServiceError('AI service returned an invalid JSON response.');
    }
  }
}
