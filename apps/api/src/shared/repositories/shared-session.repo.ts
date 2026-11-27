import { Injectable } from '@nestjs/common';
import type { AccessTokenPayload } from '@shared/types';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class SharedSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Tìm session theo sessionId và userId kèm trạng thái ban/xóa mềm của user. */
  findByIdAndUserIdWithUser(
    sessionId: AccessTokenPayload['sessionId'],
    userId: AccessTokenPayload['userId'],
  ) {
    return this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        user: {
          select: {
            isBanned: true,
            deletedAt: true,
          },
        },
      },
    });
  }
}
