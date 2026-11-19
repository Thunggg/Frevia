import { Injectable } from '@nestjs/common';
import { VerificationCodeType } from '@prisma/client';
import {
  EmailVerificationType,
  JoinRoleBodyType,
  OauthProvider,
  RoleName,
  RoleType,
  SwitchRoleBodyType,
  TypeOfVerificationCode,
  UserType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(
    email: string,
  ): Promise<Omit<
    UserType,
    'password' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findUserByEmailIncludeRole(
    email: string,
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  }

  async findVerificationCode({
    code,
    email,
    type,
  }: {
    code: string;
    email: string;
    type: TypeOfVerificationCode;
  }): Promise<Pick<
    EmailVerificationType,
    'id' | 'attempts' | 'code' | 'type' | 'expiresAt' | 'createdAt'
  > | null> {
    return await this.prisma.verificationCode.findFirst({
      where: {
        code,
        type,
        email,
      },
    });
  }

  async findVerificationCodeByEmailAndType(
    email: string,
    type: VerificationCodeType,
  ): Promise<Omit<EmailVerificationType, 'id'> | null> {
    return await this.prisma.verificationCode.findUnique({
      where: {
        email_type: {
          email,
          type,
        },
      },
    });
  }

  async createUserAndRegister(
    deleteOtp: { code: string; type: VerificationCodeType; email: string },
    user: {
      email: string;
      password?: string;
      isBanned?: boolean;
      fullName: string;
      roleId: number;
    },
  ): Promise<
    Omit<UserType, 'password' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  > {
    const [, createdUser] = await this.prisma.$transaction([
      this.prisma.verificationCode.deleteMany({
        where: {
          code: deleteOtp.code,
          type: deleteOtp.type,
          email: deleteOtp.email,
        },
      }),
      this.prisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          roleId: user.roleId,
          isBanned: user.isBanned ?? false,
          userRoles: {
            create: {
              roleId: user.roleId,
            },
          },
          profile: {
            create: {
              displayName: user.fullName,
            },
          },
        },
      }),
    ]);
    return createdUser;
  }

  async createUserAndRegisterGoogle(user: {
    email: string;
    fullName: string;
    roleId: number;
  }): Promise<UserType & { role: RoleType }> {
    return await this.prisma.user.create({
      data: {
        email: user.email,
        roleId: user.roleId,
        userRoles: {
          create: {
            roleId: user.roleId,
          },
        },
        profile: {
          create: {
            displayName: user.fullName,
          },
        },
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });
  }

  async upsertVerificationCode(data: {
    email: string;
    type: VerificationCodeType;
    code: string;
    expiresAt: Date;
    attempts: number;
  }): Promise<Omit<EmailVerificationType, 'id'>> {
    return await this.prisma.verificationCode.upsert({
      where: {
        email_type: {
          email: data.email,
          type: data.type,
        },
      },
      update: {
        code: data.code,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        attempts: data.attempts,
      },
      create: {
        email: data.email,
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        attempts: data.attempts,
      },
    });
  }

  async findUserForLogin(email: string) {
    return await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: {
                permission: {
                  deletedAt: null,
                },
              },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async createSession({
    userId,
    deviceInfo,
    ipAddress,
    refreshToken,
    expiresAt,
  }: {
    userId: number;
    deviceInfo: string;
    ipAddress: string;
    refreshToken: string;
    expiresAt: Date;
  }) {
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        deviceInfo,
        ipAddress,
        expiresAt,
        createdAt: new Date(),
      },
    });
    return session;
  }

  async deleteSessionByRefreshToken({
    refreshToken,
    userId,
  }: {
    refreshToken: string;
    userId: number;
  }) {
    return await this.prisma.session.delete({
      where: {
        refreshToken,
        userId,
      },
    });
  }

  async findUniqueRefreshTokenIncludeUserRole({
    refreshToken,
  }: {
    refreshToken: string;
  }) {
    return this.prisma.session.findUnique({
      where: {
        refreshToken,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  update(
    where: { id: number },
    data: Partial<UserType>,
  ): Promise<UserType | null> {
    return this.prisma.user.update({
      where: {
        ...where,
        deletedAt: null,
      },
      data,
    });
  }

  async deleteVerifycationCode(uniqueValue: {
    email: string;
    type: TypeOfVerificationCode;
  }) {
    return await this.prisma.verificationCode.delete({
      where: {
        email_type: uniqueValue,
      },
    });
  }

  async findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        isBanned: true,
        deletedAt: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              where: {
                permission: {
                  deletedAt: null,
                },
              },
              include: {
                permission: true,
              },
            },
          },
        },
        userRoles: {
          where: {
            role: {
              deletedAt: null,
            },
          },
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'asc',
          },
        },
      },
    });
  }

  async switchMarketplaceRole(
    userId: number,
    targetRoleName: SwitchRoleBodyType['role'],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          isBanned: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          userRoles: {
            where: {
              role: { deletedAt: null },
            },
            select: {
              roleId: true,
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
      });

      if (!user || !user.role) {
        return { status: 'user-not-found' as const };
      }

      if (user.isBanned) {
        return { status: 'banned' as const };
      }

      const currentRoleName = user.role.name;
      if (
        currentRoleName !== RoleName.CLIENT &&
        currentRoleName !== RoleName.FREELANCER
      ) {
        return { status: 'forbidden' as const };
      }

      const ownedTargetRole =
        user.role.name === targetRoleName
          ? user.role
          : user.userRoles.find((ur) => ur.role.name === targetRoleName)?.role;

      if (!ownedTargetRole) {
        return { status: 'not-owned' as const };
      }

      if (user.roleId !== ownedTargetRole.id) {
        await transaction.user.update({
          where: { id: userId },
          data: { roleId: ownedTargetRole.id },
        });
      }

      return { status: 'switched' as const, role: ownedTargetRole };
    });
  }

  async joinMarketplaceRole(
    userId: number,
    targetRoleName: JoinRoleBodyType['role'],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          isBanned: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          userRoles: {
            where: {
              role: { deletedAt: null },
            },
            select: {
              roleId: true,
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

      if (!user || !user.role) {
        return { status: 'user-not-found' as const };
      }

      if (user.isBanned) {
        return { status: 'banned' as const };
      }

      const currentRoleName = user.role.name;
      if (
        currentRoleName !== RoleName.CLIENT &&
        currentRoleName !== RoleName.FREELANCER
      ) {
        return { status: 'forbidden' as const };
      }

      const targetRole = await transaction.role.findFirst({
        where: { name: targetRoleName, deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      if (!targetRole) {
        return { status: 'role-not-found' as const };
      }

      const alreadyOwned =
        user.roleId === targetRole.id ||
        user.userRoles.some((ur) => ur.roleId === targetRole.id);

      if (alreadyOwned) {
        return { status: 'already-assigned' as const, role: targetRole };
      }

      // Explicitly record both the user's current role and newly joined role in UserRole.
      await transaction.userRole.createMany({
        data: [
          { userId, roleId: user.roleId },
          { userId, roleId: targetRole.id },
        ],
        skipDuplicates: true,
      });

      const profile = await transaction.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });

      if (targetRoleName === RoleName.FREELANCER) {
        await transaction.freelancerProfile.upsert({
          where: { profileId: profile.id },
          create: { profileId: profile.id },
          update: {},
        });
      } else {
        await transaction.clientProfile.upsert({
          where: { profileId: profile.id },
          create: { profileId: profile.id },
          update: {},
        });
      }

      await transaction.user.update({
        where: { id: userId },
        data: { roleId: targetRole.id },
      });

      return { status: 'joined' as const, role: targetRole };
    });
  }

  async createOauthAccount({
    userId,
    provider,
    providerUserId,
  }: {
    userId: number;
    provider: (typeof OauthProvider)[keyof typeof OauthProvider];
    providerUserId: string;
  }) {
    return await this.prisma.oauthAccount.create({
      data: {
        userId,
        provider,
        providerUserId,
        createdAt: new Date(),
      },
    });
  }
}
