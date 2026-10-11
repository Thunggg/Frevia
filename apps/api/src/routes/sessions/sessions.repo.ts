import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SessionDetailResponseType,
  SessionFilterType,
  SessionListItemType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  SessionAlreadyExpiredException,
  SessionNotFoundException,
} from './sessions.error';

const sessionSelect = {
  id: true,
  userId: true,
  deviceInfo: true,
  ipAddress: true,
  expiresAt: true,
  createdAt: true,
} as const;

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(
    userId: number,
    filter: SessionFilterType,
    currentSessionId?: number,
  ): Promise<{
    sessions: SessionListItemType[];
    total: number;
  }> {
    const { page, limit, search, sortBy, order } = filter;

    const where: Prisma.SessionWhereInput = {
      userId,
      ...(search && {
        OR: [
          {
            ipAddress: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            deviceInfo: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };

    // rows: danh sách các session
    // total: tổng số session
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        select: sessionSelect,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);

    // Gắn isCurrent để UI biết session nào đang dùng
    const sessions = rows.map((row) => ({
      ...row,
      isCurrent: currentSessionId != null && row.id === currentSessionId,
    }));

    return { sessions, total };
  }

  async findByIdForUser(
    id: number,
    userId: number,
    currentSessionId?: number,
  ): Promise<SessionDetailResponseType> {
    const session = await this.prisma.session.findFirst({
      where: { id, userId },
      select: sessionSelect,
    });

    if (!session) {
      throw SessionNotFoundException();
    }

    return {
      ...session,
      isCurrent: currentSessionId != null && session.id === currentSessionId,
    };
  }

  /**
   * Xóa session của đúng user.
   * - Không tìm thấy → 404
   * - Đã hết hạn → 400 (BR-02)
   */
  async deleteActiveByIdForUser(id: number, userId: number): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id, userId },
      select: { id: true, expiresAt: true },
    });

    if (!session) {
      throw SessionNotFoundException();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw SessionAlreadyExpiredException();
    }

    await this.prisma.session.delete({ where: { id: session.id } });
  }
}
