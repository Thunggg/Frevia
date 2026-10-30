import { ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AiRecommendItem } from '../../shared/services/ai-recommendation.service';
import type { FreelancerDocument, JobDocument } from './recommendation.repo';
import { RecommendationService } from './recommendation.service';

const freelancer: FreelancerDocument = {
  profileId: 11,
  userId: 2,
  displayName: 'Alice',
  avatarUrl: null,
  title: 'Backend Developer',
  bio: 'Builds APIs',
  cvUrl: null,
  skills: [{ name: 'TypeScript', proficiencyLevel: 8 }],
  experiences: [
    {
      title: 'Backend Developer',
      company: 'Acme',
      startDate: '2020-01',
      endDate: null,
      isCurrent: true,
      description: null,
    },
  ],
  educations: [],
  legacyExperience: [],
};

const job: JobDocument = {
  id: 5,
  clientId: 1,
  slug: 'backend-job',
  title: 'Backend Engineer',
  description: 'Build APIs',
  budgetMin: 100,
  budgetMax: 200,
  budgetType: 'FIXED_PRICE',
  status: 'OPEN',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  skills: ['TypeScript'],
};

function item(id: string, score: number): AiRecommendItem {
  return {
    id,
    score,
    components: {
      semantic: 0.7,
      skills: 0.8,
      experience: 0.6,
      budget: 0.5,
      preferences: 0,
      keyword: null,
    },
    section_components: {},
  };
}

function buildService() {
  const repository = {
    findFreelancerByUserId: jest.fn(),
    findJobById: jest.fn(),
    listOpenJobs: jest.fn(),
    listFreelancers: jest.fn(),
    saveRecommendations: jest.fn(),
    findRecommendationById: jest.fn(),
    createFeedback: jest.fn(),
    findFreelancerByProfileId: jest.fn(),
  };
  const ai = {
    embed: jest.fn().mockResolvedValue({
      model: 'bge-m3',
      vectors: [
        [1, 0],
        [0, 1],
      ],
    }),
    recommend: jest.fn(),
    explain: jest.fn(),
    cosine: jest.fn().mockReturnValue(0.7),
  };
  const service = new RecommendationService(repository as never, ai as never);
  return { service, repository, ai };
}

describe('RecommendationService', () => {
  it('rejects non-freelancers on the jobs endpoint', async () => {
    const { service } = buildService();

    await expect(
      service.getRecommendedJobs(1, 'Client', { limit: 10 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a freelancer profile before recommending jobs', async () => {
    const { service, repository } = buildService();
    repository.findFreelancerByUserId.mockResolvedValue(null);

    await expect(
      service.getRecommendedJobs(2, 'Freelancer', { limit: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ranks open jobs and persists the returned recommendations', async () => {
    const { service, repository, ai } = buildService();
    repository.findFreelancerByUserId.mockResolvedValue(freelancer);
    repository.listOpenJobs.mockResolvedValue([job]);
    repository.saveRecommendations.mockResolvedValue([
      { id: 99, targetDocumentId: 5 },
    ]);
    ai.recommend.mockResolvedValue([item('jd_5', 0.85)]);

    const result = await service.getRecommendedJobs(2, 'Freelancer', {
      limit: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].recommendationId).toBe(99);
    expect(result.data[0].job.id).toBe(5);

    expect(repository.saveRecommendations).toHaveBeenCalledWith([
      expect.objectContaining({
        requesterId: 2,
        sourceType: 'CV',
        sourceDocumentId: 11,
        targetType: 'JOB',
        targetDocumentId: 5,
        embeddingModel: 'bge-m3',
      }),
    ]);

    expect(ai.recommend).toHaveBeenCalledWith(
      expect.objectContaining({ direction: 'cv2jd', topK: 10 }),
    );
  });

  it('only lets a client request candidates for a job they own', async () => {
    const { service, repository } = buildService();
    repository.findJobById.mockResolvedValue({ ...job, clientId: 1 });

    await expect(
      service.getRecommendedFreelancers(2, 'Client', { jobId: 5, limit: 10 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ranks freelancers for an owned job and maps profile ids', async () => {
    const { service, repository, ai } = buildService();
    repository.findJobById.mockResolvedValue(job);
    repository.listFreelancers.mockResolvedValue([freelancer]);
    repository.saveRecommendations.mockResolvedValue([
      { id: 100, targetDocumentId: 11 },
    ]);
    ai.recommend.mockResolvedValue([item('cv_11', 0.9)]);

    const result = await service.getRecommendedFreelancers(1, 'Client', {
      jobId: 5,
      limit: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].recommendationId).toBe(100);
    expect(result.data[0].profileId).toBe(11);
    expect(result.data[0].skills).toEqual([
      { name: 'TypeScript', proficiencyLevel: 8 },
    ]);

    expect(repository.saveRecommendations).toHaveBeenCalledWith([
      expect.objectContaining({
        requesterId: 1,
        sourceType: 'JOB',
        sourceDocumentId: 5,
        targetType: 'CV',
        targetDocumentId: 11,
      }),
    ]);
  });

  it('blocks feedback from a user who does not own the recommendation', async () => {
    const { service, repository } = buildService();
    repository.findRecommendationById.mockResolvedValue({
      id: 7,
      requesterId: 99,
    });

    await expect(service.submitFeedback(2, 7, 'SAVE')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('stores feedback for the recommendation owner', async () => {
    const { service, repository } = buildService();
    repository.findRecommendationById.mockResolvedValue({
      id: 7,
      requesterId: 2,
    });
    repository.createFeedback.mockResolvedValue({
      id: 1,
      recommendationId: 7,
      type: 'SAVE',
      createdAt: new Date(),
    });

    await expect(service.submitFeedback(2, 7, 'SAVE')).resolves.toMatchObject({
      recommendationId: 7,
    });
    expect(repository.createFeedback).toHaveBeenCalledWith(7, 'SAVE');
  });
});
