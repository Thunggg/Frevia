import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleName, SocialPlatform } from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { AccountProfileRepository } from './account-profile.repo';
import { AccountProfileService } from './account-profile.service';

const userWithRole = (roleName: string, userId = 1) => ({
  id: userId,
  profile: { id: 10, userId },
  userRoles: [{ role: { name: roleName } }],
});

describe('AccountProfileService', () => {
  const repository = {
    findUserWithRoles: jest.fn(),
    findIdentityDocuments: jest.fn(),
    findSocialLinks: jest.fn(),
    findSocialLinkByPlatform: jest.fn(),
    createSocialLink: jest.fn(),
    findSocialLinkById: jest.fn(),
    deleteSocialLink: jest.fn(),
    findFavorites: jest.fn(),
  };
  const cloudinary = { uploadFile: jest.fn() };
  const service = new AccountProfileService(
    repository as unknown as AccountProfileRepository,
    cloudinary as unknown as CloudinaryService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns a not-submitted status when the freelancer has no documents', async () => {
    repository.findUserWithRoles.mockResolvedValue(
      userWithRole(RoleName.FREELANCER),
    );
    repository.findIdentityDocuments.mockResolvedValue([]);

    await expect(service.getIdentityStatus(1)).resolves.toEqual({
      status: null,
      documents: [],
    });
  });

  it('rejects identity verification for a client account', async () => {
    repository.findUserWithRoles.mockResolvedValue(
      userWithRole(RoleName.CLIENT),
    );

    await expect(service.getIdentityStatus(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a duplicate social platform', async () => {
    repository.findSocialLinks.mockResolvedValue([]);
    repository.findSocialLinkByPlatform.mockResolvedValue({ id: 4 });

    await expect(
      service.addSocialLink(1, {
        platform: SocialPlatform.GITHUB,
        url: 'https://github.com/frevia-demo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createSocialLink).not.toHaveBeenCalled();
  });

  it('rejects deleting another user social link', async () => {
    repository.findSocialLinkById.mockResolvedValue({
      id: 4,
      profile: { userId: 2 },
    });

    await expect(service.deleteSocialLink(1, 4)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.deleteSocialLink).not.toHaveBeenCalled();
  });
});
