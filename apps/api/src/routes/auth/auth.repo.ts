import { Injectable } from '@nestjs/common';
import { Prisma, VerificationCodeType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
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
  ) {
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
  ) {
    return await this.prisma.verificationCode.findUnique({
      where: {
        email_type: {
          email,
          type,
        },
      },
    });
  }

  async deleteVerificationCodeMany(
    code: string,
    type: VerificationCodeType,
    email: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.verificationCode.deleteMany({
      where: {
        code,
        type,
        email,
      },
    });
  }

  async createUser(
    data: {
      email: string;
      password?: string;
      isBanned?: boolean;
      fullName: string;
      roleId: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.user.create({
      data: {
        email: data.email,
        password: data.password,
        isBanned: data.isBanned ?? false,
        profile: {
          create: {
            displayName: data.fullName,
          },
        },
        userRoles: {
          create: {
            roleId: data.roleId,
          },
        },
      },
    });
  }

  async upsertVerificationCode(data: {
    email: string;
    type: VerificationCodeType;
    code: string;
    expiresAt: Date;
    attempts: number;
  }) {
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
