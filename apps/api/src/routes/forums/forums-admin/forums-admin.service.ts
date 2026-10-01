import { HttpException, Injectable } from '@nestjs/common';
import { ForumAdminRepository } from './forums-admin.repo';
import {
  ForumAdminStatsType,
  ForumAdminCommentListResponseType,
  RoleName,
} from '@shared/types';
import { ForumReportForbiddenException } from '../forums-reports/forums-reports.error';

@Injectable()
export class ForumAdminService {
  constructor(private readonly adminRepository: ForumAdminRepository) {}

  async getAdminStats(roleName: string): Promise<ForumAdminStatsType> {
    if (roleName !== RoleName.ADMIN) {
      throw ForumReportForbiddenException();
    }
    try {
      return await this.adminRepository.getAdminStats();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async getAdminCommentLists(
    roleName: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<ForumAdminCommentListResponseType> {
    if (roleName !== RoleName.ADMIN) {
      throw ForumReportForbiddenException();
    }
    try {
      const { comments, total } =
        await this.adminRepository.getAdminCommentLists(page, limit, search);

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }
}
