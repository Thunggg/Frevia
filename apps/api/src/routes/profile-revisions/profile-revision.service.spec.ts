import { ProfileRevisionType, RevisionStatus } from '@prisma/client';
import { ProfileRevisionService } from './profile-revision.service';
import { ProfileRevisionRepository } from './profile-revision.repo';

describe('ProfileRevisionService', () => {
  const repository = {
    findProfileForSnapshot: jest.fn(),
    submit: jest.fn(),
    findLatestForUser: jest.fn(),
    syncLowStrengthProfiles: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    review: jest.fn(),
  };

  const service = new ProfileRevisionService(
    repository as unknown as ProfileRevisionRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('stores freelancer changes as pending without changing the profile', async () => {
    repository.findProfileForSnapshot.mockResolvedValue({
      id: 4,
      userId: 9,
      displayName: 'Published name',
      bio: 'Published bio',
      availabilityStatus: 'AVAILABLE',
      freelancerProfile: {
        title: 'Published title',
        education: [],
        certifications: [],
        languages: ['English'],
      },
      clientProfile: null,
    });
    repository.submit.mockResolvedValue({ id: 12, status: 'PENDING' });

    const result = await service.submitFreelancer(
      9,
      4,
      {
        displayName: 'New name',
        title: 'New title',
        bio: 'New bio',
        availabilityStatus: 'BUSY',
        education: ['University'],
        certifications: [],
        languages: ['English'],
      },
      14,
    );

    expect(repository.submit).toHaveBeenCalledWith(
      9,
      4,
      ProfileRevisionType.FREELANCER,
      expect.objectContaining({
        displayName: 'Published name',
        title: 'Published title',
      }),
      expect.objectContaining({ displayName: 'New name', title: 'New title' }),
      14,
    );
    expect(result.reviewRequired).toBe(true);
    expect(result.profileStrength).toBe(14);
    expect(result.revision).toEqual({ id: 12, status: 'PENDING' });
  });

  it('requires manual review only below 20 percent profile strength', () => {
    expect(service.requiresManualReview(19)).toBe(true);
    expect(service.requiresManualReview(20)).toBe(false);
    expect(service.requiresManualReview(100)).toBe(false);
  });

  it('always stores expert profile changes as a pending revision', async () => {
    repository.findProfileForSnapshot.mockResolvedValue({
      id: 8,
      userId: 15,
      displayName: 'Published expert',
      bio: 'Published bio',
      freelancerProfile: null,
      clientProfile: null,
      expertProfile: {
        title: 'Advisor',
        expertise: ['Strategy'],
        yearsOfExperience: 8,
        education: [],
        certifications: [],
        website: null,
      },
    });
    repository.submit.mockResolvedValue({ id: 22, status: 'PENDING' });

    const result = await service.submitExpert(
      15,
      8,
      {
        displayName: 'Updated expert',
        title: 'Principal Advisor',
        bio: 'Updated bio',
        expertise: ['Strategy', 'Operations'],
        yearsOfExperience: 10,
        education: [],
        certifications: [],
        website: null,
      },
      75,
    );

    expect(repository.submit).toHaveBeenCalledWith(
      15,
      8,
      ProfileRevisionType.EXPERT,
      expect.objectContaining({ title: 'Advisor' }),
      expect.objectContaining({ title: 'Principal Advisor' }),
      75,
    );
    expect(result.reviewRequired).toBe(true);
  });

  it('applies a pending client revision when an admin approves it', async () => {
    const revision = {
      id: 5,
      status: RevisionStatus.PENDING,
      profileType: ProfileRevisionType.CLIENT,
      proposedData: {
        displayName: 'Client owner',
        bio: 'Client bio',
        companyName: 'Reviewed company',
        companyDescription: 'Description',
        website: 'https://example.com',
      },
    };
    repository.findById.mockResolvedValue(revision);
    repository.review.mockResolvedValue({
      ...revision,
      status: RevisionStatus.APPROVED,
    });

    const result = await service.approve(5, 1, 'Looks valid');

    expect(repository.review).toHaveBeenCalledWith(
      5,
      1,
      RevisionStatus.APPROVED,
      'Looks valid',
      revision.proposedData,
      ProfileRevisionType.CLIENT,
    );
    expect(result.status).toBe(RevisionStatus.APPROVED);
  });
});
