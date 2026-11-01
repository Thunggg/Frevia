import { Injectable, Logger } from '@nestjs/common';
import {
  RecommendationFeedbackType,
  RecommendedFreelancerResponseType,
  RecommendedJobResponseType,
  RoleName,
  ViewRecommendedFreelancersQueryType,
  ViewRecommendedJobsQueryType,
} from '@shared/types';

import {
  AiRecommendationService,
  AiRecommendItem,
} from '../../shared/services/ai-recommendation.service';
import {
  FreelancerProfileNotFoundException,
  JobForRecommendationNotFoundException,
  RecommendationForbiddenException,
  RecommendationNotFoundException,
  RecommendationRoleNotAllowedException,
} from './recommendation.error';
import {
  buildCvPayload,
  buildCvText,
  buildJobPayload,
  buildJobText,
} from './recommendation.payload';
import { RecommendationRepository } from './recommendation.repo';

const RANKING_VERSION = 'hybrid-1.0.0';
const MAX_CANDIDATES = 100;

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly repository: RecommendationRepository,
    private readonly ai: AiRecommendationService,
  ) {}

  async getRecommendedJobs(
    userId: number,
    roleName: string,
    query: ViewRecommendedJobsQueryType,
  ): Promise<RecommendedJobResponseType> {
    if (roleName !== RoleName.FREELANCER) {
      throw RecommendationRoleNotAllowedException();
    }

    const cv = await this.repository.findFreelancerByUserId(userId);
    if (!cv) {
      throw FreelancerProfileNotFoundException();
    }

    const jobs = await this.repository.listOpenJobs({
      excludeClientId: userId,
      limit: MAX_CANDIDATES,
    });

    if (jobs.length === 0) {
      return { data: [] };
    }

    const result = await this.rank({
      direction: 'cv2jd',
      queryPayload: buildCvPayload(cv),
      queryText: buildCvText(cv),
      candidates: jobs.map((job) => ({
        key: `jd_${job.id}`,
        doc: job,
        payload: buildJobPayload(job),
        text: buildJobText(job),
      })),
      topK: query.limit,
    });

    if (result.items.length === 0) {
      return { data: [] };
    }

    const saved = await this.repository.saveRecommendations(
      result.items.map(({ item, doc }) => ({
        requesterId: userId,
        sourceType: 'CV',
        sourceDocumentId: cv.profileId,
        targetType: 'JOB',
        targetDocumentId: doc.id,
        semanticScore: safe(item.components.semantic),
        skillScore: safe(item.components.skills),
        experienceScore: safe(item.components.experience),
        budgetScore: safe(item.components.budget),
        preferenceScore: safe(item.components.preferences),
        finalScore: safe(item.score),
        rankingVersion: RANKING_VERSION,
        embeddingModel: result.embeddingModel,
      })),
    );

    const savedByTarget = new Map(
      saved.map((row) => [row.targetDocumentId, row.id]),
    );

    return {
      data: result.items.map(({ doc, item }) => ({
        recommendationId: savedByTarget.get(doc.id) ?? null,
        score: safe(item.score),
        components: normalizeComponents(item),
        job: {
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          description: doc.description,
          budgetMin: doc.budgetMin,
          budgetMax: doc.budgetMax,
          budgetType: doc.budgetType,
          status: doc.status,
          skills: doc.skills,
          createdAt: doc.createdAt,
        },
      })),
    };
  }

  async getRecommendedFreelancers(
    userId: number,
    roleName: string,
    query: ViewRecommendedFreelancersQueryType,
  ): Promise<RecommendedFreelancerResponseType> {
    if (roleName !== RoleName.CLIENT) {
      throw RecommendationRoleNotAllowedException();
    }

    const job = await this.repository.findJobById(query.jobId);
    if (!job) {
      throw JobForRecommendationNotFoundException();
    }

    if (job.clientId !== userId) {
      throw RecommendationForbiddenException();
    }

    const freelancers = await this.repository.listFreelancers({
      excludeUserId: userId,
      limit: MAX_CANDIDATES,
    });

    if (freelancers.length === 0) {
      return { data: [] };
    }

    const result = await this.rank({
      direction: 'jd2cv',
      queryPayload: buildJobPayload(job),
      queryText: buildJobText(job),
      candidates: freelancers.map((cv) => ({
        key: `cv_${cv.profileId}`,
        doc: cv,
        payload: buildCvPayload(cv),
        text: buildCvText(cv),
      })),
      topK: query.limit,
    });

    if (result.items.length === 0) {
      return { data: [] };
    }

    const saved = await this.repository.saveRecommendations(
      result.items.map(({ item, doc }) => ({
        requesterId: userId,
        sourceType: 'JOB',
        sourceDocumentId: job.id,
        targetType: 'CV',
        targetDocumentId: doc.profileId,
        semanticScore: safe(item.components.semantic),
        skillScore: safe(item.components.skills),
        experienceScore: safe(item.components.experience),
        budgetScore: safe(item.components.budget),
        preferenceScore: safe(item.components.preferences),
        finalScore: safe(item.score),
        rankingVersion: RANKING_VERSION,
        embeddingModel: result.embeddingModel,
      })),
    );

    const savedByTarget = new Map(
      saved.map((row) => [row.targetDocumentId, row.id]),
    );

    return {
      data: result.items.map(({ doc, item }) => ({
        recommendationId: savedByTarget.get(doc.profileId) ?? null,
        score: safe(item.score),
        components: normalizeComponents(item),
        profileId: doc.profileId,
        userId: doc.userId,
        displayName: doc.displayName,
        avatarUrl: doc.avatarUrl,
        title: doc.title,
        skills: doc.skills.map((skill) => ({
          name: skill.name,
          proficiencyLevel: skill.proficiencyLevel,
        })),
      })),
    };
  }

  async getExplanation(userId: number, recommendationId: number) {
    const recommendation =
      await this.repository.findRecommendationById(recommendationId);

    if (!recommendation) {
      throw RecommendationNotFoundException();
    }

    if (recommendation.requesterId !== userId) {
      throw RecommendationForbiddenException();
    }

    const jobId =
      recommendation.sourceType === 'JOB'
        ? recommendation.sourceDocumentId
        : recommendation.targetDocumentId;
    const profileId =
      recommendation.sourceType === 'CV'
        ? recommendation.sourceDocumentId
        : recommendation.targetDocumentId;

    const [job, cv] = await Promise.all([
      this.repository.findJobById(jobId),
      this.repository.findFreelancerByProfileId(profileId),
    ]);

    if (!job || !cv) {
      throw RecommendationNotFoundException();
    }

    const explanation = await this.ai.explain(
      buildJobPayload(job),
      buildCvPayload(cv),
      {
        score: safe(recommendation.finalScore) * 100,
        components: {
          semantic: safe(recommendation.semanticScore),
          skills: safe(recommendation.skillScore),
          experience: safe(recommendation.experienceScore),
          budget: safe(recommendation.budgetScore),
          preferences: safe(recommendation.preferenceScore),
        },
      },
    );

    return {
      ready: explanation.ready,
      summary: explanation.summary,
      claims: explanation.claims.map((claim) => ({
        statement: claim.statement,
        verdict: claim.verdict,
        evidence: claim.evidence ?? null,
        source: claim.source ?? null,
        confidence: claim.confidence ?? null,
      })),
      fallbackReason: explanation.fallbackReason,
      model: explanation.model,
      durationMs: explanation.durationMs,
    };
  }

  async submitFeedback(
    userId: number,
    recommendationId: number,
    type: RecommendationFeedbackType,
  ) {
    const recommendation =
      await this.repository.findRecommendationById(recommendationId);

    if (!recommendation) {
      throw RecommendationNotFoundException();
    }

    if (recommendation.requesterId !== userId) {
      throw RecommendationForbiddenException();
    }

    return this.repository.createFeedback(recommendationId, type);
  }

  private async rank<T>(input: {
    direction: 'jd2cv' | 'cv2jd';
    queryPayload: Record<string, unknown>;
    queryText: string;
    candidates: Array<{
      key: string;
      doc: T;
      payload: Record<string, unknown>;
      text: string;
    }>;
    topK: number;
  }): Promise<{
    embeddingModel: string;
    items: Array<{ doc: T; item: AiRecommendItem }>;
  }> {
    const texts = [
      input.queryText,
      ...input.candidates.map((candidate) => candidate.text),
    ];

    const { model, vectors } = await this.ai.embed(texts);
    const queryVector = vectors[0] ?? [];

    const candidates = input.candidates.map((candidate, index) => ({
      ...candidate.payload,
      id: candidate.key,
      semantic: this.ai.cosine(queryVector, vectors[index + 1] ?? []),
    }));

    const results = await this.ai.recommend({
      direction: input.direction,
      query: input.queryPayload,
      candidates,
      topK: input.topK,
    });

    const byKey = new Map(
      input.candidates.map((candidate) => [candidate.key, candidate.doc]),
    );

    const items = results.flatMap((item) => {
      const doc = byKey.get(item.id);
      return doc ? [{ doc, item }] : [];
    });

    return { embeddingModel: model, items };
  }
}

function safe(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeComponents(item: AiRecommendItem) {
  return {
    semantic: safe(item.components.semantic),
    skills: safe(item.components.skills),
    experience: safe(item.components.experience),
    budget: safe(item.components.budget),
    preferences: safe(item.components.preferences),
    keyword:
      typeof item.components.keyword === 'number'
        ? item.components.keyword
        : null,
  };
}
