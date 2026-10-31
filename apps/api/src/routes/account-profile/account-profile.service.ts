import { Injectable } from '@nestjs/common';
import {
  AddSocialLinkType,
  DocumentTypeType,
  RoleName,
  UpdateClientProfileType,
  ChangePasswordType,
  UpdateGeneralProfileType,
} from '@shared/types';
import { Prisma, VerificationStatus } from '@prisma/client';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import {
  IdentityAiService,
  type IdentityAiVerifyResult,
} from '../../shared/services/identity-ai.service';
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
  IdentityAiFrontRequiredException,
  IdentityAiSelfieRequiredException,
  IdentityAiLivenessRequiredException,
  IdentityAiImageInvalidException,
  IdentityAiFramesInvalidException,
  IdentityAlreadyVerifiedException,
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
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';

@Injectable()
export class AccountProfileService {
  constructor(
    private readonly repository: AccountProfileRepository,
    private readonly profileRevisionService: ProfileRevisionService,
    private readonly cloudinary: CloudinaryService,
    private readonly hashing: HashingService,
    private readonly identityAi: IdentityAiService,
  ) {}

  private presentAvatarUrl(
    userId: number,
    avatarUrl: string | null,
    updatedAt?: Date,
  ) {
    if (!avatarUrl?.startsWith('local://')) return avatarUrl;
    const version = updatedAt ? `?v=${updatedAt.getTime()}` : '';
    return `/api/backend/account-profile/avatar/${userId}/file${version}`;
  }

