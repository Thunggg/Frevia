import { Injectable } from '@nestjs/common';
import { Prisma, ProfileRevisionType, RevisionStatus } from '@prisma/client';
import {
  ProfileRevisionAdminFilterType,
  RoleName,
  UpdateClientProfileSchema,
  UpdateClientProfileType,
  UpdateFreelancerProfileSchema,
  UpdateFreelancerProfileType,
  UpdateGeneralProfileType,
  UpdateExpertProfileSchema,
  UpdateExpertProfileType,
} from '@shared/types';
import { z } from 'zod';
import {
  ProfileRevisionAlreadyReviewedException,
  ProfileRevisionNotFoundException,
} from './profile-revision.error';
import { ProfileRevisionRepository } from './profile-revision.repo';

@Injectable()
export class ProfileRevisionService {
  static readonly MANUAL_REVIEW_STRENGTH_THRESHOLD = 20;

  constructor(private readonly repository: ProfileRevisionRepository) {}

  requiresManualReview(profileStrength: number) {
    return (
      profileStrength < ProfileRevisionService.MANUAL_REVIEW_STRENGTH_THRESHOLD
    );
  }

  directUpdateResult(profileStrength: number) {
    return {
      message: 'Profile updated successfully.',
      reviewRequired: false,
      profileStrength,
      revision: null,
    };
  }

  async submitFreelancer(
    userId: number,
    profileId: number,
    proposedData: UpdateFreelancerProfileType,
    profileStrength: number,
  ) {
    return this.submit(
      userId,
      profileId,
      ProfileRevisionType.FREELANCER,
      proposedData,
      profileStrength,
    );
  }

  async submitClient(
    userId: number,
    profileId: number,
    proposedData: UpdateClientProfileType,
    profileStrength: number,
  ) {
    return this.submit(
      userId,
      profileId,
      ProfileRevisionType.CLIENT,
      proposedData,
      profileStrength,
    );
  }

  async submitExpert(
    userId: number,
    profileId: number,
    proposedData: UpdateExpertProfileType,
    profileStrength: number,
  ) {
    return this.submit(
      userId,
      profileId,
      ProfileRevisionType.EXPERT,
      proposedData,
      profileStrength,
    );
  }

  async submitGeneral(
    userId: number,
    profileId: number,
    primaryRole: string,
    proposedData: UpdateGeneralProfileType,
    profileStrength: number,
  ) {
    const profileType =
      primaryRole === RoleName.CLIENT
        ? ProfileRevisionType.CLIENT
        : ProfileRevisionType.FREELANCER;
    return this.submit(
      userId,
      profileId,
      profileType,
      proposedData,
      profileStrength,
    );
  }

  private async submit(
    userId: number,
    profileId: number,
    profileType: ProfileRevisionType,
    proposedData:
      | UpdateFreelancerProfileType
      | UpdateClientProfileType
      | UpdateExpertProfileType
      | UpdateGeneralProfileType,
    profileStrength: number,
  ) {
    const profile = await this.repository.findProfileForSnapshot(
      userId,
      profileId,
    );
    if (!profile) throw ProfileRevisionNotFoundException();

    const currentData =
      profileType === ProfileRevisionType.FREELANCER
        ? {
            displayName: profile.displayName,
            title: profile.freelancerProfile?.title ?? null,
            bio: profile.bio,
            availabilityStatus: profile.availabilityStatus,
            education: profile.freelancerProfile?.education ?? [],
            certifications: profile.freelancerProfile?.certifications ?? [],
            languages: profile.freelancerProfile?.languages ?? [],
          }
        : profileType === ProfileRevisionType.CLIENT
          ? {
              displayName: profile.displayName,
              bio: profile.bio,
              companyName: profile.clientProfile?.companyName ?? null,
              companyDescription:
                profile.clientProfile?.companyDescription ?? null,
              website: profile.clientProfile?.website ?? null,
            }
          : {
              displayName: profile.displayName,
              title: profile.expertProfile?.title ?? null,
              bio: profile.bio,
              expertise: profile.expertProfile?.expertise ?? [],
              yearsOfExperience:
                profile.expertProfile?.yearsOfExperience ?? null,
              education: profile.expertProfile?.education ?? [],
              certifications: profile.expertProfile?.certifications ?? [],
              website: profile.expertProfile?.website ?? null,
            };

    const revision = await this.repository.submit(
      userId,
      profileId,
      profileType,
      currentData as Prisma.InputJsonValue,
      { ...currentData, ...proposedData } as Prisma.InputJsonValue,
      profileStrength,
    );
    return {
      message: 'Your changes were submitted for administrator review.',
      reviewRequired: true,
      profileStrength,
      revision,
    };
  }

  async latestForUser(userId: number, profileType: ProfileRevisionType) {
    return {
      revision: await this.repository.findLatestForUser(userId, profileType),
    };
  }

  async list(filter: ProfileRevisionAdminFilterType) {
    await this.repository.syncLowStrengthProfiles(
      ProfileRevisionService.MANUAL_REVIEW_STRENGTH_THRESHOLD,
    );
    const result = await this.repository.findMany({
      page: filter.page,
      limit: filter.limit,
      status: filter.status as RevisionStatus | undefined,
      profileType: filter.profileType as ProfileRevisionType | undefined,
      search: filter.search || undefined,
    });
    return {
      revisions: result.revisions,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filter.limit),
      },
    };
  }

  async detail(id: number) {
    const revision = await this.repository.findById(id);
    if (!revision) throw ProfileRevisionNotFoundException();
    return revision;
  }

  async approve(id: number, adminId: number, reviewNotes?: string | null) {
    return this.review(
      id,
      adminId,
      RevisionStatus.APPROVED,
      reviewNotes?.trim() || null,
    );
  }

  async reject(id: number, adminId: number, reviewNotes: string) {
    return this.review(
      id,
      adminId,
      RevisionStatus.REJECTED,
      reviewNotes.trim(),
    );
  }

  private async review(
    id: number,
    adminId: number,
    status: typeof RevisionStatus.APPROVED | typeof RevisionStatus.REJECTED,
    reviewNotes: string | null,
  ) {
    const revision = await this.repository.findById(id);
    if (!revision) throw ProfileRevisionNotFoundException();
    if (revision.status !== RevisionStatus.PENDING) {
      throw ProfileRevisionAlreadyReviewedException();
    }

    const proposedData =
      revision.profileType === ProfileRevisionType.FREELANCER
        ? UpdateFreelancerProfileSchema.extend({
            displayName: z.string().trim().min(1).max(255).nullable(),
            title: z.string().trim().max(255).nullable(),
          }).parse(revision.proposedData)
        : revision.profileType === ProfileRevisionType.CLIENT
          ? UpdateClientProfileSchema.extend({
              displayName: z.string().trim().min(1).max(255).nullable(),
              bio: z.string().trim().max(5000).nullable().optional(),
              companyName: z.string().trim().min(1).max(255).nullable(),
            }).parse(revision.proposedData)
          : UpdateExpertProfileSchema.extend({
              displayName: z.string().trim().min(1).max(255).nullable(),
              title: z.string().trim().max(255).nullable(),
            }).parse(revision.proposedData);

    const reviewed = await this.repository.review(
      id,
      adminId,
      status,
      reviewNotes,
      proposedData,
      revision.profileType,
    );
    if (!reviewed) throw ProfileRevisionAlreadyReviewedException();
    return reviewed;
  }
}
