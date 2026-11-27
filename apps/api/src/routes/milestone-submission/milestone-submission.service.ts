import { HttpException, Injectable, Optional } from '@nestjs/common';
import {
  MilestonePaymentStatus,
  MilestoneStatus,
  NotificationType,
  SubmissionStatus,
} from '@prisma/client';
import {
  RequestChangesBodyType,
  RoleName,
  SubmitMilestoneBodyType,
} from '@shared/types';
import { MilestoneSubmissionRepository } from './milestone-submission.repo';
import { PaymentService } from '../payments/payment.service';
import { AppNotificationService } from '../../shared/services/app-notification.service';
import {
  FailedToApproveException,
  FailedToLoadSubmissionException,
  FailedToRequestChangesException,
  FailedToSubmitException,
  MilestoneNotFundedException,
  MilestoneNotInProgressException,
  SubmissionContractNotFoundException,
  SubmissionForbiddenException,
  SubmissionMilestoneNotFoundException,
  SubmissionNotFoundException,
  SubmissionNotPendingReviewException,
} from './milestone-submission.error';

@Injectable()
export class MilestoneSubmissionService {
  constructor(
    private readonly submissionRepository: MilestoneSubmissionRepository,
    private readonly paymentService: PaymentService,
    @Optional() private readonly notificationService?: AppNotificationService,
  ) {}

  private async resolveAndGuardContext(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
    role: 'participant' | 'freelancer' | 'client',
  ) {
    const contract =
      await this.submissionRepository.findContractById(contractId);
    if (!contract) throw SubmissionContractNotFoundException();

    const isClient = contract.clientId === userId;
    const isFreelancer = contract.freelancerId === userId;
    const isAdmin =
      roleName === RoleName.ADMIN ||
      (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);

    if (role === 'freelancer' && !isFreelancer)
      throw SubmissionForbiddenException();
    if (role === 'client' && !isClient) throw SubmissionForbiddenException();
    if (role === 'participant' && !isClient && !isFreelancer && !isAdmin) {
      throw SubmissionForbiddenException();
    }

    const milestone =
      await this.submissionRepository.findMilestoneById(milestoneId);
    if (!milestone) throw SubmissionMilestoneNotFoundException();
    if (milestone.contractId !== contractId)
      throw SubmissionForbiddenException();

    return { contract, milestone };
  }

  async submitMilestone(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
    body: SubmitMilestoneBodyType,
  ) {
    try {
      const { contract, milestone } = await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'freelancer',
      );

      if (
        contract.expiresAt &&
        new Date(contract.expiresAt).getTime() < Date.now()
      ) {
        throw SubmissionForbiddenException();
      }

      if (
        milestone.status !== MilestoneStatus.IN_PROGRESS &&
        milestone.status !== MilestoneStatus.CHANGES_REQUESTED &&
        milestone.status !== MilestoneStatus.LATE
      ) {
        throw MilestoneNotInProgressException();
      }

      if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
        throw MilestoneNotFundedException();
      }

      const submission = await this.submissionRepository.createSubmission(
        milestoneId,
        userId,
        body,
      );

      await this.notificationService?.send({
        userId: contract.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Milestone submitted for review',
        message: `Freelancer submitted work for milestone "${milestone.title}". Please review the deliverables.`,
        data: {
          contractId,
          milestoneId,
          submissionId: submission.id,
          href: `/client/contracts/${contract.slug ?? contractId}`,
        },
      });

      return submission;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToSubmitException();
    }
  }

  async getSubmission(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
  ) {
    try {
      await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'participant',
      );

      return await this.submissionRepository.getSubmissionDetail(milestoneId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadSubmissionException();
    }
  }

  async getSubmissionDetail(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
    submissionId: number,
  ) {
    try {
      await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'participant',
      );

      const submission =
        await this.submissionRepository.getSubmission(submissionId);
      if (!submission || submission.milestoneId !== milestoneId) {
        throw SubmissionNotFoundException();
      }

      return submission;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadSubmissionException();
    }
  }

  async requestChanges(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
    submissionId: number,
    body: RequestChangesBodyType,
  ) {
    try {
      const { contract, milestone } = await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'client',
      );

      const submission =
        await this.submissionRepository.findSubmissionById(submissionId);
      if (!submission || submission.milestoneId !== milestoneId) {
        throw SubmissionNotFoundException();
      }

      if (milestone.status === MilestoneStatus.DISPUTED) {
        throw MilestoneNotInProgressException();
      }

      if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
        throw SubmissionNotPendingReviewException();
      }

      const result = await this.submissionRepository.requestChanges(
        submissionId,
        milestoneId,
        body,
      );

      await this.notificationService?.send({
        userId: contract.freelancerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Revisions requested on milestone',
        message: `Client requested revisions for milestone "${milestone.title}". Reason: ${body.changeRequestMessage}`,
        data: {
          contractId,
          milestoneId,
          submissionId,
          href: `/freelancer/contracts/${contract.slug ?? contractId}`,
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToRequestChangesException();
    }
  }

  async approveMilestone(
    userId: number,
    roleName: string,
    contractId: number,
    milestoneId: number,
    submissionId: number,
  ) {
    try {
      const { contract, milestone } = await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'client',
      );

      const submission =
        await this.submissionRepository.findSubmissionById(submissionId);
      if (!submission || submission.milestoneId !== milestoneId) {
        throw SubmissionNotFoundException();
      }

      if (milestone.status === MilestoneStatus.DISPUTED) {
        throw MilestoneNotInProgressException();
      }

      if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
        throw SubmissionNotPendingReviewException();
      }

      // Tự động giải ngân khoản ký quỹ của milestone cho Freelancer qua Stripe khi Client duyệt bài.
      // Nếu giải ngân gặp lỗi (ví dụ: freelancer chưa liên kết tài khoản Stripe Connect),
      // toàn bộ tiến trình sẽ dừng lại và báo lỗi để tránh tình trạng bài đã duyệt nhưng tiền bị kẹt.
      if (milestone.paymentStatus === MilestonePaymentStatus.FUNDED) {
        await this.paymentService.releaseMilestone(
          userId,
          contractId,
          milestoneId,
        );
      }

      const result = await this.submissionRepository.approveSubmission(
        submissionId,
        milestoneId,
      );

      await this.notificationService?.send({
        userId: contract.freelancerId,
        type: NotificationType.MILESTONE_COMPLETED,
        title: 'Milestone deliverables approved',
        message: `Client approved your deliverables for milestone "${milestone.title}".`,
        data: {
          contractId,
          milestoneId,
          submissionId,
          href: `/freelancer/contracts/${contract.slug ?? contractId}`,
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToApproveException();
    }
  }
}
