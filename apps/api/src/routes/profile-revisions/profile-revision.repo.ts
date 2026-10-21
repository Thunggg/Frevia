import { Injectable } from '@nestjs/common';
import {
  AvailabilityStatus,
  NotificationType,
  Prisma,
  ProfileRevisionType,
  RevisionStatus,
} from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { RoleName } from '@shared/types';
import {
  calculateClientProfileStrength,
  calculateExpertProfileStrength,
  calculateFreelancerProfileStrength,
} from '../../shared/utils/profile-strength';

const revisionSelect = {
  id: true,
  userId: true,
  profileId: true,
  profileType: true,
  status: true,
  currentData: true,
  proposedData: true,
  profileStrength: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  admin: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
} as const;

type FreelancerProposal = {
  displayName: string | null;
  title: string | null;
  bio?: string | null;
  availabilityStatus?: AvailabilityStatus;
  education?: string[] | null;
  certifications?: string[] | null;
  languages?: string[] | null;
};

type ClientProposal = {
  displayName: string | null;
  bio?: string | null;
  companyName: string | null;
  companyDescription?: string | null;
  website?: string | null;
};

type ExpertProposal = {
  displayName: string | null;
  title: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  yearsOfExperience?: number | null;
  education?: string[] | null;
  certifications?: string[] | null;
  website?: string | null;
};

