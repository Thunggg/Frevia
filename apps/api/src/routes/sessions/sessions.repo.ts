import { Injectable } from '@nestjs/common';
import {
  SessionDetailResponseType,
  SessionFilterType,
  SessionListItemType,
} from '@shared/types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { SessionNotFoundException } from './sessions.error';

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

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        select: sessionSelect,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);

    return { sessions, total };
  }

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<SessionDetailResponseType> {
    const session = await this.prisma.session.findFirst({
      where: { id, userId },
      select: sessionSelect,
    });

    if (!session) {
      throw SessionNotFoundException();
    }

    return session;
  }
}
