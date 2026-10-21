import { ConflictException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ExpertProfileService } from './expert-profile.service';

describe('ExpertProfileService', () => {
  const repository = {
    findByUserId: jest.fn(),
    hasPendingRevision: jest.fn(),
    updateDirect: jest.fn(),
  };
  const revisions = { submitExpert: jest.fn() };
  const service = new ExpertProfileService(
    repository as never,
    revisions as never,
  );
  const user = {
    id: 7,
    profile: { id: 17, expertProfile: null },
    userRoles: [{ role: { name: RoleName.EXPERT } }],
  };
  const input = {
    displayName: 'Ada Expert',
    title: 'Product advisor',
    bio: 'Independent product advisor.',
    expertise: [' Strategy ', '', 'strategy', 'Research'],
    yearsOfExperience: 8,
    education: ['University', ' University '],
    certifications: ['Certified Advisor'],
    website: 'https://example.com ',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findByUserId.mockResolvedValue(user);
    repository.hasPendingRevision.mockResolvedValue(null);
    revisions.submitExpert.mockResolvedValue({ revision: { id: 1 } });
  });

  it('rejects another submission while an expert revision is pending', async () => {
    repository.hasPendingRevision.mockResolvedValue({ id: 4 });

    await expect(service.submitUpdate(7, input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(revisions.submitExpert).not.toHaveBeenCalled();
  });

  it('sanitizes list values before creating a revision', async () => {
    await service.submitUpdate(7, input);

    expect(revisions.submitExpert).toHaveBeenCalledWith(
      7,
      17,
      expect.objectContaining({
        expertise: ['Strategy', 'Research'],
        education: ['University'],
        certifications: ['Certified Advisor'],
        website: 'https://example.com',
      }),
      100,
    );
  });

  it('lets admin updates supersede pending revisions transactionally', async () => {
    await service.updateByAdmin(7, 1, { ...input, isActive: false });

    expect(repository.updateDirect).toHaveBeenCalledWith(
      7,
      1,
      expect.objectContaining({
        expertise: ['Strategy', 'Research'],
        isActive: false,
      }),
      100,
    );
  });
});