@Injectable()
export class ProfileRevisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfileForSnapshot(userId: number, profileId: number) {
    return this.prisma.profile.findFirst({
      where: { id: profileId, userId, user: { deletedAt: null } },
      include: {
        freelancerProfile: true,
        clientProfile: true,
        expertProfile: true,
      },
    });
  }

  async submit(
    userId: number,
    profileId: number,
    profileType: ProfileRevisionType,
    currentData: Prisma.InputJsonValue,
    proposedData: Prisma.InputJsonValue,
    profileStrength: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const pending = await transaction.profileRevision.findFirst({
        where: {
          userId,
          profileType,
          status: RevisionStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (pending) {
        return transaction.profileRevision.update({
          where: { id: pending.id },
          data: {
            profileId,
            currentData,
            proposedData,
            profileStrength,
            adminId: null,
            reviewNotes: null,
            reviewedAt: null,
          },
          select: revisionSelect,
        });
      }

      return transaction.profileRevision.create({
        data: {
          userId,
          profileId,
          profileType,
          currentData,
          proposedData,
          profileStrength,
        },
        select: revisionSelect,
      });
    });
  }

  findLatestForUser(userId: number, profileType: ProfileRevisionType) {
    return this.prisma.profileRevision.findFirst({
      where: { userId, profileType },
      orderBy: { createdAt: 'desc' },
      select: revisionSelect,
    });
  }

  async syncLowStrengthProfiles(threshold: number) {
    const candidates = await this.prisma.profile.findMany({
      where: {
        profileCompletionPercent: { lt: threshold },
        user: {
          deletedAt: null,
          isBanned: false,
          userRoles: {
            some: {
              isPrimary: true,
              role: {
                deletedAt: null,
                name: {
                  in: [RoleName.CLIENT, RoleName.FREELANCER, RoleName.EXPERT],
                },
              },
            },
          },
        },
      },
      include: {
        clientProfile: true,
        freelancerProfile: true,
        expertProfile: true,
        user: {
          select: {
            userRoles: {
              where: { isPrimary: true },
              select: { role: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
    });

    await this.prisma.$transaction(async (transaction) => {
      for (const profile of candidates) {
        const primaryRole = profile.user.userRoles[0]?.role.name;
        const profileType =
          primaryRole === RoleName.CLIENT
            ? ProfileRevisionType.CLIENT
            : primaryRole === RoleName.FREELANCER
              ? ProfileRevisionType.FREELANCER
              : primaryRole === RoleName.EXPERT
                ? ProfileRevisionType.EXPERT
                : null;
        if (!profileType) continue;

        const existing = await transaction.profileRevision.findFirst({
          where: { userId: profile.userId, profileType },
          select: { id: true },
        });
        if (existing) continue;

        const snapshot =
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

        await transaction.profileRevision.create({
          data: {
            userId: profile.userId,
            profileId: profile.id,
            profileType,
            profileStrength: profile.profileCompletionPercent,
            currentData: snapshot,
            proposedData: snapshot,
          },
        });
      }
    });
  }

  async findMany(params: {
    page: number;
    limit: number;
    status?: RevisionStatus;
    profileType?: ProfileRevisionType;
    search?: string;
  }) {
    const where: Prisma.ProfileRevisionWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.profileType ? { profileType: params.profileType } : {}),
      ...(params.search
        ? {
            OR: [
              {
                user: {
                  email: {
                    contains: params.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                user: {
                  profile: {
                    displayName: {
                      contains: params.search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const skip = (params.page - 1) * params.limit;
    const [revisions, total] = await this.prisma.$transaction([
      this.prisma.profileRevision.findMany({
        where,
        select: revisionSelect,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profileRevision.count({ where }),
    ]);
    return { revisions, total };
  }

  findById(id: number) {
    return this.prisma.profileRevision.findUnique({
      where: { id },
      select: revisionSelect,
    });
  }

  async review(
    id: number,
    adminId: number,
    status: typeof RevisionStatus.APPROVED | typeof RevisionStatus.REJECTED,
    reviewNotes: string | null,
    proposedData: FreelancerProposal | ClientProposal | ExpertProposal,
    profileType: ProfileRevisionType,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.profileRevision.updateMany({
        where: { id, status: RevisionStatus.PENDING },
        data: { status, adminId, reviewNotes, reviewedAt: new Date() },
      });
      if (claimed.count === 0) return null;

      const revision = await transaction.profileRevision.findUniqueOrThrow({
        where: { id },
        select: { profileId: true, userId: true },
      });

      if (status === RevisionStatus.APPROVED) {
        if (profileType === ProfileRevisionType.FREELANCER) {
          const data = proposedData as FreelancerProposal;
          await transaction.profile.update({
            where: { id: revision.profileId },
            data: {
              displayName: data.displayName,
              bio: data.bio ?? null,
              availabilityStatus: data.availabilityStatus,
            },
          });
          await transaction.freelancerProfile.upsert({
            where: { profileId: revision.profileId },
            update: {
              title: data.title,
              education: data.education ?? [],
              certifications: data.certifications ?? [],
              languages: data.languages ?? [],
            },
            create: {
              profileId: revision.profileId,
              title: data.title,
              education: data.education ?? [],
              certifications: data.certifications ?? [],
              languages: data.languages ?? [],
            },
          });
        } else if (profileType === ProfileRevisionType.CLIENT) {
          const data = proposedData as ClientProposal;
          await transaction.profile.update({
            where: { id: revision.profileId },
            data: {
              displayName: data.displayName,
              bio: data.bio ?? null,
            },
          });
          await transaction.clientProfile.upsert({
            where: { profileId: revision.profileId },
            update: {
              companyName: data.companyName,
              companyDescription: data.companyDescription ?? null,
              website: data.website ?? null,
            },
            create: {
              profileId: revision.profileId,
              companyName: data.companyName,
              companyDescription: data.companyDescription ?? null,
              website: data.website ?? null,
            },
          });
        } else {
          const data = proposedData as ExpertProposal;
          await transaction.profile.update({
            where: { id: revision.profileId },
            data: {
              displayName: data.displayName,
              bio: data.bio ?? null,
            },
          });
          await transaction.expert.upsert({
            where: { profileId: revision.profileId },
            update: {
              title: data.title,
              expertise: data.expertise ?? [],
              yearsOfExperience: data.yearsOfExperience ?? 0,
              education: data.education ?? [],
              certifications: data.certifications ?? [],
              website: data.website || null,
            },
            create: {
              profileId: revision.profileId,
              title: data.title,
              expertise: data.expertise ?? [],
              yearsOfExperience: data.yearsOfExperience ?? 0,
              education: data.education ?? [],
              certifications: data.certifications ?? [],
              website: data.website || null,
            },
          });
        }

        const updatedProfile = await transaction.profile.findUniqueOrThrow({
          where: { id: revision.profileId },
          include: {
            clientProfile: true,
            expertProfile: true,
            freelancerProfile: {
              include: {
                _count: {
                  select: {
                    skills: true,
                    portfolioItems: { where: { deletedAt: null } },
                  },
                },
              },
            },
          },
        });
        const profileCompletionPercent =
          profileType === ProfileRevisionType.FREELANCER
            ? calculateFreelancerProfileStrength({
                displayName: updatedProfile.displayName,
                bio: updatedProfile.bio,
                title: updatedProfile.freelancerProfile?.title,
                education: updatedProfile.freelancerProfile?.education,
                certifications:
                  updatedProfile.freelancerProfile?.certifications,
                skillCount:
                  updatedProfile.freelancerProfile?._count.skills ?? 0,
                portfolioCount:
                  updatedProfile.freelancerProfile?._count.portfolioItems ?? 0,
              })
            : profileType === ProfileRevisionType.CLIENT
              ? calculateClientProfileStrength({
                  displayName: updatedProfile.displayName,
                  bio: updatedProfile.bio,
                  companyName: updatedProfile.clientProfile?.companyName,
                  companyDescription:
                    updatedProfile.clientProfile?.companyDescription,
                  website: updatedProfile.clientProfile?.website,
                })
              : calculateExpertProfileStrength({
                  displayName: updatedProfile.displayName,
                  bio: updatedProfile.bio,
                  title: updatedProfile.expertProfile?.title,
                  expertise: updatedProfile.expertProfile?.expertise,
                  yearsOfExperience:
                    updatedProfile.expertProfile?.yearsOfExperience,
                  education: updatedProfile.expertProfile?.education,
                  certifications: updatedProfile.expertProfile?.certifications,
                  website: updatedProfile.expertProfile?.website,
                });
        await transaction.profile.update({
          where: { id: revision.profileId },
          data: { profileCompletionPercent },
        });
      }

      const approved = status === RevisionStatus.APPROVED;
      await transaction.notification.create({
        data: {
          userId: revision.userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: approved
            ? 'Profile update approved'
            : 'Profile update rejected',
          message: approved
            ? 'Your reviewed profile changes are now visible.'
            : `Your profile changes were not approved.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
          data: {
            href:
              profileType === ProfileRevisionType.CLIENT
                ? '/client/profile'
                : profileType === ProfileRevisionType.FREELANCER
                  ? '/freelancer/profile'
                  : '/expert/profile',
            profileRevisionId: id,
          },
        },
      });

      return transaction.profileRevision.findUnique({
        where: { id },
        select: revisionSelect,
      });
    });
  }
}
