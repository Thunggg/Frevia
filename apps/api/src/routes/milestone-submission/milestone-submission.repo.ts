import { Injectable } from '@nestjs/common';
import { MilestoneStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { RequestChangesBodyType, SubmitMilestoneBodyType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const submissionSelect = {
  id: true,
  milestoneId: true,
  freelancerId: true,
  message: true,
  links: true,
  status: true,
  changeRequestMessage: true,
  changeRequestDueDate: true,
  submittedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MilestoneSubmissionSelect;

@Injectable()
export class MilestoneSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findContractById(contractId: number) {
    return this.prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      select: {
        id: true,
        clientId: true,
        freelancerId: true,
        status: true,
      },
    });
  }

  async findMilestoneById(milestoneId: number) {
    return this.prisma.milestone.findFirst({
      where: { id: milestoneId, deletedAt: null },
      select: {
        id: true,
        contractId: true,
        status: true,
        paymentStatus: true,
      },
    });
  }

  async findSubmissionById(submissionId: number) {
    return this.prisma.milestoneSubmission.findUnique({
      where: { id: submissionId },
      select: submissionSelect,
    });
  }

  async getSubmissionDetail(milestoneId: number) {
    return await this.prisma.milestoneSubmission.findMany({
      where: { milestoneId },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSubmission(submissionId: number) {
    return await this.prisma.milestoneSubmission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });
  }

  async createSubmission(
    milestoneId: number,
    freelancerId: number,
    body: SubmitMilestoneBodyType,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.milestoneSubmission.create({
        data: {
          milestoneId,
          freelancerId,
          message: body.message ?? null,
          links: body.links ?? [],
        },
        select: submissionSelect,
      });

      if (body.fileIds && body.fileIds.length > 0) {
        await tx.milestoneSubmissionFile.createMany({
          data: body.fileIds.map((fileId) => ({
            submissionId: submission.id,
            fileId,
          })),
        });
      }

      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: MilestoneStatus.SUBMITTED },
      });

      return submission;
    });
  }

  async requestChanges(
    submissionId: number,
    milestoneId: number,
    body: RequestChangesBodyType,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.milestoneSubmission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.CHANGES_REQUESTED,
          changeRequestMessage: body.changeRequestMessage,
          changeRequestDueDate: body.changeRequestDueDate
            ? new Date(body.changeRequestDueDate)
            : null,
          reviewedAt: new Date(),
        },
        select: submissionSelect,
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: MilestoneStatus.CHANGES_REQUESTED },
      });

      return submission;
    });
  }

  async approveSubmission(submissionId: number, milestoneId: number) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.milestoneSubmission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.APPROVED,
          reviewedAt: new Date(),
        },
        select: submissionSelect,
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      return submission;
    });
  }
}
