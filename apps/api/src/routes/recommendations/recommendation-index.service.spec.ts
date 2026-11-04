import type { AiRecommendationService } from '../../shared/services/ai-recommendation.service';
import {
  RecommendationIndexService,
  cvDocumentId,
  jobDocumentId,
} from './recommendation-index.service';
import type {
  FreelancerDocument,
  JobDocument,
  RecommendationRepository,
} from './recommendation.repo';

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

const freelancer: FreelancerDocument = {
  profileId: 11,
  userId: 2,
  displayName: 'Alice',
  avatarUrl: null,
  title: 'Backend Developer',
  bio: 'Builds APIs',
  cvUrl: null,
  skills: [{ name: 'TypeScript', proficiencyLevel: 8 }],
  experiences: [],
  educations: [],
  legacyExperience: [],
};

describe('RecommendationIndexService', () => {
  let repository: {
    findJobById: jest.Mock;
    findFreelancerByProfileId: jest.Mock;
    listOpenJobs: jest.Mock;
    listFreelancers: jest.Mock;
  };
  let ai: {
    indexDocuments: jest.Mock;
    deleteDocuments: jest.Mock;
  };
  let service: RecommendationIndexService;

  beforeEach(() => {
    repository = {
      findJobById: jest.fn().mockResolvedValue(job),
      findFreelancerByProfileId: jest.fn().mockResolvedValue(freelancer),
      listOpenJobs: jest.fn().mockResolvedValue([job]),
      listFreelancers: jest.fn().mockResolvedValue([freelancer]),
    };
    ai = {
      indexDocuments: jest.fn().mockResolvedValue({ indexed: 1 }),
      deleteDocuments: jest.fn().mockResolvedValue({ deleted: 1 }),
    };
    service = new RecommendationIndexService(
      repository as unknown as RecommendationRepository,
      ai as unknown as AiRecommendationService,
    );
  });

  it('upserts an OPEN job with owner/visibility metadata', async () => {
    await expect(service.syncJob(5)).resolves.toBe(true);

    const [documents] = ai.indexDocuments.mock.calls[0] as [
      Array<Record<string, unknown>>,
    ];
    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: jobDocumentId(5),
      type: 'jd',
      owner_id: '1',
      visibility: 'public',
      title: 'Backend Engineer',
    });
    expect(ai.deleteDocuments).not.toHaveBeenCalled();
  });

  it('removes a job that is no longer OPEN', async () => {
    repository.findJobById.mockResolvedValue({ ...job, status: 'CLOSED' });

    await expect(service.syncJob(5)).resolves.toBe(false);

    expect(ai.indexDocuments).not.toHaveBeenCalled();
    expect(ai.deleteDocuments).toHaveBeenCalledWith([
      { id: jobDocumentId(5), type: 'jd' },
    ]);
  });

  it('removes a job that no longer exists', async () => {
    repository.findJobById.mockResolvedValue(null);

    await expect(service.syncJob(9)).resolves.toBe(false);

    expect(ai.deleteDocuments).toHaveBeenCalledWith([
      { id: jobDocumentId(9), type: 'jd' },
    ]);
  });

  it('surfaces AI failures when syncing a job so the outbox can retry', async () => {
    ai.indexDocuments.mockRejectedValue(new Error('AI down'));

    await expect(service.syncJob(5)).rejects.toThrow('AI down');
  });

  it('upserts a freelancer CV with owner metadata', async () => {
    await expect(service.syncCv(11)).resolves.toBe(true);

    const [documents] = ai.indexDocuments.mock.calls[0] as [
      Array<Record<string, unknown>>,
    ];
    expect(documents[0]).toMatchObject({
      id: cvDocumentId(11),
      type: 'cv',
      owner_id: '2',
      visibility: 'public',
      title: 'Backend Developer',
    });
  });

  it('surfaces AI failures when removing a CV so the outbox can retry', async () => {
    ai.deleteDocuments.mockRejectedValue(new Error('AI down'));

    await expect(service.removeCv(11)).rejects.toThrow('AI down');
    expect(ai.deleteDocuments).toHaveBeenCalledWith([
      { id: cvDocumentId(11), type: 'cv' },
    ]);
  });

  it('rebuilds the index from open jobs and freelancers', async () => {
    ai.indexDocuments.mockResolvedValue({ indexed: 2 });

    await expect(service.rebuild()).resolves.toEqual({ indexed: 2 });

    const [documents] = ai.indexDocuments.mock.calls[0] as [
      Array<Record<string, unknown>>,
    ];
    expect(documents.map((doc) => doc.id)).toEqual([
      jobDocumentId(5),
      cvDocumentId(11),
    ]);
  });

  it('does nothing when there is nothing to index', async () => {
    repository.listOpenJobs.mockResolvedValue([]);
    repository.listFreelancers.mockResolvedValue([]);

    await expect(service.rebuild()).resolves.toEqual({ indexed: 0 });
    expect(ai.indexDocuments).not.toHaveBeenCalled();
  });
});
