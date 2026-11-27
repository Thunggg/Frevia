import {
  HttpException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import {
  CreateContractBodyType,
  GetContractListQueryType,
  RoleName,
  UpdateContractBodyType,
  getEffectiveContractDeadlineMs,
} from '@shared/types';
import { ContractRepository } from './contract.repo';
import {
  AlreadySignedException,
  ClientMustSignFirstException,
  ContractAlreadyCancelledException,
  ContractAlreadyCompletedException,
  ContractAlreadyExistsException,
  ContractAwaitingPaymentException,
  ContractDisputedException,
  ContractExpiredException,
  ContractExpiresAtBeforeMilestonesException,
  ContractExpiresAtRequiredException,
  ContractForbiddenException,
  ContractHasUnsettledMilestonesException,
  ContractNotActionableForRejectionException,
  ContractNotActiveException,
  ContractNotFoundException,
  ContractNotPendingSignException,
  FailedToCreateContractException,
  FailedToLoadContractException,
  FailedToUpdateContractException,
  FreelancerStripeOnboardingRequiredException,
  MilestoneAmountMismatchException,
  MilestoneDueDateExceedsContractException,
  MilestoneDueDateRequiredException,
  ProposalJobPositionsFilledException,
  ProposalNotActionableException,
  ProposalNotFoundException,
} from './contract.error';
import {
  ContractStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { ContractPdfService } from '../../shared/services/contract-pdf.service';
import { PaymentService } from '../payments/payment.service';
import { AppNotificationService } from '../../shared/services/app-notification.service';

const ALLOWED_PROPOSAL_STATUSES = ['SUBMITTED', 'HIRED'];

@Injectable()
export class ContractService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContractService.name);
  private expiryTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly contractPdfService: ContractPdfService,
    private readonly paymentService: PaymentService,
    @Optional() private readonly notificationService?: AppNotificationService,
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(
      () => {
        void this.expireOverdueContracts();
      },
      5 * 60 * 1000,
    );
    this.expiryTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private async handleContractExpiry(contract: {
    id: number;
    holdPaymentIntentId?: string | null;
  }) {
    if (contract.holdPaymentIntentId) {
      try {
        await this.paymentService.cancelContractHold(
          contract.holdPaymentIntentId,
          'Contract expired before both parties signed',
        );
      } catch (err) {
        this.logger.warn(
          `Failed to cancel hold ${contract.holdPaymentIntentId} on contract #${contract.id} expiry: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    return this.contractRepository.expireContract(contract.id);
  }

  async expireOverdueContracts() {
    try {
      const overdueContracts =
        await this.contractRepository.findExpiredPendingContracts(new Date());
      for (const item of overdueContracts) {
        await this.handleContractExpiry(item);
      }
    } catch (err) {
      this.logger.error('Failed to expire overdue contracts:', err);
    }
  }

  async createContract(clientId: number, body: CreateContractBodyType) {
    try {
      const proposal = await this.contractRepository.findProposalWithJob(
        body.proposalId,
      );

      if (!proposal) throw ProposalNotFoundException();

      // Cho phép lập hợp đồng khi proposal ở trạng thái SUBMITTED hoặc HIRED
      if (!ALLOWED_PROPOSAL_STATUSES.includes(proposal.status)) {
        throw ProposalNotActionableException();
      }

      if (proposal.job.clientId !== clientId) {
        throw ContractForbiddenException();
      }

      // Kiểm tra xem số lượng vị trí tuyển đã đủ chưa
      if (proposal.job.positionsFilled >= proposal.job.positionsRequired) {
        throw ProposalJobPositionsFilledException();
      }

      if (!body.expiresAt) {
        throw ContractExpiresAtRequiredException();
      }

      const contractEndMs = getEffectiveContractDeadlineMs(body.expiresAt);

      // Nếu có danh sách milestone, kiểm tra ngày hạn milestone và tổng tiền
      if (body.milestones && body.milestones.length > 0) {
        for (const m of body.milestones) {
          if (!m.dueDate) {
            throw MilestoneDueDateRequiredException();
          }
          if (new Date(m.dueDate).getTime() > contractEndMs) {
            throw MilestoneDueDateExceedsContractException();
          }
        }

        const milestonesTotal = body.milestones.reduce(
          (sum, m) => sum + Number(m.amount),
          0,
        );
        if (Math.abs(milestonesTotal - Number(body.totalAmount)) > 0.01) {
          throw MilestoneAmountMismatchException();
        }
      }

      const existing = await this.contractRepository.findContractByProposalId(
        body.proposalId,
      );
      if (existing) throw ContractAlreadyExistsException();

      return await this.contractRepository.createContract(
        body,
        clientId,
        proposal.freelancerId,
        proposal.job.id,
      );
    } catch (error) {
      this.logger.error('Failed to create contract:', error);
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw ContractAlreadyExistsException();
      throw FailedToCreateContractException();
    }
  }

  async updateContract(
    clientId: number,
    contractId: number,
    body: UpdateContractBodyType,
  ) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();
      if (contract.clientId !== clientId) throw ContractForbiddenException();
      if (
        contract.status !== ContractStatus.PENDING_SIGN &&
        contract.status !== ContractStatus.AWAITING_PAYMENT
      )
        throw ContractNotPendingSignException();

      if (
        contract.holdPaymentIntentId &&
        body.totalAmount !== undefined &&
        Number(body.totalAmount) !== Number(contract.totalAmount)
      ) {
        throw ContractNotPendingSignException();
      }

      if (body.expiresAt !== undefined) {
        const nextEndMs = getEffectiveContractDeadlineMs(body.expiresAt);
        const milestoneDueDates =
          await this.contractRepository.findContractMilestoneDueDates(
            contractId,
          );
        const hasExceedingMilestone = milestoneDueDates.some(
          (m) => m.dueDate && new Date(m.dueDate).getTime() > nextEndMs,
        );
        if (hasExceedingMilestone) {
          throw ContractExpiresAtBeforeMilestonesException();
        }
      }

      return await this.contractRepository.updateContract(contractId, body);
    } catch (error) {
      this.logger.error(`Failed to update contract #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async signContract(userId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      const isClient = contract.clientId === userId;
      const isFreelancer = contract.freelancerId === userId;
      if (!isClient && !isFreelancer) throw ContractForbiddenException();

      if (contract.status === ContractStatus.AWAITING_PAYMENT) {
        if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
          await this.handleContractExpiry(contract);
          throw ContractExpiredException();
        }
        throw ContractAwaitingPaymentException();
      }

      if (contract.status !== ContractStatus.PENDING_SIGN) {
        throw ContractNotPendingSignException();
      }

      if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
        await this.handleContractExpiry(contract);
        throw ContractExpiredException();
      }

      if (isClient && contract.signedByClient) throw AlreadySignedException();
      if (isFreelancer && contract.signedByFreelancer)
        throw AlreadySignedException();

      if (isFreelancer && !contract.signedByClient) {
        throw ClientMustSignFirstException();
      }

      if (isFreelancer) {
        const connectStatus =
          await this.paymentService.getConnectStatus(userId);
        if (
          !connectStatus.isConnected ||
          !connectStatus.stripeAccountId ||
          !connectStatus.payoutsEnabled
        ) {
          throw FreelancerStripeOnboardingRequiredException();
        }

        if (!contract.holdPaymentIntentId) {
          throw ContractAwaitingPaymentException();
        }
        await this.paymentService.captureContractHold(
          contract.holdPaymentIntentId,
        );
      }

      const role = isClient ? 'client' : 'freelancer';
      const signed = await this.contractRepository.signContract(
        contractId,
        role,
      );

      if (
        signed.status === ContractStatus.ACTIVE ||
        signed.signedByClient ||
        signed.signedByFreelancer
      ) {
        try {
          await this.contractPdfService.generateAndSaveContractPdf(contractId);
        } catch (pdfErr) {
          this.logger.error(
            `Failed to generate contract PDF for contract #${contractId}:`,
            pdfErr,
          );
        }
      }

      if (signed.status === ContractStatus.ACTIVE) {
        await this.notificationService?.sendMany([
          {
            userId: contract.clientId,
            type: NotificationType.CONTRACT_CREATED,
            title: 'Contract activated',
            message: `Contract #${contractId} is now active. Work can begin!`,
            data: {
              contractId,
              contractSlug: contract.slug,
              href: `/client/contracts/${contract.slug ?? contractId}`,
            },
          },
          {
            userId: contract.freelancerId,
            type: NotificationType.CONTRACT_CREATED,
            title: 'Contract activated',
            message: `Contract #${contractId} is now active. Work can begin!`,
            data: {
              contractId,
              contractSlug: contract.slug,
              href: `/freelancer/contracts/${contract.slug ?? contractId}`,
            },
          },
        ]);
      } else if (isClient) {
        await this.notificationService?.send({
          userId: contract.freelancerId,
          type: NotificationType.CONTRACT_CREATED,
          title: 'Contract signed by client',
          message: `The client has signed contract #${contractId}. Please review and sign to activate the contract.`,
          data: {
            contractId,
            contractSlug: contract.slug,
            href: `/freelancer/contracts/${contract.slug ?? contractId}`,
          },
        });
      }

      return signed;
    } catch (error) {
      this.logger.error(`Failed to sign contract #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async rejectContract(userId: number, contractId: number, reason?: string) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      const isFreelancer = contract.freelancerId === userId;
      if (!isFreelancer) throw ContractForbiddenException();

      if (
        contract.status !== ContractStatus.PENDING_SIGN &&
        contract.status !== ContractStatus.AWAITING_PAYMENT
      ) {
        throw ContractNotActionableForRejectionException();
      }

      if (contract.holdPaymentIntentId) {
        try {
          await this.paymentService.cancelContractHold(
            contract.holdPaymentIntentId,
            reason || 'Freelancer declined contract offer',
          );
        } catch (cancelErr) {
          this.logger.error(
            `Failed to cancel hold intent ${contract.holdPaymentIntentId} on reject for contract #${contractId}:`,
            cancelErr,
          );
        }
      }

      const rejected = await this.contractRepository.rejectContract(
        contractId,
        reason,
      );

      // Fallback hoàn tiền nếu có khoản escrow đã từng được capture trước đó
      try {
        await this.paymentService.refundContractEscrow(contractId);
      } catch (refundErr) {
        this.logger.error(
          `Failed to auto-refund deposit on contract reject for #${contractId}:`,
          refundErr,
        );
      }

      return rejected;
    } catch (error) {
      this.logger.error(`Failed to reject contract #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async completeContract(clientId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      if (contract.clientId !== clientId) throw ContractForbiddenException();

      if (contract.status === ContractStatus.COMPLETED)
        throw ContractAlreadyCompletedException();

      if (contract.status !== ContractStatus.ACTIVE)
        throw ContractNotActiveException();

      const milestones =
        await this.contractRepository.findContractMilestonesWithStatus(
          contractId,
        );

      if (milestones.length === 0) {
        throw ContractHasUnsettledMilestonesException();
      }

      const hasUnsettled = milestones.some(
        (m) =>
          m.paymentStatus !== MilestonePaymentStatus.RELEASED &&
          m.paymentStatus !== MilestonePaymentStatus.REFUNDED,
      );

      if (hasUnsettled) {
        throw ContractHasUnsettledMilestonesException();
      }

      const hasReleased = milestones.some(
        (m) => m.paymentStatus === MilestonePaymentStatus.RELEASED,
      );

      if (!hasReleased) {
        throw ContractHasUnsettledMilestonesException();
      }

      const completed = await this.contractRepository.completeContract(
        contractId,
        contract.jobId,
      );

      await this.notificationService?.send({
        userId: contract.freelancerId,
        type: NotificationType.MILESTONE_COMPLETED,
        title: 'Contract completed',
        message: `The client has marked contract #${contractId} as completed.`,
        data: {
          contractId,
          contractSlug: contract.slug,
          href: `/freelancer/contracts/${contract.slug ?? contractId}`,
        },
      });

      return completed;
    } catch (error) {
      this.logger.error(`Failed to complete contract #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async cancelContract(userId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      if (contract.clientId !== userId && contract.freelancerId !== userId)
        throw ContractForbiddenException();
      if (contract.status === ContractStatus.CANCELLED)
        throw ContractAlreadyCancelledException();
      if (contract.status === ContractStatus.COMPLETED)
        throw ContractAlreadyCompletedException();
      if (
        contract.status === ContractStatus.REJECTED ||
        contract.status === ContractStatus.EXPIRED
      ) {
        throw ContractForbiddenException();
      }
      if (contract.status === ContractStatus.DISPUTED) {
        throw ContractDisputedException();
      }

      // Freelancer chỉ được phép cancel khi hợp đồng đã ACTIVE.
      // Khi ở trạng thái PENDING_SIGN hoặc AWAITING_PAYMENT, freelancer phải dùng rejectContract (từ chối offer).
      if (
        contract.freelancerId === userId &&
        contract.status !== ContractStatus.ACTIVE
      ) {
        throw ContractForbiddenException();
      }

      if (
        contract.holdPaymentIntentId &&
        contract.status !== ContractStatus.ACTIVE
      ) {
        try {
          await this.paymentService.cancelContractHold(
            contract.holdPaymentIntentId,
            'Contract cancelled prior to capture',
          );
        } catch (cancelErr) {
          this.logger.error(
            `Failed to cancel hold intent ${contract.holdPaymentIntentId} on cancel for contract #${contractId}:`,
            cancelErr,
          );
        }
      }

      if (contract.status === ContractStatus.ACTIVE) {
        const milestones =
          await this.contractRepository.findContractMilestonesWithStatus(
            contractId,
          );

        const hasDisputedMilestone = milestones.some(
          (m) => m.status === MilestoneStatus.DISPUTED,
        );
        if (hasDisputedMilestone) {
          throw ContractDisputedException();
        }

        const isClient = contract.clientId === userId;
        const cancelledByRole: 'client' | 'freelancer' = isClient
          ? 'client'
          : 'freelancer';

        try {
          await this.paymentService.settleContractEscrowOnCancel(
            contractId,
            cancelledByRole,
          );
        } catch (refundErr) {
          this.logger.error(
            `Failed to settle escrow on cancel for contract #${contractId}:`,
            refundErr,
          );
        }
      }

      const cancelled =
        await this.contractRepository.cancelContract(contractId);

      const isClient = contract.clientId === userId;
      const targetUserId = isClient ? contract.freelancerId : contract.clientId;
      await this.notificationService?.send({
        userId: targetUserId,
        type: NotificationType.JOB_ALERT,
        title: 'Contract cancelled',
        message: `Contract #${contractId} has been cancelled by the ${isClient ? 'client' : 'freelancer'}.`,
        data: {
          contractId,
          contractSlug: contract.slug,
          href: isClient
            ? `/freelancer/contracts/${contract.slug ?? contractId}`
            : `/client/contracts/${contract.slug ?? contractId}`,
        },
      });

      return cancelled;
    } catch (error) {
      this.logger.error(`Failed to cancel contract #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async getContractList(
    userId: number,
    roleName: string,
    query: GetContractListQueryType,
  ) {
    try {
      const isAdmin =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      const isClient = roleName === RoleName.CLIENT;
      const isFreelancer = roleName === RoleName.FREELANCER;

      const filter = isAdmin
        ? {}
        : isClient
          ? { userId, role: 'client' as const }
          : isFreelancer
            ? { userId, role: 'freelancer' as const }
            : { userId, role: 'client' as const };

      return await this.contractRepository.getContractList(query, filter);
    } catch (error) {
      this.logger.error('Failed to get contract list:', error);
      if (error instanceof HttpException) throw error;
      throw FailedToLoadContractException();
    }
  }

  private isExpiredPendingContract(contract: {
    status: ContractStatus;
    expiresAt: Date | string | null;
  }): boolean {
    if (
      contract.status !== ContractStatus.AWAITING_PAYMENT &&
      contract.status !== ContractStatus.PENDING_SIGN
    ) {
      return false;
    }
    return Boolean(
      contract.expiresAt && new Date(contract.expiresAt) < new Date(),
    );
  }

  async getContractDetail(
    userId: number,
    roleName: string,
    contractId: number,
  ) {
    try {
      let contract =
        await this.contractRepository.getContractDetail(contractId);

      if (!contract) throw ContractNotFoundException();

      const isAdmin =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      const isOwner =
        contract.clientId === userId || contract.freelancerId === userId;

      if (!isAdmin && !isOwner) throw ContractForbiddenException();

      if (this.isExpiredPendingContract(contract)) {
        await this.handleContractExpiry(contract);
        contract =
          (await this.contractRepository.getContractDetail(contractId)) ??
          contract;
      }

      return contract;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get contract detail #${contractId}:`, error);
      throw FailedToLoadContractException();
    }
  }

  async getContractPdf(userId: number, roleName: string, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      const isAdmin =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      const isOwner =
        contract.clientId === userId || contract.freelancerId === userId;

      if (!isAdmin && !isOwner) throw ContractForbiddenException();

      const result =
        await this.contractPdfService.getContractPdfBuffer(contractId);
      if (!result) throw ContractNotFoundException();

      return result;
    } catch (error) {
      this.logger.error(`Failed to get contract PDF #${contractId}:`, error);
      if (error instanceof HttpException) throw error;
      throw FailedToLoadContractException();
    }
  }

  async getContractBySlug(userId: number, roleName: string, slug: string) {
    try {
      let contract = await this.contractRepository.findContractBySlug(slug);

      if (!contract) throw ContractNotFoundException();

      const isAdmin =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      const isOwner =
        contract.clientId === userId || contract.freelancerId === userId;

      if (!isAdmin && !isOwner) throw ContractForbiddenException();

      if (this.isExpiredPendingContract(contract)) {
        await this.handleContractExpiry(contract);
        contract =
          (await this.contractRepository.findContractBySlug(slug)) ?? contract;
      }

      return contract;
    } catch (error) {
      this.logger.error('Failed to create contract:', error);
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get contract by slug "${slug}":`, error);
      this.logger.error(`Failed to get contract by slug "${slug}":`, error);
      throw FailedToLoadContractException();
    }
  }
}
