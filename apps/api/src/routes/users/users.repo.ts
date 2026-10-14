import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminUserDetailResponseType,
  AdminUserItemType,
  AdminUserListResponseType,
  AdminUserQueryType,
  RoleName,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(
    query: AdminUserQueryType,
  ): Promise<AdminUserListResponseType> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search?.trim();
    const role = query.role?.trim();
    const sortBy = query.sortBy || 'id';
    const sortOrder = query.sortOrder || 'desc';

    const skip = (page - 1) * limit;

    // Dùng để filter user tìm kiếm theo email hoặc displayName
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          {
            profile: {
              displayName: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    // nếu API nhận ?role=CLIENT thì chỉ lấy user có role CLIENT;
    // ?role=FREELANCER thì chỉ lấy Freelancer;
    // ?role=ADMIN thì chỉ lấy Admin;
    // ?role=CUSTOM thì lấy các role khác 3 role đó.
    if (role && role !== 'all' && role !== 'ALL') {
      if (role === 'CLIENT' || role.toLowerCase() === 'client') {
        where.userRoles = {
          some: {
            role: { name: { equals: RoleName.CLIENT, mode: 'insensitive' } },
          },
        };
      } else if (role === 'FREELANCER' || role.toLowerCase() === 'freelancer') {
        where.userRoles = {
          some: {
            role: {
              name: { equals: RoleName.FREELANCER, mode: 'insensitive' },
            },
          },
        };
      } else if (role === 'ADMIN' || role.toLowerCase() === 'admin') {
        where.userRoles = {
          some: {
            role: {
              name: { equals: RoleName.ADMIN, mode: 'insensitive' },
            },
          },
        };
      } else if (role === 'CUSTOM' || role.toLowerCase() === 'custom') {
        where.userRoles = {
          some: {
            role: {
              name: {
                notIn: [RoleName.CLIENT, RoleName.FREELANCER, RoleName.ADMIN],
                mode: 'insensitive',
              },
            },
          },
        };
      } else {
        where.userRoles = {
          some: {
            role: { name: { equals: role, mode: 'insensitive' } },
          },
        };
      }
    }

    // sort theo field được truyền vào
    let orderBy: Prisma.UserOrderByWithRelationInput = { id: sortOrder };
    if (sortBy === 'email') {
      orderBy = { email: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'displayName') {
      orderBy = { profile: { displayName: sortOrder } };
    } else {
      orderBy = { id: sortOrder };
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
          userRoles: {
            select: {
              isPrimary: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: AdminUserItemType[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        isPrimary: ur.isPrimary,
      })),
    }));

    return {
      users: mappedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUserByAdmin(data: {
    email: string;
    password: string;
    fullName: string;
    roleId: number;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        profile: {
          create: {
            displayName: data.fullName,
          },
        },
        userRoles: {
          create: {
            roleId: data.roleId,
            isPrimary: true,
          },
        },
      },
      include: {
        profile: {
          select: {
            displayName: true,
          },
        },
        userRoles: {
          select: {
            isPrimary: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserByEmail(email: string): Promise<{ id: number } | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: { id: true },
    });
  }

  async findActiveRoleById(
    id: number,
  ): Promise<{ id: number; name: string } | null> {
    return this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  async updateUserByAdmin(
    id: number,
    data: { email?: string; fullName?: string | null; isBanned?: boolean },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.isBanned !== undefined ? { isBanned: data.isBanned } : {}),
        ...(data.fullName !== undefined
          ? {
              profile: {
                upsert: {
                  create: { displayName: data.fullName },
                  update: { displayName: data.fullName },
                },
              },
            }
          : {}),
      },
      include: {
        profile: {
          select: {
            displayName: true,
          },
        },
        userRoles: {
          select: {
            isPrimary: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserById(id: number): Promise<AdminUserDetailResponseType | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        profile: {
          include: {
            socialLinks: true,
            freelancerProfile: {
              include: {
                skills: true,
                portfolioItems: {
                  where: { deletedAt: null },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            clientProfile: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            jobsPosted: true,
            contractsAsClient: true,
            contractsAsFreelancer: true,
            proposals: true,
            reviewsReceived: true,
            idVerificationDocuments: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const customRoleProfiles = user.userRoles
      .filter((ur) => {
        const name = ur.role.name.toLowerCase();
        return name !== 'client' && name !== 'freelancer';
      })
      .map((ur) => ({
        roleId: ur.role.id,
        roleName: ur.role.name,
        description: ur.role.description,
        isPrimary: ur.isPrimary,
        permissions: ur.role.rolePermissions
          .filter((rp) => rp.permission && !rp.permission.deletedAt)
          .map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            path: rp.permission.path,
            method: rp.permission.method,
            module: rp.permission.module,
          })),
      }));

    const clientProfile = user.profile?.clientProfile
      ? {
          id: user.profile.clientProfile.id,
          companyName: user.profile.clientProfile.companyName,
          companyDescription: user.profile.clientProfile.companyDescription,
          website: user.profile.clientProfile.website,
          createdAt: user.profile.clientProfile.createdAt,
          updatedAt: user.profile.clientProfile.updatedAt,
        }
      : null;

    const freelancerProfile = user.profile?.freelancerProfile
      ? {
          id: user.profile.freelancerProfile.id,
          title: user.profile.freelancerProfile.title,
          education: user.profile.freelancerProfile.education,
          certifications: user.profile.freelancerProfile.certifications,
          languages: user.profile.freelancerProfile.languages,
          idVerified: user.profile.freelancerProfile.idVerified,
          skills: user.profile.freelancerProfile.skills.map((s) => ({
            id: s.id,
            skillName: s.skillName,
            proficiencyLevel: s.proficiencyLevel,
          })),
          portfolioItems: user.profile.freelancerProfile.portfolioItems.map(
            (p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              technologies: p.technologies,
              mediaUrls: p.mediaUrls,
              projectUrl: p.projectUrl,
              createdAt: p.createdAt,
            }),
          ),
          createdAt: user.profile.freelancerProfile.createdAt,
          updatedAt: user.profile.freelancerProfile.updatedAt,
        }
      : null;

    return {
      id: user.id,
      email: user.email,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      coverUrl: user.profile?.coverUrl ?? null,
      bio: user.profile?.bio ?? null,
      onlineStatus: user.profile?.onlineStatus ?? false,
      availabilityStatus: user.profile?.availabilityStatus ?? 'OFFLINE',
      profileCompletionPercent: user.profile?.profileCompletionPercent ?? 0,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        isPrimary: ur.isPrimary,
      })),
      socialLinks: (user.profile?.socialLinks ?? []).map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
      })),
      stats: {
        jobsPosted: user._count.jobsPosted,
        contractsAsClient: user._count.contractsAsClient,
        contractsAsFreelancer: user._count.contractsAsFreelancer,
        proposals: user._count.proposals,
        reviewsReceived: user._count.reviewsReceived,
        idVerificationDocuments: user._count.idVerificationDocuments,
      },
      clientProfile,
      freelancerProfile,
      customRoleProfiles,
    };
  }
}
