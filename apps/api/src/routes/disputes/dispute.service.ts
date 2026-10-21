import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
} from '@prisma/client';
import {
  AdminDisputeDecisionBodyType,
  AdminDisputeFinalDecisionBodyType,
  CreateDisputeBodyType,
  DEFAULT_ARBITRATION_FEE,
  FEE_DEADLINE_HOURS,
  GetDisputeListQueryType,
  PayDisputeFeeBodyType,
  RESPONSE_DEADLINE_HOURS,
  ReviewDisputeDecisionBodyType,
  RoleName,
  SubmitDisputeResponseBodyType,
} from '@shared/types';
import {
  DisputeAlreadyFinalizedException,
  DisputeDecisionNotPendingException,
  DisputeEvidenceLimitExceededException,
  DisputeFeeAlreadyPaidException,
  DisputeFeeNotFoundException,
  DisputeForbiddenException,
  DisputeInvalidSplitAmountException,
  DisputeMilestoneNotFoundException,
  DisputeNotContractParticipantException,
  DisputeNotFoundException,
  DisputeResponseAlreadySubmittedException,
  DisputeResponseNotAllowedException,
  DisputeReviewAlreadySubmittedException,
  DisputeReviewReasonRequiredException,
  FailedToCreateDisputeException,
  FailedToFinalizeDisputeException,
  FailedToLoadDisputeException,
  FailedToMakeDisputeDecisionException,
  FailedToPayDisputeFeeException,
  FailedToSubmitDisputeResponseException,
  FailedToSubmitDisputeReviewException,
  MilestoneAlreadyDisputedException,
  MilestoneCannotBeDisputedException,
} from './dispute.error';
import { DisputeRepository } from './dispute.repo';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(private readonly disputeRepo: DisputeRepository) { }

  /**
   * Tạo Dispute mới cho Milestone (chỉ Client hoặc Freelancer của hợp đồng).
   */
  async createDispute(userId: number, body: CreateDisputeBodyType) {
    try {
      const milestone = await this.disputeRepo.findMilestoneWithContract(
        body.milestoneId,
      );
      if (!milestone) {
        throw DisputeMilestoneNotFoundException();
      }

      const contract = milestone.contract;
      const isParticipant =
        contract.clientId === userId || contract.freelancerId === userId;
      if (!isParticipant) {
        throw DisputeNotContractParticipantException();
      }

      if (milestone.dispute) {
        throw MilestoneAlreadyDisputedException();
      }

      if (
        milestone.paymentStatus === MilestonePaymentStatus.RELEASED ||
        milestone.paymentStatus === MilestonePaymentStatus.REFUNDED ||
        milestone.status === MilestoneStatus.COMPLETED
      ) {
        throw MilestoneCannotBeDisputedException();
      }

      if (body.evidenceFiles && body.evidenceFiles.length > 5) {
        throw DisputeEvidenceLimitExceededException();
      }

      if (body.evidenceFiles && body.evidenceFiles.length > 0) {
        const fileIds = body.evidenceFiles
          .map((f) => f.fileId)
          .filter((id): id is number => typeof id === 'number');

        if (fileIds.length > 0) {
          const files = await this.disputeRepo.findSharedFilesByIds(
            fileIds,
            contract.id,
          );
          if (files.length !== fileIds.length) {
            throw DisputeForbiddenException();
          }
        }
      }

      const respondentId =
        userId === contract.clientId
          ? contract.freelancerId
          : contract.clientId;

      const feeDeadline = new Date(
        Date.now() + FEE_DEADLINE_HOURS * 60 * 60 * 1000,
      );
      const responseDeadline = new Date(
        Date.now() + RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000,
      );

      return await this.disputeRepo.createDisputeTransaction({
        milestoneId: body.milestoneId,
        openedById: userId,
        respondentId,
        reason: body.reason,
        description: body.description,
        arbitrationFee: DEFAULT_ARBITRATION_FEE,
        feeDeadline,
        responseDeadline,
        evidenceFiles: body.evidenceFiles,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create dispute', error);
      throw FailedToCreateDisputeException();
    }
  }

  /**
   * Thanh toán phí trọng tài (arbitration fee).
   */
  async payFee(userId: number, disputeId: number, body: PayDisputeFeeBodyType) {
    void body;
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      const fee = await this.disputeRepo.findFeeByDisputeAndUser(
        disputeId,
        userId,
      );
      if (!fee) {
        throw DisputeFeeNotFoundException();
      }

      if (fee.status === DisputeFeeStatus.PAID) {
        throw DisputeFeeAlreadyPaidException();
      }

      const paymentReference =
        body.paymentMethodId ?? `fee_ref_${disputeId}_${userId}`;
      const paidFee = await this.disputeRepo.updateFeeStatus(
        fee.id,
        DisputeFeeStatus.PAID,
        paymentReference,
        new Date(),
      );

      return {
        success: true,
        fee: paidFee,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to pay dispute fee', error);
      throw FailedToPayDisputeFeeException();
    }
  }

  /**
   * Respondent phản hồi và đính kèm bằng chứng (chỉ 1 lần duy nhất).
   */
  async submitResponse(
    userId: number,
    disputeId: number,
    body: SubmitDisputeResponseBodyType,
  ) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (dispute.respondentId !== userId) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeResponseNotAllowedException();
      }

      const hasSubmitted = await this.disputeRepo.hasUserSubmittedEvidence(
        disputeId,
        userId,
        'RESPONSE',
      );
      if (hasSubmitted) {
        throw DisputeResponseAlreadySubmittedException();
      }

      if (body.evidenceFiles && body.evidenceFiles.length > 5) {
        throw DisputeEvidenceLimitExceededException();
      }

      if (body.evidenceFiles && body.evidenceFiles.length > 0) {
        const fileIds = body.evidenceFiles
          .map((f) => f.fileId)
          .filter((id): id is number => typeof id === 'number');

        if (fileIds.length > 0) {
          const files = await this.disputeRepo.findSharedFilesByIds(
            fileIds,
            dispute.milestone.contract.id,
          );
          if (files.length !== fileIds.length) {
            throw DisputeForbiddenException();
          }
        }
      }

      return await this.disputeRepo.submitResponseTransaction(
        disputeId,
        userId,
        body.description,
        body.evidenceFiles,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to submit dispute response', error);
      throw FailedToSubmitDisputeResponseException();
    }
  }

  /**
   * Lấy chi tiết Dispute (Client, Freelancer của hợp đồng hoặc Admin).
   */
  async getDisputeDetail(userId: number, roleName: string, disputeId: number) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId ||
        dispute.respondentId === userId ||
        roleName === RoleName.ADMIN;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      // Tự động kiểm tra và đánh dấu fee OVERDUE nếu quá hạn 24h mà chưa thanh toán
      const now = new Date();
      for (const fee of dispute.fees) {
        if (
          fee.status === DisputeFeeStatus.PENDING &&
          fee.deadline &&
          now > fee.deadline
        ) {
          await this.disputeRepo.markFeeOverdue(fee.id);
          fee.status = DisputeFeeStatus.OVERDUE;
        }
      }

      return dispute;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute detail', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * Lấy chi tiết Dispute theo milestoneId (Client, Freelancer của hợp đồng hoặc Admin).
   */
  async getDisputeByMilestoneId(
    userId: number,
    roleName: string,
    milestoneId: number,
  ) {
    try {
      const dispute =
        await this.disputeRepo.findDisputeByMilestoneId(milestoneId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId ||
        dispute.respondentId === userId ||
        roleName === RoleName.ADMIN;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      const now = new Date();
      for (const fee of dispute.fees) {
        if (
          fee.status === DisputeFeeStatus.PENDING &&
          fee.deadline &&
          now > fee.deadline
        ) {
          await this.disputeRepo.markFeeOverdue(fee.id);
          fee.status = DisputeFeeStatus.OVERDUE;
        }
      }

      return dispute;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute by milestoneId', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * Danh sách Dispute của User (Freelancer / Client).
   */
  async listMyDisputes(userId: number, query: GetDisputeListQueryType) {
    try {
      return await this.disputeRepo.listDisputes(query, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list user disputes', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * Danh sách Dispute cho Admin (phân trang + lọc theo trạng thái).
   */
  async adminListDisputes(roleName: string, query: GetDisputeListQueryType) {
    try {
      if (roleName !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      return await this.disputeRepo.listDisputes(query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list disputes for admin', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * Admin đưa ra quyết định phân chia đầu tiên (DECISION_MADE).
   */
  async adminMakeDecision(
    adminId: number,
    roleName: string,
    disputeId: number,
    body: AdminDisputeDecisionBodyType,
  ) {
    try {
      if (roleName !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE &&
        dispute.status !== DisputeStatus.UNDER_REVIEW
      ) {
        throw DisputeDecisionNotPendingException();
      }

      const milestoneAmount = Number(dispute.milestone.amount);
      const totalDecided = Number(
        (body.freelancerAmount + body.clientAmount).toFixed(2),
      );
      if (totalDecided !== Number(milestoneAmount.toFixed(2))) {
        throw DisputeInvalidSplitAmountException();
      }

      const clientId = dispute.milestone.contract.clientId;
      const freelancerId = dispute.milestone.contract.freelancerId;

      return await this.disputeRepo.makeDecisionTransaction(
        disputeId,
        adminId,
        body.freelancerAmount,
        body.clientAmount,
        body.decisionReason,
        clientId,
        freelancerId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to make dispute decision', error);
      throw FailedToMakeDisputeDecisionException();
    }
  }

  /**
   * Hai bên ACCEPT hoặc REJECT quyết định đầu tiên.
   * Nếu REJECT -> REVIEW_REQUESTED.
   * Nếu cả 2 đều ACCEPT -> FINALIZED và phân bổ thanh toán giải quyết tranh chấp.
   */
  async submitDecisionReview(
    userId: number,
    disputeId: number,
    body: ReviewDisputeDecisionBodyType,
  ) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      if (dispute.status !== DisputeStatus.DECISION_MADE) {
        throw DisputeDecisionNotPendingException();
      }

      const reviews = await this.disputeRepo.findDecisionReviews(disputeId);
      const myReview = reviews.find((r) => r.userId === userId);

      if (myReview && myReview.response !== DisputeDecisionResponse.PENDING) {
        throw DisputeReviewAlreadySubmittedException();
      }

      if (
        body.response === DisputeDecisionResponse.REJECTED &&
        (!body.reason || body.reason.trim().length === 0)
      ) {
        throw DisputeReviewReasonRequiredException();
      }

      await this.disputeRepo.upsertDecisionReview(
        disputeId,
        userId,
        body.response as DisputeDecisionResponse,
        body.reason,
      );

      // Nếu từ chối: chuyển sang REVIEW_REQUESTED
      if (body.response === DisputeDecisionResponse.REJECTED) {
        return await this.disputeRepo.updateDisputeStatus(
          disputeId,
          DisputeStatus.REVIEW_REQUESTED,
        );
      }

      // Nếu chấp thuận: kiểm tra xem bên còn lại đã chấp thuận chưa
      const otherUserId =
        dispute.openedById === userId
          ? dispute.respondentId
          : dispute.openedById;
      const otherReview = reviews.find((r) => r.userId === otherUserId);

      if (
        otherReview &&
        otherReview.response === DisputeDecisionResponse.ACCEPTED
      ) {
        // Cả 2 bên đều ACCEPT -> Tự động Finalize và hoàn tất tranh chấp
        return await this.executeFinalization(
          dispute,
          Number(dispute.freelancerAmount),
          Number(dispute.clientAmount),
          dispute.decisionReason ?? 'Both parties accepted decision',
        );
      }

      return await this.disputeRepo.findDisputeById(disputeId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to submit dispute review', error);
      throw FailedToSubmitDisputeReviewException();
    }
  }

  /**
   * Admin đưa ra quyết định cuối cùng (FINALIZED) và hoàn tất giải quyết tranh chấp.
   */
  async adminFinalDecision(
    adminId: number,
    roleName: string,
    disputeId: number,
    body: AdminDisputeFinalDecisionBodyType,
  ) {
    try {
      if (roleName !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (dispute.status === DisputeStatus.FINALIZED) {
        throw DisputeAlreadyFinalizedException();
      }

      if (
        dispute.status !== DisputeStatus.REVIEW_REQUESTED &&
        dispute.status !== DisputeStatus.DECISION_MADE
      ) {
        throw DisputeDecisionNotPendingException();
      }

      const milestoneAmount = Number(dispute.milestone.amount);
      const totalDecided = Number(
        (body.freelancerAmount + body.clientAmount).toFixed(2),
      );
      if (totalDecided !== Number(milestoneAmount.toFixed(2))) {
        throw DisputeInvalidSplitAmountException();
      }

      return await this.executeFinalization(
        dispute,
        body.freelancerAmount,
        body.clientAmount,
        body.decisionReason,
        adminId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to make final dispute decision', error);
      throw FailedToFinalizeDisputeException();
    }
  }

  /**
   * Thực hiện phân phối số tiền giải quyết an toàn, idempotent và hoàn tất dispute.
   */
  private async executeFinalization(
    dispute: NonNullable<
      Awaited<ReturnType<DisputeRepository['findDisputeById']>>
    >,
    freelancerAmount: number,
    clientAmount: number,
    decisionReason: string,
    adminId?: number,
  ) {
    const milestoneAmount = Number(dispute.milestone.amount);

    // 1. Xác định trạng thái Milestone sau khi hòa giải
    let milestonePaymentStatus: MilestonePaymentStatus =
      MilestonePaymentStatus.RELEASED;
    if (clientAmount === milestoneAmount) {
      milestonePaymentStatus = MilestonePaymentStatus.REFUNDED;
    }

    // 2. Cập nhật Dispute và Milestone trong Transaction
    return await this.disputeRepo.finalizeDisputeTransaction({
      disputeId: dispute.id,
      milestoneId: dispute.milestoneId,
      adminId,
      freelancerAmount,
      clientAmount,
      decisionReason,
      finalDecisionAt: new Date(),
      milestoneStatus: MilestoneStatus.COMPLETED,
      milestonePaymentStatus,
    });
  }
}
