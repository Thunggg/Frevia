import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeResolutionType,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
} from '@prisma/client';
import {
  CreateDisputeBodyType,
  GetDisputeListQueryType,
  GetResolutionReasonsResponseType,
  RESPONSE_DEADLINE_HOURS,
  RespondDisputeBodyType,
  ReviewDisputeDecisionBodyType,
  getEffectiveContractDeadlineMs,
} from '@shared/types';
import { PaymentService } from '../../payments/payment.service';
import {
  DisputeDecisionNotPendingException,
  DisputeDeclineReasonRequiredException,
  DisputeEscalateNotAllowedException,
  DisputeEvidenceLimitExceededException,
  DisputeForbiddenException,
  DisputeInvalidDueDateException,
  DisputeInvalidSplitAmountException,
  DisputeMilestoneNotFoundException,
  DisputeNotContractParticipantException,
  DisputeNotFoundException,
  DisputeResponseAlreadySubmittedException,
  DisputeResponseNotAllowedException,
  DisputeReviewAlreadySubmittedException,
  DisputeReviewReasonRequiredException,
  DisputeWithdrawNotAllowedException,
  FailedToCreateDisputeException,
  FailedToEscalateDisputeException,
  FailedToLoadDisputeException,
  FailedToSubmitDisputeResponseException,
  FailedToSubmitDisputeReviewException,
  FailedToWithdrawDisputeException,
  MilestoneAlreadyDisputedException,
  MilestoneCannotBeDisputedException,
} from './dispute.error';
import { DisputeRepository } from './dispute.repo';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly disputeRepo: DisputeRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async getResolutionReasons(
    userId: number,
    milestoneId: number,
  ): Promise<GetResolutionReasonsResponseType> {
    try {
      const milestone =
        await this.disputeRepo.findMilestoneWithContract(milestoneId);
      if (!milestone) {
        throw DisputeMilestoneNotFoundException();
      }

      const contract = milestone.contract;
      const isClient = contract.clientId === userId;
      const isFreelancer = contract.freelancerId === userId;
      if (!isClient && !isFreelancer) {
        throw DisputeNotContractParticipantException();
      }

      const role: 'CLIENT' | 'FREELANCER' = isClient ? 'CLIENT' : 'FREELANCER';

      const reasons: GetResolutionReasonsResponseType['reasons'] = isClient
        ? [
            {
              code: 'QUALITY_NOT_AS_DESCRIBED',
              label: 'Deliverable does not match agreed requirements',
              description:
                'The submitted work is incomplete or does not meet the milestone specifications.',
              allowedResolutionTypes: [
                'PARTIAL_REFUND',
                'FULL_REFUND',
                'EXTEND_DEADLINE',
              ],
            },
            {
              code: 'MISSED_DEADLINE',
              label: 'Missed deadline or unresponsive freelancer',
              description:
                'Delivery is overdue or the freelancer is no longer responding to messages.',
              allowedResolutionTypes: [
                'FULL_REFUND',
                'EXTEND_DEADLINE',
                'PARTIAL_REFUND',
              ],
            },
            {
              code: 'EXTEND_DELIVERY',
              label: 'Offer a deadline extension',
              description:
                'Grant additional time for the freelancer to complete this milestone.',
              allowedResolutionTypes: ['EXTEND_DEADLINE'],
            },
            {
              code: 'MUTUAL_CANCELLATION',
              label: 'Mutual cancellation / project scope changed',
              description:
                'Request to cancel this milestone and settle the escrowed funds.',
              allowedResolutionTypes: ['FULL_REFUND', 'PARTIAL_REFUND'],
            },
          ]
        : [
            {
              code: 'NEED_MORE_TIME',
              label: 'Request a delivery deadline extension',
              description:
                'Propose a new milestone due date for the client to approve.',
              allowedResolutionTypes: ['EXTEND_DEADLINE'],
            },
            {
              code: 'SCOPE_CREEP',
              label: 'Client requested work outside original scope',
              description:
                'Additional requirements were requested beyond the agreed milestone terms.',
              allowedResolutionTypes: [
                'PARTIAL_REFUND',
                'FULL_RELEASE',
                'EXTEND_DEADLINE',
              ],
            },
            {
              code: 'CLIENT_UNRESPONSIVE',
              label: 'Client is unresponsive or delaying approval',
              description:
                'Work has been delivered but the client has stopped responding.',
              allowedResolutionTypes: ['FULL_RELEASE', 'PARTIAL_REFUND'],
            },
            {
              code: 'MUTUAL_CANCELLATION',
              label: 'Unable to complete milestone (mutual cancellation)',
              description:
                'Agree to cancel this milestone and return escrowed funds to the client.',
              allowedResolutionTypes: ['FULL_REFUND', 'PARTIAL_REFUND'],
            },
          ];

      return {
        role,
        milestoneStatus: milestone.status,
        milestoneAmount: Number(milestone.amount),
        milestoneDueDate: milestone.dueDate ?? null,
        reasons,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load resolution reasons', error);
      throw FailedToLoadDisputeException();
    }
  }

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

      const existingDispute = milestone.dispute;
      const canReplacePreviousDispute = Boolean(
        existingDispute &&
        (existingDispute.status === DisputeStatus.CANCELLED ||
          (existingDispute.status === DisputeStatus.FINALIZED &&
            existingDispute.resolutionType ===
              DisputeResolutionType.EXTEND_DEADLINE)),
      );
      if (existingDispute && !canReplacePreviousDispute) {
        throw MilestoneAlreadyDisputedException();
      }

      if (
        milestone.paymentStatus !== MilestonePaymentStatus.FUNDED ||
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

      const milestoneAmount = Number(milestone.amount);
      const resolutionType =
        (body.resolutionType as DisputeResolutionType) ??
        DisputeResolutionType.FULL_REFUND;

      let proposedFreelancerAmount: number | null = null;
      let proposedClientAmount: number | null = null;
      let proposedDueDate: Date | null = null;

      if (resolutionType === DisputeResolutionType.EXTEND_DEADLINE) {
        if (!body.proposedDueDate) {
          throw DisputeInvalidDueDateException();
        }
        const parsedDate = new Date(body.proposedDueDate);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
          throw DisputeInvalidDueDateException();
        }
        if (contract.expiresAt) {
          const contractEndMs = getEffectiveContractDeadlineMs(
            contract.expiresAt,
          );
          if (parsedDate.getTime() > contractEndMs) {
            throw DisputeInvalidDueDateException(
              'Proposed due date cannot exceed the contract end date.',
            );
          }
        }
        proposedDueDate = parsedDate;
      } else if (resolutionType === DisputeResolutionType.PARTIAL_REFUND) {
        const flAmt = Number(body.proposedFreelancerAmount ?? -1);
        const clAmt = Number(body.proposedClientAmount ?? -1);
        const total = Number((flAmt + clAmt).toFixed(2));
        if (
          flAmt < 0 ||
          clAmt < 0 ||
          total !== Number(milestoneAmount.toFixed(2))
        ) {
          throw DisputeInvalidSplitAmountException();
        }
        proposedFreelancerAmount = flAmt;
        proposedClientAmount = clAmt;
      } else if (resolutionType === DisputeResolutionType.FULL_REFUND) {
        proposedFreelancerAmount = 0;
        proposedClientAmount = milestoneAmount;
      } else if (resolutionType === DisputeResolutionType.FULL_RELEASE) {
        proposedFreelancerAmount = milestoneAmount;
        proposedClientAmount = 0;
      }

      const respondentId =
        userId === contract.clientId
          ? contract.freelancerId
          : contract.clientId;

      const responseDeadline = new Date(
        Date.now() + RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000,
      );

      return await this.disputeRepo.createDisputeTransaction({
        milestoneId: body.milestoneId,
        openedById: userId,
        respondentId,
        reason: body.reason,
        description: body.description,
        resolutionType,
        proposedFreelancerAmount,
        proposedClientAmount,
        proposedDueDate,
        previousMilestoneStatus: milestone.status,
        responseDeadline,
        evidenceFiles: body.evidenceFiles,
        replaceCancelledDisputeId:
          canReplacePreviousDispute && existingDispute
            ? existingDispute.id
            : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create dispute', error);
      throw FailedToCreateDisputeException();
    }
  }

  async respondToDispute(
    userId: number,
    disputeId: number,
    body: RespondDisputeBodyType,
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

      if (dispute.declinedAt) {
        throw DisputeResponseAlreadySubmittedException();
      }

      if (body.action === 'ACCEPT') {
        const resolutionType =
          dispute.resolutionType ?? DisputeResolutionType.FULL_REFUND;

        if (resolutionType === DisputeResolutionType.EXTEND_DEADLINE) {
          if (!dispute.proposedDueDate) {
            throw DisputeInvalidDueDateException();
          }
          const restoredStatus =
            dispute.previousMilestoneStatus === MilestoneStatus.LATE ||
            !dispute.previousMilestoneStatus ||
            dispute.previousMilestoneStatus === MilestoneStatus.DISPUTED
              ? MilestoneStatus.IN_PROGRESS
              : dispute.previousMilestoneStatus;

          return await this.disputeRepo.acceptExtendDeadlineTransaction({
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            proposedDueDate: dispute.proposedDueDate,
            restoredStatus,
            decisionReason:
              'Mutual agreement: milestone delivery deadline extended.',
          });
        }

        const milestoneAmount = Number(dispute.milestone.amount);
        let freelancerAmount = Number(dispute.proposedFreelancerAmount ?? 0);
        let clientAmount = Number(dispute.proposedClientAmount ?? 0);

        if (
          Number((freelancerAmount + clientAmount).toFixed(2)) !==
          Number(milestoneAmount.toFixed(2))
        ) {
          if (resolutionType === DisputeResolutionType.FULL_RELEASE) {
            freelancerAmount = milestoneAmount;
            clientAmount = 0;
          } else {
            freelancerAmount = 0;
            clientAmount = milestoneAmount;
          }
        }

        return await this.executeFinalization(
          dispute,
          freelancerAmount,
          clientAmount,
          'Mutual resolution accepted by counterparty.',
        );
      }

      if (!body.reason || body.reason.trim().length < 5) {
        throw DisputeDeclineReasonRequiredException();
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

      return await this.disputeRepo.declineDisputeTransaction(
        disputeId,
        userId,
        body.reason.trim(),
        body.evidenceFiles,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to respond to dispute', error);
      throw FailedToSubmitDisputeResponseException();
    }
  }

  async withdrawDispute(userId: number, disputeId: number) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (dispute.openedById !== userId) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeWithdrawNotAllowedException();
      }

      const restoredStatus =
        !dispute.previousMilestoneStatus ||
        dispute.previousMilestoneStatus === MilestoneStatus.DISPUTED
          ? MilestoneStatus.IN_PROGRESS
          : dispute.previousMilestoneStatus;

      return await this.disputeRepo.withdrawDisputeTransaction(
        disputeId,
        dispute.milestoneId,
        restoredStatus,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to withdraw dispute', error);
      throw FailedToWithdrawDisputeException();
    }
  }

  async escalateDispute(userId: number, disputeId: number) {
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

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeEscalateNotAllowedException();
      }

      const isDeclined = Boolean(dispute.declinedAt);
      const isExpired = Boolean(
        dispute.responseDeadline &&
        new Date(dispute.responseDeadline).getTime() <= Date.now(),
      );

      if (!isDeclined && !isExpired) {
        throw DisputeEscalateNotAllowedException();
      }

      return await this.disputeRepo.escalateDisputeTransaction(disputeId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to escalate dispute', error);
      throw FailedToEscalateDisputeException();
    }
  }

  async getDisputeDetail(userId: number, disputeId: number) {
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

      return dispute;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute detail', error);
      throw FailedToLoadDisputeException();
    }
  }

  async getDisputeByMilestoneId(userId: number, milestoneId: number) {
    try {
      const dispute =
        await this.disputeRepo.findDisputeByMilestoneId(milestoneId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      return dispute;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute by milestoneId', error);
      throw FailedToLoadDisputeException();
    }
  }

  async listMyDisputes(userId: number, query: GetDisputeListQueryType) {
    try {
      return await this.disputeRepo.listDisputes(query, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list user disputes', error);
      throw FailedToLoadDisputeException();
    }
  }

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

      if (body.response === DisputeDecisionResponse.REJECTED) {
        return await this.disputeRepo.updateDisputeStatus(
          disputeId,
          DisputeStatus.REVIEW_REQUESTED,
        );
      }

      const otherUserId =
        dispute.openedById === userId
          ? dispute.respondentId
          : dispute.openedById;
      // Đọc lại danh sách review SAU khi upsert để tránh race condition khi 2 bên bấm Chấp nhận đồng thời
      const latestReviews =
        await this.disputeRepo.findDecisionReviews(disputeId);
      const otherReview = latestReviews.find((r) => r.userId === otherUserId);

      if (
        otherReview &&
        otherReview.response === DisputeDecisionResponse.ACCEPTED
      ) {
        const freshDispute = await this.disputeRepo.findDisputeById(disputeId);
        if (
          freshDispute &&
          freshDispute.status === DisputeStatus.DECISION_MADE
        ) {
          return await this.executeFinalization(
            freshDispute,
            Number(freshDispute.freelancerAmount),
            Number(freshDispute.clientAmount),
            freshDispute.decisionReason ?? 'Both parties accepted decision',
          );
        }
        return freshDispute;
      }

      return await this.disputeRepo.findDisputeById(disputeId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to submit dispute review', error);
      throw FailedToSubmitDisputeReviewException();
    }
  }

  private async executeFinalization(
    dispute: NonNullable<
      Awaited<ReturnType<DisputeRepository['findDisputeById']>>
    >,
    freelancerAmount: number,
    clientAmount: number,
    decisionReason: string,
  ) {
    const milestoneAmount = Number(dispute.milestone.amount);

    await this.paymentService.executeDisputeSettlementPayout({
      disputeId: dispute.id,
      contractId: dispute.milestone.contractId,
      milestoneId: dispute.milestoneId,
      freelancerId: dispute.milestone.contract.freelancerId,
      clientId: dispute.milestone.contract.clientId,
      freelancerAmount,
      clientAmount,
    });

    const milestonePaymentStatus: MilestonePaymentStatus =
      clientAmount === milestoneAmount
        ? MilestonePaymentStatus.REFUNDED
        : MilestonePaymentStatus.RELEASED;

    return await this.disputeRepo.finalizeDisputeTransaction({
      disputeId: dispute.id,
      milestoneId: dispute.milestoneId,
      freelancerAmount,
      clientAmount,
      decisionReason,
      finalDecisionAt: new Date(),
      milestoneStatus: MilestoneStatus.COMPLETED,
      milestonePaymentStatus,
    });
  }
}
