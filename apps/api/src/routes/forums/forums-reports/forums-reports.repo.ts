import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ForumReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TÌm post
  async findPostById(postId: number): Promise<{ id: number } | null> {
    return this.prisma.forumPost.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  // TÌm comment
  async findCommentById(
    commentId: number,
  ): Promise<{ id: number; postId: number } | null> {
    return this.prisma.forumComment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
      select: {
        id: true,
        postId: true,
      },
    });
  }

  // TÌm report đã tồn tại
  async findExistingReport(
    reporterId: number,
    postId: number | null,
    commentId: number | null,
  ): Promise<{ id: number } | null> {
    return this.prisma.forumReport.findFirst({
      where: {
        reporterId,
        postId,
        commentId,
      },
      select: {
        id: true,
      },
    });
  }

  // Tạo report
  async createReport(
    reporterId: number,
    postId: number | null,
    commentId: number | null,
    reason: string,
  ) {
    return this.prisma.forumReport.create({
      data: {
        reporterId,
        postId,
        commentId,
        reason,
      },
      select: {
        id: true,
        reporterId: true,
        postId: true,
        commentId: true,
        reason: true,
        status: true,
        adminId: true,
        createdAt: true,
      },
    });
  }

  // Tìm report theo id
  async findReportById(id: number) {
    return this.prisma.forumReport.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        reporterId: true,
        postId: true,
        commentId: true,
        reason: true,
        status: true,
        adminId: true,
        createdAt: true,
      },
    });
  }

  // Tìm danh sách report
  async getReportList(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.forumReport.findMany({
        select: {
          id: true,
          reporterId: true,
          postId: true,
          commentId: true,
          reason: true,
          status: true,
          adminId: true,
          createdAt: true,
          reporter: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.forumReport.count(),
    ]);

    return { reports, total };
  }

  // Cập nhật trạng thái report
  async updateReportStatus(id: number, status: string, adminId: number | null) {
    return this.prisma.forumReport.update({
      where: {
        id,
      },
      data: {
        status: status.toUpperCase() as ReportStatus,
        adminId,
      },
      select: {
        id: true,
        reporterId: true,
        postId: true,
        commentId: true,
        reason: true,
        status: true,
        adminId: true,
        createdAt: true,
      },
    });
  }
}