  private detectAvatarType(buffer: Buffer) {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { mimeType: 'image/jpeg', extension: '.jpg' };
    }
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return { mimeType: 'image/png', extension: '.png' };
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { mimeType: 'image/webp', extension: '.webp' };
    }
    return null;
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
      avatarUrl: this.presentAvatarUrl(
        user.id,
        user.profile.avatarUrl,
        user.profile.updatedAt,
      ),
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
    const primaryRole = user.userRoles.find((item) => item.isPrimary)?.role
      .name;
    if (
      primaryRole === RoleName.CLIENT ||
      primaryRole === RoleName.FREELANCER
    ) {
      if (
        this.profileRevisionService.requiresManualReview(
          user.profile.profileCompletionPercent,
        )
      ) {
        return this.profileRevisionService.submitGeneral(
          userId,
          user.profile.id,
          primaryRole,
          input,
          user.profile.profileCompletionPercent,
        );
      }
      const updated = await this.repository.updateGeneralProfile(
        userId,
        input,
        primaryRole,
      );
      return this.profileRevisionService.directUpdateResult(
        updated.profileCompletionPercent,
      );
    }
    await this.repository.updateGeneralProfile(userId, input);
    const updated = await this.repository.findGeneralProfile(userId);
    if (!updated?.profile) throw ProfileNotFoundException();
    return this.profileRevisionService.directUpdateResult(
      updated.profile.profileCompletionPercent,
    );
  }

  async changePassword(userId: number, input: ChangePasswordType) {
    const user = await this.repository.findPasswordCredential(userId);
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
    const detectedType = this.detectAvatarType(file.buffer);
    if (
      !detectedType ||
      detectedType.mimeType !== file.mimetype ||
      file.size > 5 * 1024 * 1024
    ) {
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
      const relativePath = join(
        'avatars',
        String(userId),
        `${randomUUID()}${detectedType.extension}`,
      );
      const absolutePath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, file.buffer);
      avatarUrl = `local://${relativePath.replace(/\\/g, '/')}`;
    }
    const updated = await this.repository.updateAvatar(userId, avatarUrl);
    return {
      avatarUrl: this.presentAvatarUrl(
        userId,
        avatarUrl,
        updated.updatedAt,
      ) as string,
    };
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
      contentType:
        extname(relativePath).toLowerCase() === '.jpg'
          ? 'image/jpeg'
          : extname(relativePath).toLowerCase() === '.png'
            ? 'image/png'
            : 'image/webp',
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

  /**
   * Chuẩn hóa số CCCD trước khi lưu/check trùng: bỏ ký tự phân tách
   * (space, dấu chấm, gạch...) để "0012 345 678 90" và "001234567890"
   * không thành 2 giá trị khác nhau. Giữ nguyên chữ/số (CCCD 12 số,
   * hộ chiếu có chữ) — chỉ loại ký tự ngoài [A-Za-z0-9].
   */
  private normalizeIdentityNumber(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const stripped = value.replace(/[^A-Za-z0-9]/g, '');
    return stripped ? stripped.slice(0, 50) : null;
  }

  /**
   * Đọc `aiSummary.qr_consistency` (lưu từ AI) → dạng an toàn cho API:
   * chỉ status/score + TÊN field (matched/mismatched), không kèm giá trị PII.
   */
  private presentQrConsistency(summary: unknown) {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
      return null;
    }
    const raw = (summary as Record<string, unknown>).qr_consistency;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const qr = raw as Record<string, unknown>;
    if (typeof qr.status !== 'string' || !qr.status) return null;
    const toStrings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
    return {
      status: qr.status,
      score: typeof qr.score === 'number' ? qr.score : null,
      matchedFields: toStrings(qr.matched_fields),
      mismatchedFields: toStrings(qr.mismatched_fields),
      notCheckedFields: toStrings(qr.not_checked_fields),
    };
  }

  private presentIdentityDocument<
    T extends {
      id: number;
      fileUrl: string;
      backFileUrl?: string | null;
      aiSummary?: unknown;
    },
  >(document: T) {
    const localUrl = (value: string, side?: 'back') =>
      value.startsWith('local://')
        ? `/api/backend/identity-verifications/documents/${document.id}/file${side ? '?side=back' : ''}`
        : value;
    return {
      ...document,
      fileUrl: localUrl(document.fileUrl),
      backFileUrl:
        typeof document.backFileUrl === 'string'
          ? localUrl(document.backFileUrl, 'back')
          : (document.backFileUrl ?? null),
      qrConsistency: this.presentQrConsistency(document.aiSummary),
    };
  }

  private async persistIdentityFile(
    userId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        `frevia/identity-verifications/${userId}`,
      );
      return uploaded.secure_url;
    }
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
    return `local://${relativePath.replace(/\\/g, '/')}`;
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
    const fileUrl = await this.persistIdentityFile(userId, file);
    const document = await this.repository.createIdentityDocument(
      userId,
      documentType,
      fileUrl,
    );
    return this.presentIdentityDocument(document);
  }

  private assertAiImage(file: Express.Multer.File, path: string) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype) || file.size > 10 * 1024 * 1024) {
      throw IdentityAiImageInvalidException(path);
    }
  }

  /**
   * Nhận CCCD (trước/sau) + selfie + frames liveness, gọi AI service
   * (IDVerification pipeline: OCR → QR → tamper → face match → liveness).
   *
   * Quy tắc chặn (theo plan.md của IDVerification):
   *   - Lỗi AI (503/504/không trả lời) KHÔNG BAO GIỜ tạo document → client
   *     có thể thử lại.
   *   - AI REJECTED → document tạo ngay với status REJECTED + rejection
   *     reason trong reviewNotes.
   *   - AI VERIFIED → document với status PENDING (chờ admin duyệt).
   *   - Trùng số CCCD đã được tài khoản khác duyệt → ép REJECTED.
   */
  async submitIdentityAiCheck(
    userId: number,
    documentType: DocumentTypeType,
    files: {
      front?: Express.Multer.File;
      back?: Express.Multer.File;
      selfie?: Express.Multer.File;
      liveness: Express.Multer.File[];
    },
  ) {
    await this.requireRole(userId, RoleName.FREELANCER);
    const { front, back, selfie, liveness } = files;
    if (!front) throw IdentityAiFrontRequiredException();
    if (!selfie) throw IdentityAiSelfieRequiredException();
    if (!liveness.length || liveness.length > 40) {
      throw IdentityAiLivenessRequiredException();
    }
    this.assertAiImage(front, 'front');
    if (back) this.assertAiImage(back, 'back');
    this.assertAiImage(selfie, 'selfie');
    for (const frame of liveness) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(frame.mimetype) ||
        frame.size > 2 * 1024 * 1024
      ) {
        throw IdentityAiFramesInvalidException();
      }
    }

    const existing = await this.repository.findIdentityDocuments(userId);
    if (existing[0]?.status === VerificationStatus.APPROVED) {
      throw IdentityAlreadyVerifiedException();
    }

    const ai: IdentityAiVerifyResult = await this.identityAi.verify({
      front,
      back,
      selfie,
      liveness,
    });

    const aiStatus =
      typeof ai.status === 'string' && ai.status.trim()
        ? ai.status.trim()
        : null;
    const aiVerified = aiStatus === 'VERIFIED';

    const rawIdentityNumber =
      ai.ocr?.front?.document_number ?? ai.qr?.fields?.document_number ?? null;
    const identityNumber = this.normalizeIdentityNumber(rawIdentityNumber);

    let status = aiVerified
      ? VerificationStatus.PENDING
      : VerificationStatus.REJECTED;
    let reviewNotes = aiVerified
      ? null
      : typeof ai.rejection_reason === 'string' && ai.rejection_reason.trim()
        ? ai.rejection_reason.trim()
        : 'AI verification failed.';
    let duplicateOfId: number | null = null;

    if (identityNumber) {
      const duplicate =
        await this.repository.findApprovedIdentityDocumentByIdentityNumber(
          userId,
          identityNumber,
        );
      if (duplicate) {
        status = VerificationStatus.REJECTED;
        duplicateOfId = duplicate.id;
        reviewNotes = `This ID card (${identityNumber}) is already verified by another account.`;
      }
    }

    const fileUrl = await this.persistIdentityFile(userId, front);
    const backFileUrl = back
      ? await this.persistIdentityFile(userId, back)
      : null;
    const selfieUrl = await this.persistIdentityFile(userId, selfie);

    const document = await this.repository.createIdentityAiDocument({
      userId,
      documentType,
      fileUrl,
      backFileUrl,
      status,
      reviewNotes,
      duplicateOfId,
      aiStatus: (aiStatus ?? 'UNKNOWN').slice(0, 20),
      aiScore:
        typeof ai.face_match?.match_score === 'number'
          ? ai.face_match.match_score
          : null,
      aiError: null,
      aiSummary: {
        status: aiStatus,
        rejection_reason: reviewNotes,
        // QR đầy đủ từ AI: { front, back (raw extract), fields (document_number,
        // full_name, dob, ...), enabled } — object runtime đầy đủ, type chỉ khai
        // báo phần dùng nên JSON lưu trọn vẹn payload.
        qr: ai.qr ?? null,
        qr_consistency: ai.qr_consistency ?? null,
        tamper: ai.tamper ?? null,
        document_quality: ai.document_quality ?? null,
        ocr_document_number: identityNumber,
      } as Prisma.InputJsonValue,
      aiSelfieSummary: {
        fileUrl: selfieUrl,
        face_match: ai.face_match ?? null,
        passive_liveness: ai.passive_liveness ?? null,
        active_liveness: ai.active_liveness ?? null,
        selfie_face_count: ai.selfie_face_count ?? null,
        multiple_faces: ai.multiple_faces ?? null,
      } as Prisma.InputJsonValue,
      aiScannedAt: new Date(),
    });
    return this.presentIdentityDocument(document);
  }

  /** Proxy 1 khung webcam → AI /liveness/pose (poll trong lúc làm thử thách). */
  async livenessPose(userId: number, file?: Express.Multer.File) {
    await this.requireRole(userId, RoleName.FREELANCER);
    if (!file) throw IdentityAiFramesInvalidException();
    this.assertAiImage(file, 'file');
    return this.identityAi.livenessPose(file);
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

  async getIdentityDocumentFile(
    userId: number,
    id: number,
    side: 'front' | 'back' = 'front',
  ) {
    await this.requireRole(userId, RoleName.FREELANCER);
    const document = await this.repository.findIdentityDocumentById(id);
    if (!document || document.userId !== userId) {
      throw IdentityDocumentNotFoundException();
    }
    const source = side === 'back' ? document.backFileUrl : document.fileUrl;
    if (!source || !source.startsWith('local://')) {
      throw IdentityDocumentNotFoundException();
    }
    const relativePath = source.slice('local://'.length);
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
    const user = await this.requireRole(userId, RoleName.CLIENT);
    const profileStrength = user.profile!.profileCompletionPercent;
    if (this.profileRevisionService.requiresManualReview(profileStrength)) {
      return this.profileRevisionService.submitClient(
        userId,
        user.profile!.id,
        input,
        profileStrength,
      );
    }
    const updated = await this.repository.updateClientProfile(userId, input);
    return this.profileRevisionService.directUpdateResult(
      updated.profileCompletionPercent,
    );
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

  async discoverFreelancers(clientId: number) {
    await this.requireRole(clientId, RoleName.CLIENT);
    const freelancers =
      await this.repository.findDiscoverableFreelancers(clientId);
    return freelancers
      .filter((freelancer) => freelancer.profile?.freelancerProfile)
      .map((freelancer) => ({
        freelancerId: freelancer.id,
        isFollowing: freelancer.followsAsFreelancer.length > 0,
        profile: freelancer.profile,
      }));
  }

  async followFreelancer(clientId: number, freelancerId: number) {
    const client = await this.requireRole(clientId, RoleName.CLIENT);
    if (clientId === freelancerId) throw FreelancerNotFoundException();
    await this.requireRole(freelancerId, RoleName.FREELANCER);
    if (await this.repository.findFollow(clientId, freelancerId)) {
      throw FollowDuplicateException();
    }
    const followerName = client.profile?.displayName?.trim() || 'A client';
    await this.repository.createFollowWithNotification(
      clientId,
      freelancerId,
      followerName,
    );
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
