import { HttpException, Injectable } from '@nestjs/common';
import { ForumReportRepository } from './forums-reports.repo';
import {
  CreateForumReportResponseType,
  ForumReportListResponseType,
  UpdateReportStatusResponseType,
} from '@shared/types';
import { RoleName } from '@shared/types';
import {
  ForumPostNotFoundException,
  ForumCommentNotFoundException,
  ForumReportAlreadyExistsException,
  FailedToCreateForumReportException,
  ForumReportNotFoundException,
  FailedToLoadForumReportsException,
  FailedToUpdateReportStatusException,
  ForumReportForbiddenException,
} from './forums-reports.error';

@Injectable()
export class ForumReportService {
  constructor(private readonly forumReportRepository: ForumReportRepository) {}

  async createPostReport(
    reporterId: number,
    postId: number,
    reason: string,
  ): Promise<CreateForumReportResponseType> {
    try {
      const existingPost =
        await this.forumReportRepository.findPostById(postId);
      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      // Không cho phép 1 người spam nhiều lần report 1 post
      const existingReport =
        await this.forumReportRepository.findExistingReport(
          reporterId,
          postId,
          null,
        );
      if (existingReport) {
        throw ForumReportAlreadyExistsException();
      }

      return await this.forumReportRepository.createReport(
        reporterId,
        postId,
        null,
        reason,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateForumReportException();
    }
  }

  async createCommentReport(
    reporterId: number,
    postId: number,
    commentId: number,
    reason: string,
  ): Promise<CreateForumReportResponseType> {
    try {
      const existingComment =
        await this.forumReportRepository.findCommentById(commentId);
      if (!existingComment) {
        throw ForumCommentNotFoundException();
      }

      if (existingComment.postId !== postId) {
        throw ForumCommentNotFoundException();
      }

      // Không cho phép 1 người spam nhiều lần report 1 comment
      const existingReport =
        await this.forumReportRepository.findExistingReport(
          reporterId,
          null,
          commentId,
        );
      if (existingReport) {
        throw ForumReportAlreadyExistsException();
      }

      return await this.forumReportRepository.createReport(
        reporterId,
        postId,
        commentId,
        reason,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateForumReportException();
    }
  }

  async getForumReportLists(
    roleName: string,
    page: number,
    limit: number,
  ): Promise<ForumReportListResponseType> {
    try {
      if (roleName !== RoleName.ADMIN) {
        throw ForumReportForbiddenException();
      }

      const { reports, total } = await this.forumReportRepository.getReportList(
        page,
        limit,
      );

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('getForumReportLists error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadForumReportsException();
    }
  }

  async updateReportStatus(
    reportId: number,
    status: string,
    adminId: number,
    roleName: string,
  ): Promise<UpdateReportStatusResponseType> {
    try {
      // Chỉ admin mới có quyền update report status
      if (roleName !== RoleName.ADMIN) {
        throw ForumReportForbiddenException();
      }

      // Kiểm tra report tồn tại không
      const existingReport =
        await this.forumReportRepository.findReportById(reportId);
      if (!existingReport) {
        throw ForumReportNotFoundException();
      }

      return await this.forumReportRepository.updateReportStatus(
        reportId,
        status,
        adminId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateReportStatusException();
    }
  }
}
