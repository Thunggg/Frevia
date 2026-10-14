import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  RevokeSessionResponseType,
  SessionDetailResponseType,
  SessionFilterType,
  SessionListResponseType,
} from '@shared/types';
import {
  FailedToLoadSessionDetailException,
  FailedToLoadSessionsException,
  FailedToRevokeSessionException,
} from './sessions.error';
import { SessionsRepository } from './sessions.repo';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async getMySessions(
    userId: number,
    filter: SessionFilterType,
    currentSessionId?: number,
  ): Promise<SessionListResponseType> {
    try {
      const { sessions, total } = await this.sessionsRepository.findAllByUserId(
        userId,
        filter,
        currentSessionId,
      );

      return {
        sessions,
        pagination: {
          page: filter.page,
          limit: filter.limit,
          total,
          totalPages: Math.ceil(total / filter.limit) || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to load sessions for userId=${userId}`, error);
      throw FailedToLoadSessionsException();
    }
  }

  async getMySessionById(
    id: number,
    userId: number,
    currentSessionId?: number,
  ): Promise<SessionDetailResponseType> {
    try {
      return await this.sessionsRepository.findByIdForUser(
        id,
        userId,
        currentSessionId,
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(
          `Failed to load session detail: id=${id}, userId=${userId}`,
          error,
        );
        throw FailedToLoadSessionDetailException();
      }
      throw error;
    }
  }

  async revokeMySession(
    id: number,
    userId: number,
    currentSessionId?: number,
  ): Promise<RevokeSessionResponseType> {
    try {
      // BR-01/BR-05: chỉ xóa session thuộc userId
      // BR-02: chỉ xóa khi còn active (chưa hết hạn)
      // BR-03: xóa row → refresh token mất ngay
      await this.sessionsRepository.deleteActiveByIdForUser(id, userId);

      // BR-04: nếu revoke đúng session đang dùng → client sẽ logout
      const loggedOut = currentSessionId != null && currentSessionId === id;

      this.logger.log(
        `Session revoked: id=${id}, userId=${userId}, loggedOut=${loggedOut}`,
      );

      return {
        message: 'Session revoked successfully',
        loggedOut,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(
          `Failed to revoke session: id=${id}, userId=${userId}`,
          error,
        );
        throw FailedToRevokeSessionException();
      }
      throw error;
    }
  }
}
