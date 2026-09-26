import { Injectable } from '@nestjs/common';
import { User, VerificationCode, VerificationCodeType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findVerificationCode(
    code: string,
    type: VerificationCodeType,
    email: string,
  ): Promise<VerificationCode | null> {
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
  ): Promise<VerificationCode | null> {
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
  ): Promise<User> {
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
  }): Promise<VerificationCode> {
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
}
