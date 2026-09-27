import { Injectable } from '@nestjs/common';
import { VerificationCodeType } from '@prisma/client';
import {
  EmailVerificationType,
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
          isBanned: user.isBanned ?? false,
          profile: {
            create: {
              displayName: user.fullName,
            },
          },
          userRoles: {
            create: {
              roleId: user.roleId,
              isPrimary: true,
            },
          },
        },
      }),
    ]);
    return createdUser;
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
        userRoles: {
          include: { role: true },
          orderBy: {
            isPrimary: 'desc',
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
            userRoles: {
              include: {
                role: true,
              },
              orderBy: {
                isPrimary: 'desc',
              },
            },
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
}
