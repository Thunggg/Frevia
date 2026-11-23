import { HttpException, Injectable, Logger, Optional } from '@nestjs/common';
import {
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  NotificationType,
} from '@prisma/client';
import {
  AdminDisputeDecisionBodyType,
  GetDisputeListQueryType,
  RoleName,
} from '@shared/types';
import { PaymentService } from '../../payments/payment.service';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import {
  ExpertDisputeAlreadyFinalizedException,
  ExpertDisputeDecisionNotPendingException,
  ExpertDisputeForbiddenException,
  ExpertDisputeInvalidSplitAmountException,
  ExpertDisputeNotFoundException,
  FailedToLoadExpertDisputeException,
  FailedToMakeExpertDisputeDecisionException,
} from './disputes-expert.error';
import { DisputesExpertRepository } from './disputes-expert.repo';

@Injectable()
export class DisputesExpertService {
  private readonly logger = new Logger(DisputesExpertService.name);

  constructor(
    private readonly expertDisputeRepo: DisputesExpertRepository,
    private readonly paymentService: PaymentService,
    @Optional() private readonly notificationService?: AppNotificationService,
  ) {}

  async requireActiveExpert(roleName: string, userId: number) {
    if (roleName !== RoleName.EXPERT) {
      throw ExpertDisputeForbiddenException();
    }
    if (!(await this.expertDisputeRepo.findActiveExpert(userId))) {
      throw ExpertDisputeForbiddenException();
    }
  }

  async listDisputes(
    userId: number,
    roleName: string,
    query: GetDisputeListQueryType,
  ) {
    try {
      await this.requireActiveExpert(roleName, userId);
      return await this.expertDisputeRepo.listDisputes(query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list disputes for expert', error);
      throw FailedToLoadExpertDisputeException();
    }
  }

  async getDisputeDetail(userId: number, roleName: string, disputeId: number) {
    try {
      await this.requireActiveExpert(roleName, userId);

      const dispute = await this.expertDisputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw ExpertDisputeNotFoundException();
      }

      const contract = dispute.milestone?.contract;
      const conversationMessages =
        contract &&
        typeof this.expertDisputeRepo.findConversationMessages === 'function'
          ? await this.expertDisputeRepo.findConversationMessages(
              contract.clientId,
              contract.freelancerId,
            )
          : [];

      return {
        ...dispute,
        conversationMessages,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute detail for expert', error);
      throw FailedToLoadExpertDisputeException();
    }
  }

  async makeDecision(
    expertId: number,
    roleName: string,
    disputeId: number,
    body: AdminDisputeDecisionBodyType,
  ) {
    try {
      await this.requireActiveExpert(roleName, expertId);

      const dispute = await this.expertDisputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw ExpertDisputeNotFoundException();
      }

      if (dispute.status === DisputeStatus.FINALIZED) {
        throw ExpertDisputeAlreadyFinalizedException();
      }

      if (
        dispute.status !== DisputeStatus.UNDER_REVIEW &&
        dispute.status !== DisputeStatus.DECISION_MADE &&
        dispute.status !== DisputeStatus.REVIEW_REQUESTED
      ) {
        throw ExpertDisputeDecisionNotPendingException();
      }

      const milestoneAmount = Number(dispute.milestone.amount);
      const totalDecided = Number(
        (body.freelancerAmount + body.clientAmount).toFixed(2),
      );
      if (totalDecided !== Number(milestoneAmount.toFixed(2))) {
        throw ExpertDisputeInvalidSplitAmountException();
      }

      // Phán quyết của Expert có tính cưỡng chế và tự động tất toán ký quỹ ngay lập tức
      await this.paymentService.executeDisputeSettlementPayout({
        disputeId: dispute.id,
        contractId: dispute.milestone.contractId,
        milestoneId: dispute.milestoneId,
        freelancerId: dispute.milestone.contract.freelancerId,
        clientId: dispute.milestone.contract.clientId,
        freelancerAmount: body.freelancerAmount,
        clientAmount: body.clientAmount,
      });

      const milestonePaymentStatus: MilestonePaymentStatus =
        body.clientAmount === milestoneAmount
          ? MilestonePaymentStatus.REFUNDED
          : MilestonePaymentStatus.RELEASED;

      const finalized = await this.expertDisputeRepo.finalizeDisputeTransaction(
        {
          disputeId: dispute.id,
          milestoneId: dispute.milestoneId,
          expertId,
          freelancerAmount: body.freelancerAmount,
          clientAmount: body.clientAmount,
          decisionReason: body.decisionReason,
          finalDecisionAt: new Date(),
          milestoneStatus: MilestoneStatus.COMPLETED,
          milestonePaymentStatus,
        },
      );

      await this.notificationService?.sendMany([
        {
          userId: dispute.milestone.contract.clientId,
          type: NotificationType.DISPUTE_OPENED,
          title: 'Dispute resolved by Frevia Expert',
          message: `Frevia Expert resolved the dispute for milestone "${dispute.milestone.title}". Final split: $${body.clientAmount} refunded to Client, $${body.freelancerAmount} released to Freelancer.`,
          data: {
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            contractId: dispute.milestone.contractId,
            href: `/client/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
          },
        },
        {
          userId: dispute.milestone.contract.freelancerId,
          type: NotificationType.DISPUTE_OPENED,
          title: 'Dispute resolved by Frevia Expert',
          message: `Frevia Expert resolved the dispute for milestone "${dispute.milestone.title}". Final split: $${body.clientAmount} refunded to Client, $${body.freelancerAmount} released to Freelancer.`,
          data: {
            disputeId: dispute.id,
            milestoneId: dispute.milestoneId,
            contractId: dispute.milestone.contractId,
            href: `/freelancer/contracts/${dispute.milestone.contract.slug ?? dispute.milestone.contractId}`,
          },
        },
      ]);

      return finalized;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to make expert dispute decision', error);
      throw FailedToMakeExpertDisputeDecisionException();
    }
  }
}
