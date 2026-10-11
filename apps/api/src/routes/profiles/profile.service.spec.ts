import { ForbiddenException } from '@nestjs/common';
import { RoleName } from '@shared/types';
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
    findFreelancerProfileById: jest.fn(),
    findSkillsByProfileId: jest.fn(),
    findSkillByNameAndProfileId: jest.fn(),
    addSkillToProfile: jest.fn(),
    findSkillById: jest.fn(),
    deleteSkill: jest.fn(),
  };
  const service = new ProfileService(
    repository as unknown as ProfileRepository,
  );

  beforeEach(() => jest.clearAllMocks());

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
});
