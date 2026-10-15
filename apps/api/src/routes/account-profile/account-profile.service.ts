import { Injectable } from '@nestjs/common';
import {
  AddSocialLinkType,
  DocumentTypeType,
  RoleName,
  UpdateClientProfileType,
  ChangePasswordType,
  UpdateGeneralProfileType,
} from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'path';
import { HashingService } from '../../shared/services/hashing.service';
import {
  AccountProfileForbiddenException,
  ClientProfileNotFoundException,
  FavoriteDuplicateException,
  FavoriteNotFoundException,
  FollowDuplicateException,
  FollowNotFoundException,
  FreelancerNotFoundException,
  IdentityFileInvalidException,
  IdentityFileRequiredException,
  IdentityDocumentNotFoundException,
  ProfileNotFoundException,
  SocialLinkDuplicateException,
  SocialLinkNotFoundException,
  AvatarFileInvalidException,
  AvatarFileRequiredException,
  AvatarNotFoundException,
  CurrentPasswordIncorrectException,
  PasswordUnavailableException,
} from './account-profile.error';
import { AccountProfileRepository } from './account-profile.repo';

@Injectable()
export class AccountProfileService {
  constructor(
    private readonly repository: AccountProfileRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly hashing: HashingService,
  ) {}

  private presentAvatarUrl(userId: number, avatarUrl: string | null) {
    if (!avatarUrl?.startsWith('local://')) return avatarUrl;
    return `/api/backend/account-profile/avatar/${userId}/file`;
  }

  private presentGeneralProfile(
    user: NonNullable<
      Awaited<ReturnType<AccountProfileRepository['findGeneralProfile']>>
    >,
  ) {
    if (!user.profile) throw ProfileNotFoundException();
    return {
      ...user.profile,
      email: user.email,
      avatarUrl: this.presentAvatarUrl(user.id, user.profile.avatarUrl),
      roles: user.userRoles.map((item) => ({
        name: item.role.name,
        isPrimary: item.isPrimary,
      })),
    };
  }

  async getGeneralProfile(userId: number) {
    const user = await this.repository.findGeneralProfile(userId);
    if (!user?.profile) throw ProfileNotFoundException();
    return this.presentGeneralProfile(user);
  }

  async updateGeneralProfile(userId: number, input: UpdateGeneralProfileType) {
    const user = await this.repository.findGeneralProfile(userId);
    if (!user?.profile) throw ProfileNotFoundException();
    await this.repository.updateGeneralProfile(userId, input);
    const updated = await this.repository.findGeneralProfile(userId);
    if (!updated?.profile) throw ProfileNotFoundException();
    return this.presentGeneralProfile(updated);
  }

  async changePassword(userId: number, input: ChangePasswordType) {
    const user = await this.repository.findGeneralProfile(userId);
    if (!user?.profile) throw ProfileNotFoundException();
    if (!user.password) throw PasswordUnavailableException();
    if (!(await this.hashing.verify(input.currentPassword, user.password))) {
      throw CurrentPasswordIncorrectException();
    }
    await this.repository.updatePassword(
      userId,
      await this.hashing.hash(input.newPassword),
    );
    return { message: 'Password changed successfully.' };
  }

