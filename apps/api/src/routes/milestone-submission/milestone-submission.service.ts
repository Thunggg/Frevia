import { HttpException, Injectable } from '@nestjs/common';
import {
  MilestonePaymentStatus,
  MilestoneStatus,
  SubmissionStatus,
} from '@prisma/client';
import {
  RequestChangesBodyType,
  RoleName,
  SubmitMilestoneBodyType,
} from '@shared/types';
import { MilestoneSubmissionRepository } from './milestone-submission.repo';
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
    const isAdmin = roleName === RoleName.ADMIN;

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
      const { milestone } = await this.resolveAndGuardContext(
        userId,
        roleName,
        contractId,
        milestoneId,
        'freelancer',
      );

      if (
        milestone.status !== MilestoneStatus.IN_PROGRESS &&
        milestone.status !== MilestoneStatus.CHANGES_REQUESTED
      ) {
        throw MilestoneNotInProgressException();
      }

      if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
        throw MilestoneNotFundedException();
      }

      return await this.submissionRepository.createSubmission(
        milestoneId,
        userId,
        body,
      );
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
      await this.resolveAndGuardContext(
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

      if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
        throw SubmissionNotPendingReviewException();
      }

      return await this.submissionRepository.requestChanges(
        submissionId,
        milestoneId,
        body,
      );
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
      await this.resolveAndGuardContext(
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

      if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
        throw SubmissionNotPendingReviewException();
      }

      return await this.submissionRepository.approveSubmission(
        submissionId,
        milestoneId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToApproveException();
    }
  }
}
