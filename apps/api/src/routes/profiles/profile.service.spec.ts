import { ForbiddenException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { AiCvAnalyzerService } from '../../shared/services/ai-cv-analyzer.service';
import { SkillResolverService } from '../../shared/services/skill-resolver.service';
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import { ProfileRepository } from './profile.repo';
import { ProfileService } from './profile.service';

const freelancerProfile = (userId = 10) => ({
  id: 5,
  userId,
  user: {
    userRoles: [{ role: { name: RoleName.FREELANCER } }],
  },
});

describe('ProfileService', () => {
  const repository = {
    updateFreelancerProfile: jest.fn(),
    findFreelancerProfileById: jest.fn(),
    findSkillsByProfileId: jest.fn(),
    searchActiveCatalogSkills: jest.fn(),
    findOrCreateCatalogSkill: jest.fn(),
    findSkillByProfileIdAndSkillId: jest.fn(),
    addSkillToProfile: jest.fn(),
    findSkillById: jest.fn(),
    deleteSkill: jest.fn(),
  };
  const revisions = {
    requiresManualReview: jest.fn().mockReturnValue(false),
    directUpdateResult: jest.fn(),
    submitFreelancer: jest.fn(),
  };
  const outbox = { enqueueAndProcess: jest.fn().mockResolvedValue(undefined) };
  const service = new ProfileService(
    repository as unknown as ProfileRepository,
    {} as CloudinaryService,
    {} as AiCvAnalyzerService,
    {} as SkillResolverService,
    revisions as unknown as ProfileRevisionService,
    outbox as unknown as EmbeddingOutboxService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('preserves professional fields omitted by the profile form', async () => {
    repository.findFreelancerProfileById.mockResolvedValue({
      ...freelancerProfile(),
      bio: 'Existing biography',
      profileCompletionPercent: 80,
      freelancerProfile: {
        education: ['University'],
        certifications: ['Certificate'],
        languages: ['Vietnamese'],
        experience: ['Developer'],
      },
    });
    repository.updateFreelancerProfile.mockResolvedValue({
      profileCompletionPercent: 80,
    });
    await service.updateProfile(5, 10, {
      displayName: 'Updated name',
      title: 'Engineer',
    });
    expect(repository.updateFreelancerProfile).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        bio: 'Existing biography',
        education: ['University'],
        certifications: ['Certificate'],
        languages: ['Vietnamese'],
        experience: ['Developer'],
      }),
    );
  });

  it('clears explicitly empty professional fields', async () => {
    repository.findFreelancerProfileById.mockResolvedValue({
      ...freelancerProfile(),
      profileCompletionPercent: 80,
      freelancerProfile: { experience: ['Developer'] },
    });
    await service.updateProfile(5, 10, {
      displayName: 'Name',
      title: 'Engineer',
      experience: [],
    });
    expect(repository.updateFreelancerProfile).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ experience: [] }),
    );
  });

  it('indexes the general profile ID after deleting a skill', async () => {
    repository.findSkillById.mockResolvedValue({
      freelancerProfile: { id: 99, profile: { id: 5, userId: 10 } },
    });
    repository.deleteSkill.mockResolvedValue({ id: 7 });
    await service.deleteSkill(7, 10);
    expect(outbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: 5,
    });
  });

  it('returns an empty skill list instead of a not-found error', async () => {
    repository.findFreelancerProfileById.mockResolvedValue(freelancerProfile());
    repository.findSkillsByProfileId.mockResolvedValue([]);

    await expect(service.getSkills(5)).resolves.toEqual([]);
  });

  it('rejects adding a skill to another user profile', async () => {
    repository.findFreelancerProfileById.mockResolvedValue(
      freelancerProfile(10),
    );

    await expect(
      service.addSkill(5, 99, {
        skillName: 'TypeScript',
        proficiencyLevel: 8,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.addSkillToProfile).not.toHaveBeenCalled();
  });

  it('rejects deleting a skill owned by another user', async () => {
    repository.findSkillById.mockResolvedValue({
      freelancerProfile: { profile: { userId: 10 } },
    });

    await expect(service.deleteSkill(7, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.deleteSkill).not.toHaveBeenCalled();
  });

  it('uses the canonical catalog skill when adding a profile skill', async () => {
    repository.findFreelancerProfileById.mockResolvedValue(freelancerProfile());
    repository.findOrCreateCatalogSkill.mockResolvedValue({
      id: 3,
      name: 'Next.js',
    });
    repository.findSkillByProfileIdAndSkillId.mockResolvedValue(null);
    repository.addSkillToProfile.mockResolvedValue({ id: 7 });

    await service.addSkill(5, 10, {
      skillName: 'next.js',
      proficiencyLevel: 8,
    });

    expect(repository.findOrCreateCatalogSkill).toHaveBeenCalledWith('next.js');
    expect(repository.findSkillByProfileIdAndSkillId).toHaveBeenCalledWith(
      5,
      3,
    );
    expect(repository.addSkillToProfile).toHaveBeenCalledWith(5, 3, 8);
  });
});
