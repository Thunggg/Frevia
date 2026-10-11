import { Injectable, Logger } from '@nestjs/common';
import {
  SessionFilterType,
  SessionListResponseType,
} from '@shared/types';
import { FailedToLoadSessionsException } from './sessions.error';
import { SessionsRepository } from './sessions.repo';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async getMySessions(
    userId: number,
    filter: SessionFilterType,
  ): Promise<SessionListResponseType> {
    try {
      const { sessions, total } =
        await this.sessionsRepository.findAllByUserId(userId, filter);

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
}
