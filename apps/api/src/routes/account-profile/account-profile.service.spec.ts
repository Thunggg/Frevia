import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleName, SocialPlatform } from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { HashingService } from '../../shared/services/hashing.service';
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
    createIdentityDocument: jest.fn(),
    findIdentityDocuments: jest.fn(),
    findSocialLinks: jest.fn(),
    findSocialLinkByPlatform: jest.fn(),
    createSocialLink: jest.fn(),
    findSocialLinkById: jest.fn(),
    deleteSocialLink: jest.fn(),
    findFavorites: jest.fn(),
    findFollowing: jest.fn(),
    findDiscoverableFreelancers: jest.fn(),
    findFollow: jest.fn(),
    createFollowWithNotification: jest.fn(),
    deleteFollow: jest.fn(),
    findGeneralProfile: jest.fn(),
    updateGeneralProfile: jest.fn(),
    updatePassword: jest.fn(),
    updateAvatar: jest.fn(),
  };
  const cloudinary = {
    isConfigured: jest.fn(),
    uploadFile: jest.fn(),
  };
  const hashing = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const service = new AccountProfileService(
    repository as unknown as AccountProfileRepository,
    cloudinary as unknown as CloudinaryService,
    hashing as unknown as HashingService,
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

  it('uploads an identity document to Cloudinary when configured', async () => {
    repository.findUserWithRoles.mockResolvedValue(
      userWithRole(RoleName.FREELANCER),
    );
    cloudinary.isConfigured.mockReturnValue(true);
    cloudinary.uploadFile.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/document.png',
    });
    repository.createIdentityDocument.mockImplementation(
      (userId: number, documentType: string, fileUrl: string) => ({
        id: 12,
        userId,
        documentType,
        fileUrl,
      }),
    );

    const file = {
      originalname: 'document.png',
      mimetype: 'image/png',
      size: 4,
      buffer: Buffer.from('demo'),
    } as Express.Multer.File;

    await expect(
      service.uploadIdentityDocument(1, 'ID_CARD', file),
    ).resolves.toMatchObject({
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/document.png',
    });
    expect(cloudinary.uploadFile).toHaveBeenCalledWith(
      file,
      'frevia/identity-verifications/1',
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

  it('hard deletes an existing freelancer follow', async () => {
    repository.findUserWithRoles.mockResolvedValue(
      userWithRole(RoleName.CLIENT),
    );
    repository.findFollow.mockResolvedValue({
      clientId: 1,
      freelancerId: 2,
    });

    await service.unfollowFreelancer(1, 2);

    expect(repository.deleteFollow).toHaveBeenCalledWith(1, 2);
  });

  it('creates a notification for the freelancer when a client follows them', async () => {
    repository.findUserWithRoles
      .mockResolvedValueOnce({
        ...userWithRole(RoleName.CLIENT, 1),
        profile: { id: 10, userId: 1, displayName: 'Northstar Studio' },
      })
      .mockResolvedValueOnce(userWithRole(RoleName.FREELANCER, 2));
    repository.findFollow.mockResolvedValue(null);
    repository.createFollowWithNotification.mockResolvedValue({
      clientId: 1,
      freelancerId: 2,
    });

    await expect(service.followFreelancer(1, 2)).resolves.toEqual({
      message: 'You are now following this freelancer.',
    });
    expect(repository.createFollowWithNotification).toHaveBeenCalledWith(
      1,
      2,
      'Northstar Studio',
    );
  });

  it('returns discoverable freelancers with their following state', async () => {
    repository.findUserWithRoles.mockResolvedValue(
      userWithRole(RoleName.CLIENT),
    );
    repository.findDiscoverableFreelancers.mockResolvedValue([
      {
        id: 2,
        profile: {
          id: 20,
          freelancerProfile: { id: 30 },
        },
        followsAsFreelancer: [{ clientId: 1 }],
      },
      {
        id: 3,
        profile: {
          id: 21,
          freelancerProfile: { id: 31 },
        },
        followsAsFreelancer: [],
      },
    ]);

    await expect(service.discoverFreelancers(1)).resolves.toEqual([
      {
        freelancerId: 2,
        isFollowing: true,
        profile: { id: 20, freelancerProfile: { id: 30 } },
      },
      {
        freelancerId: 3,
        isFollowing: false,
        profile: { id: 21, freelancerProfile: { id: 31 } },
      },
    ]);
  });

  it('does not create another notification for a duplicate follow', async () => {
    repository.findUserWithRoles
      .mockResolvedValueOnce(userWithRole(RoleName.CLIENT, 1))
      .mockResolvedValueOnce(userWithRole(RoleName.FREELANCER, 2));
    repository.findFollow.mockResolvedValue({
      clientId: 1,
      freelancerId: 2,
    });

    await expect(service.followFreelancer(1, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.createFollowWithNotification).not.toHaveBeenCalled();
  });

  it('updates a password only after verifying the current password', async () => {
    const currentCredential = ['current', 'credential'].join('-');
    const replacementCredential = ['replacement', 'credential'].join('-');
    const storedHash = ['stored', 'hash'].join('-');
    const replacementHash = ['replacement', 'hash'].join('-');
    repository.findGeneralProfile.mockResolvedValue({
      ...userWithRole(RoleName.CLIENT),
      email: 'client@example.com',
      password: storedHash,
    });
    hashing.verify.mockResolvedValue(true);
    hashing.hash.mockResolvedValue(replacementHash);

    await service.changePassword(1, {
      currentPassword: currentCredential,
      newPassword: replacementCredential,
      confirmPassword: replacementCredential,
    });

    expect(hashing.verify).toHaveBeenCalledWith(currentCredential, storedHash);
    expect(repository.updatePassword).toHaveBeenCalledWith(1, replacementHash);
  });
});