  async uploadAvatar(userId: number, file?: Express.Multer.File) {
    const user = await this.repository.findGeneralProfile(userId);
    if (!user?.profile) throw ProfileNotFoundException();
    if (!file) throw AvatarFileRequiredException();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype) || file.size > 5 * 1024 * 1024) {
      throw AvatarFileInvalidException();
    }

    let avatarUrl: string;
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        `frevia/avatars/${userId}`,
      );
      avatarUrl = uploaded.secure_url;
    } else {
      const extension = extname(file.originalname).toLowerCase() || '.png';
      const relativePath = join(
        'avatars',
        String(userId),
        `${randomUUID()}${extension}`,
      );
      const absolutePath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, file.buffer);
      avatarUrl = `local://${relativePath.replace(/\\/g, '/')}`;
    }
    await this.repository.updateAvatar(userId, avatarUrl);
    return { avatarUrl: this.presentAvatarUrl(userId, avatarUrl) as string };
  }

  async getAvatarFile(userId: number) {
    const user = await this.repository.findGeneralProfile(userId);
    const avatarUrl = user?.profile?.avatarUrl;
    if (!avatarUrl?.startsWith('local://')) throw AvatarNotFoundException();
    const relativePath = avatarUrl.slice('local://'.length);
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const absolutePath = resolve(uploadsRoot, relativePath);
    const pathFromUploadsRoot = relative(uploadsRoot, absolutePath);
    if (
      pathFromUploadsRoot.startsWith('..') ||
      isAbsolute(pathFromUploadsRoot)
    ) {
      throw AvatarNotFoundException();
    }
    return {
      absolutePath,
      fileName: relativePath.split('/').at(-1) ?? 'avatar',
    };
  }

  private async requireRole(userId: number, roleName: string) {
    const user = await this.repository.findUserWithRoles(userId);
    if (!user?.profile) throw ProfileNotFoundException();
    if (!user.userRoles.some((item) => item.role.name === roleName)) {
      throw AccountProfileForbiddenException();
    }
    return user;
  }

  private presentIdentityDocument<T extends { id: number; fileUrl: string }>(
    document: T,
  ) {
    return document.fileUrl.startsWith('local://')
      ? {
          ...document,
          fileUrl: `/api/backend/identity-verifications/documents/${document.id}/file`,
        }
      : document;
  }

  async uploadIdentityDocument(
    userId: number,
    documentType: DocumentTypeType,
    file?: Express.Multer.File,
  ) {
    await this.requireRole(userId, RoleName.FREELANCER);
    if (!file) throw IdentityFileRequiredException();
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype) || file.size > 10 * 1024 * 1024) {
      throw IdentityFileInvalidException();
    }
    let fileUrl: string;
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        `frevia/identity-verifications/${userId}`,
      );
      fileUrl = uploaded.secure_url;
    } else {
      const extension =
        extname(file.originalname).toLowerCase() ||
        (file.mimetype === 'application/pdf' ? '.pdf' : '.png');
      const relativePath = join(
        'identity-verifications',
        String(userId),
        `${randomUUID()}${extension}`,
      );
      const absolutePath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, file.buffer);
      fileUrl = `local://${relativePath.replace(/\\/g, '/')}`;
    }
    const document = await this.repository.createIdentityDocument(
      userId,
      documentType,
      fileUrl,
    );
    return this.presentIdentityDocument(document);
  }

  async getIdentityStatus(userId: number) {
    await this.requireRole(userId, RoleName.FREELANCER);
    const documents = await this.repository.findIdentityDocuments(userId);
    return {
      status: documents[0]?.status ?? null,
      documents: documents.map((document) =>
        this.presentIdentityDocument(document),
      ),
    };
  }

  async getIdentityDocumentFile(userId: number, id: number) {
    await this.requireRole(userId, RoleName.FREELANCER);
    const document = await this.repository.findIdentityDocumentById(id);
    if (!document || document.userId !== userId) {
      throw IdentityDocumentNotFoundException();
    }
    if (!document.fileUrl.startsWith('local://')) {
      throw IdentityDocumentNotFoundException();
    }
    const relativePath = document.fileUrl.slice('local://'.length);
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const absolutePath = resolve(uploadsRoot, relativePath);
    const pathFromUploadsRoot = relative(uploadsRoot, absolutePath);
    if (
      pathFromUploadsRoot.startsWith('..') ||
      isAbsolute(pathFromUploadsRoot)
    ) {
      throw IdentityDocumentNotFoundException();
    }
    return {
      absolutePath,
      fileName: relativePath.split('/').at(-1) ?? 'document',
    };
  }

  async getClientProfile(userId: number) {
    const profile = await this.repository.findClientProfile(userId);
    const isClient = profile?.user.userRoles.some(
      (item) => item.role.name === RoleName.CLIENT,
    );
    if (!profile?.clientProfile || !isClient)
      throw ClientProfileNotFoundException();
    return profile;
  }

  async updateClientProfile(userId: number, input: UpdateClientProfileType) {
    await this.requireRole(userId, RoleName.CLIENT);
    return this.repository.updateClientProfile(userId, input);
  }

  async getSocialLinks(userId: number) {
    const links = await this.repository.findSocialLinks(userId);
    if (!links) throw ProfileNotFoundException();
    return links;
  }

  async addSocialLink(userId: number, input: AddSocialLinkType) {
    const links = await this.repository.findSocialLinks(userId);
    if (!links) throw ProfileNotFoundException();
    const duplicate = await this.repository.findSocialLinkByPlatform(
      userId,
      input.platform,
    );
    if (duplicate) throw SocialLinkDuplicateException();
    return this.repository.createSocialLink(userId, input);
  }

  async deleteSocialLink(userId: number, id: number) {
    const link = await this.repository.findSocialLinkById(id);
    if (!link) throw SocialLinkNotFoundException();
    if (link.profile.userId !== userId)
      throw AccountProfileForbiddenException();
    await this.repository.deleteSocialLink(id);
    return { message: 'Social link deleted successfully.' };
  }

  async getFavorites(clientId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    const favorites = await this.repository.findFavorites(clientId);
    return favorites
      .filter((favorite) => favorite.freelancer.profile?.freelancerProfile)
      .map((favorite) => ({
        freelancerId: favorite.freelancerId,
        createdAt: favorite.createdAt,
        profile: favorite.freelancer.profile,
      }));
  }

  async addFavorite(clientId: number, freelancerId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    if (clientId === freelancerId) throw FreelancerNotFoundException();
    const freelancer = await this.repository.findUserWithRoles(freelancerId);
    const isFreelancer = freelancer?.userRoles.some(
      (item) => item.role.name === RoleName.FREELANCER,
    );
    if (!freelancer?.profile || !isFreelancer)
      throw FreelancerNotFoundException();
    if (await this.repository.findFavorite(clientId, freelancerId)) {
      throw FavoriteDuplicateException();
    }
    await this.repository.createFavorite(clientId, freelancerId);
    return { message: 'Freelancer added to favorites.' };
  }

  async removeFavorite(clientId: number, freelancerId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    if (!(await this.repository.findFavorite(clientId, freelancerId))) {
      throw FavoriteNotFoundException();
    }
    await this.repository.deleteFavorite(clientId, freelancerId);
    return { message: 'Freelancer removed from favorites.' };
  }

  async getFollowing(clientId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    const following = await this.repository.findFollowing(clientId);
    return following
      .filter((follow) => follow.freelancer.profile?.freelancerProfile)
      .map((follow) => ({
        freelancerId: follow.freelancerId,
        createdAt: follow.createdAt,
        profile: follow.freelancer.profile,
      }));
  }

  async followFreelancer(clientId: number, freelancerId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    if (clientId === freelancerId) throw FreelancerNotFoundException();
    await this.requireRole(freelancerId, RoleName.FREELANCER);
    if (await this.repository.findFollow(clientId, freelancerId)) {
      throw FollowDuplicateException();
    }
    await this.repository.createFollow(clientId, freelancerId);
    return { message: 'You are now following this freelancer.' };
  }

  async unfollowFreelancer(clientId: number, freelancerId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    if (!(await this.repository.findFollow(clientId, freelancerId))) {
      throw FollowNotFoundException();
    }
    await this.repository.deleteFollow(clientId, freelancerId);
    return { message: 'You unfollowed this freelancer.' };
  }
}
