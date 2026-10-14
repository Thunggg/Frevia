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

  // Admin tạo user: tạo User + Profile (displayName) + UserRole primary trong 1 lệnh
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

  // Tìm user theo email (chưa soft-delete) — dùng kiểm tra email trùng
  async findUserByEmail(email: string): Promise<{ id: number } | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: { id: true },
    });
  }

  // Lấy role active theo id (dùng khi chọn role khởi tạo cho user mới)
  async findActiveRoleById(
    id: number,
  ): Promise<{ id: number; name: string } | null> {
    return this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  // Admin sửa thông tin chung account: email / isBanned / displayName (profile upsert)
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

  // Kiểm tra user có đủ điều kiện sửa hồ sơ Client/Freelancer hay không
  async findClientProfileEditContext(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        profile: {
          select: {
            id: true,
            clientProfile: { select: { id: true } },
          },
        },
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      profileId: user.profile?.id ?? null,
      clientProfileId: user.profile?.clientProfile?.id ?? null,
      hasClientRole: user.userRoles.some(
        (ur) => ur.role.name.toLowerCase() === 'client',
      ),
    };
  }

  // Upsert hồ sơ Client: profile có sẵn thì cập nhật clientProfile, chưa có thì tạo cả chuỗi
  async upsertClientProfileByAdmin(
    userId: number,
    data: {
      companyName?: string | null;
      companyDescription?: string | null;
      website?: string | null;
    },
  ) {
    const buildData = () => ({
      ...(data.companyName !== undefined
        ? { companyName: data.companyName }
        : {}),
      ...(data.companyDescription !== undefined
        ? { companyDescription: data.companyDescription }
        : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              clientProfile: {
                create: buildData(),
              },
            },
            update: {
              clientProfile: {
                upsert: {
                  create: buildData(),
                  update: buildData(),
                },
              },
            },
          },
        },
      },
      include: {
        profile: {
          select: {
            clientProfile: true,
          },
        },
      },
    });

    return user.profile?.clientProfile ?? null;
  }

  // Bối cảnh chỉnh sửa hồ sơ Freelancer: trả về profile/freelancerProfile + có role Freelancer không
  async findFreelancerProfileEditContext(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        profile: {
          select: {
            id: true,
            freelancerProfile: { select: { id: true } },
          },
        },
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      profileId: user.profile?.id ?? null,
      freelancerProfileId: user.profile?.freelancerProfile?.id ?? null,
      hasFreelancerRole: user.userRoles.some(
        (ur) => ur.role.name.toLowerCase() === 'freelancer',
      ),
    };
  }

  // Cập nhật hồ sơ Freelancer:
  // - bio nằm ở Profile; title + languages/education/certifications nằm ở FreelancerProfile
  // - dùng upsert theo chuỗi để không lỗi khi user chưa có profile/freelancer profile
  async updateFreelancerProfileByAdmin(
    userId: number,
    data: {
      title?: string | null;
      bio?: string | null;
      languages?: string[];
      education?: string[];
      certifications?: string[];
    },
  ) {
    // Các trường thuộc FreelancerProfile (chỉ đưa vào khi được gửi lên)
    const freelancerData = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.languages !== undefined ? { languages: data.languages } : {}),
      ...(data.education !== undefined ? { education: data.education } : {}),
      ...(data.certifications !== undefined
        ? { certifications: data.certifications }
        : {}),
    };

    const hasFreelancerFields = Object.keys(freelancerData).length > 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              ...(data.bio !== undefined ? { bio: data.bio } : {}),
              ...(hasFreelancerFields
                ? { freelancerProfile: { create: freelancerData } }
                : {}),
            },
            update: {
              ...(data.bio !== undefined ? { bio: data.bio } : {}),
              ...(hasFreelancerFields
                ? {
                    freelancerProfile: {
                      upsert: {
                        create: freelancerData,
                        update: freelancerData,
                      },
                    },
                  }
                : {}),
            },
          },
        },
      },
    });
  }

  // Đảm bảo user có row FreelancerProfile (tạo nếu chưa có) rồi trả về freelancerProfileId
  async ensureFreelancerProfile(userId: number, profileId: number | null) {
    return this.prisma.$transaction(async (tx) => {
      // nếu chưa có profile thì tạo profile và freelancerProfile
      if (profileId === null) {
        const result = await tx.user.update({
          where: { id: userId },
          data: {
            profile: {
              create: {
                freelancerProfile: { create: { title: null } },
              },
            },
          },
          include: {
            profile: {
              select: {
                freelancerProfile: { select: { id: true } },
              },
            },
          },
        });
        return result.profile?.freelancerProfile?.id ?? null;
      }

      // Nếu đã có profile thì tạo FreelancerProfile vào Profile hiện có
      const result = await tx.profile.update({
        where: { id: profileId },
        data: {
          freelancerProfile: {
            create: { title: null },
          },
        },
        include: {
          freelancerProfile: { select: { id: true } },
        },
      });
      return result.freelancerProfile?.id ?? null;
    });
  }

  // Thay thế toàn bộ kỹ năng: xoá hết kỹ năng cũ rồi tạo lại danh sách mới (transaction)
  async replaceFreelancerSkills(
    freelancerProfileId: number,
    skills: { skillName: string; proficiencyLevel: number }[],
  ) {
    await this.prisma.$transaction([
      this.prisma.freelancerSkill.deleteMany({
        where: { freelancerProfileId },
      }),
      ...(skills.length > 0
        ? [
            this.prisma.freelancerSkill.createMany({
              data: skills.map((skill) => ({
                freelancerProfileId,
                skillName: skill.skillName,
                proficiencyLevel: skill.proficiencyLevel,
              })),
            }),
          ]
        : []),
    ]);
  }

  // Tạo mới portfolio item — chỉ nhập text, không upload file
  async createPortfolioItem(
    freelancerProfileId: number,
    data: {
      title: string;
      description?: string | null;
      technologies?: string[];
      projectUrl?: string | null;
    },
  ) {
    return this.prisma.portfolioItem.create({
      data: {
        freelancerProfileId,
        title: data.title,
        description: data.description ?? null,
        technologies: data.technologies ?? [],
        projectUrl: data.projectUrl ?? null,
      },
    });
  }

  // Lấy portfolio item kèm freelancerProfileId + trạng thái xoá để service kiểm tra "quyền sở hữu"
  async findPortfolioItemOwned(id: number) {
    return this.prisma.portfolioItem.findUnique({
      where: { id },
      select: { id: true, freelancerProfileId: true, deletedAt: true },
    });
  }

  // Cập nhật portfolio item theo từng trường được gửi lên
  async updatePortfolioItemByAdmin(
    id: number,
    data: {
      title?: string;
      description?: string | null;
      technologies?: string[];
      projectUrl?: string | null;
    },
  ) {
    return this.prisma.portfolioItem.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.technologies !== undefined
          ? { technologies: data.technologies }
          : {}),
        ...(data.projectUrl !== undefined
          ? { projectUrl: data.projectUrl }
          : {}),
      },
    });
  }

  // Xoá mềm portfolio item (đặt deletedAt)
  async softDeletePortfolioItem(id: number) {
    return this.prisma.portfolioItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Liệt kê Skill active trong catalog (nguồn chọn kỹ năng ở dialog Admin)
  async listActiveSkillCatalog() {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
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
