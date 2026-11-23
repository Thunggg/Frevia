import { HttpException, Injectable, Logger, Optional } from '@nestjs/common';
import {
  DisputeResolutionType,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  NotificationType,
} from '@prisma/client';
import {
  CreateDisputeBodyType,
  GetDisputeListQueryType,
  RESPONSE_DEADLINE_HOURS,
  RespondDisputeBodyType,
  getEffectiveContractDeadlineMs,
} from '@shared/types';
import { PaymentService } from '../../payments/payment.service';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import {
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
  DisputeWithdrawNotAllowedException,
  FailedToCreateDisputeException,
  FailedToEscalateDisputeException,
  FailedToLoadDisputeException,
  FailedToSubmitDisputeResponseException,
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
    @Optional() private readonly notificationService?: AppNotificationService,
  ) {}

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

      const created = await this.disputeRepo.createDisputeTransaction({
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

      if (created) {
        await this.notificationService?.send({
          userId: respondentId,
          type: NotificationType.DISPUTE_OPENED,
          title: 'Dispute opened on milestone',
          message: `A dispute has been opened for milestone "${milestone.title}". Reason: ${body.reason}. Please review the proposed split.`,
          data: {
            disputeId: created.id,
            milestoneId: body.milestoneId,
            contractId: contract.id,
            href:
              respondentId === contract.clientId
                ? `/client/contracts/${contract.slug ?? contract.id}`
                : `/freelancer/contracts/${contract.slug ?? contract.id}`,
          },
        });
      }

      return created;
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

        const result = await this.executeFinalization(
          dispute,
          freelancerAmount,
          clientAmount,
          'Mutual resolution accepted by counterparty.',
        );

        await this.notificationService?.send({
          userId: dispute.openedById,
          type: NotificationType.DISPUTE_OPENED,
          title: 'Dispute proposal accepted',
          message: `The proposed split for milestone "${dispute.milestone.title}" was accepted. Funds have been settled as agreed.`,
          data: {
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            contractId: dispute.milestone.contractId,
            href:
              dispute.openedById === dispute.milestone.contract.clientId
                ? `/client/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`
                : `/freelancer/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
          },
        });

        return result;
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

      const result = await this.disputeRepo.declineDisputeTransaction(
        disputeId,
        userId,
        body.reason.trim(),
        body.evidenceFiles,
      );

      await this.notificationService?.send({
        userId: dispute.openedById,
        type: NotificationType.DISPUTE_OPENED,
        title: 'Dispute proposal declined',
        message: `The proposed split for milestone "${dispute.milestone.title}" was declined. Reason: ${body.reason.trim()}. You can escalate the dispute to a Frevia Expert.`,
        data: {
          disputeId: dispute.id,
          milestoneId: dispute.milestoneId,
          contractId: dispute.milestone.contractId,
          href:
            dispute.openedById === dispute.milestone.contract.clientId
              ? `/client/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`
              : `/freelancer/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
        },
      });

      return result;
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

      const result = await this.disputeRepo.withdrawDisputeTransaction(
        disputeId,
        dispute.milestoneId,
        restoredStatus,
      );

      await this.notificationService?.send({
        userId: dispute.respondentId,
        type: NotificationType.DISPUTE_OPENED,
        title: 'Dispute withdrawn',
        message: `The dispute for milestone "${dispute.milestone.title}" has been withdrawn by the opener. Milestone status has been restored.`,
        data: {
          disputeId: dispute.id,
          milestoneId: dispute.milestoneId,
          contractId: dispute.milestone.contractId,
          href:
            dispute.respondentId === dispute.milestone.contract.clientId
              ? `/client/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`
              : `/freelancer/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
        },
      });

      return result;
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

      const result =
        await this.disputeRepo.escalateDisputeTransaction(disputeId);

      const otherPartyId =
        dispute.openedById === userId
          ? dispute.respondentId
          : dispute.openedById;

      await this.notificationService?.send({
        userId: otherPartyId,
        type: NotificationType.DISPUTE_OPENED,
        title: 'Dispute escalated to Expert',
        message: `The dispute for milestone "${dispute.milestone.title}" has been escalated to a Frevia Expert for binding arbitration.`,
        data: {
          disputeId: dispute.id,
          milestoneId: dispute.milestoneId,
          contractId: dispute.milestone.contractId,
          href:
            otherPartyId === dispute.milestone.contract.clientId
              ? `/client/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`
              : `/freelancer/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
        },
      });

      return result;
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
