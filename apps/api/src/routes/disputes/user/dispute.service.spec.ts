/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DisputeResolutionType,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { DisputeRepository } from './dispute.repo';
import { DisputeService } from './dispute.service';
import { PaymentService } from '../../payments/payment.service';

describe('DisputeService', () => {
  let service: DisputeService;
  let repo: jest.Mocked<DisputeRepository>;
  let paymentService: jest.Mocked<PaymentService>;

  const mockMilestone = {
    id: 10,
    contractId: 100,
    title: 'Milestone 1',
    description: 'First milestone',
    amount: new Prisma.Decimal(500.0),
    status: MilestoneStatus.IN_PROGRESS,
    paymentStatus: MilestonePaymentStatus.FUNDED,
    dueDate: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    contract: {
      id: 100,
      jobId: 1,
      proposalId: 1,
      clientId: 1,
      freelancerId: 2,
      terms: 'Terms',
      totalAmount: new Prisma.Decimal(1000.0),
      status: 'ACTIVE',
      signedByClient: true,
      signedByFreelancer: true,
      createdAt: new Date(),
      signedAt: new Date(),
      completedAt: null,
      expiresAt: null,
      deletedAt: null,
      client: { id: 1, email: 'client@example.com' },
      freelancer: { id: 2, email: 'freelancer@example.com' },
    },
    dispute: null,
  };

  const mockDispute = {
    id: 5,
    milestoneId: 10,
    openedById: 1,
    respondentId: 2,
    reason: 'Poor work quality',
    description: 'The deliverable does not match specifications.',
    status: DisputeStatus.OPEN,
    responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    freelancerAmount: null,
    clientAmount: null,
    decisionReason: null,
    decisionById: null,
    decisionAt: null,
    finalDecisionAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    milestone: {
      id: 10,
      contractId: 100,
      title: 'Milestone 1',
      description: 'First milestone',
      amount: new Prisma.Decimal(500.0),
      status: MilestoneStatus.DISPUTED,
      paymentStatus: MilestonePaymentStatus.DISPUTED,
      contract: {
        id: 100,
        clientId: 1,
        freelancerId: 2,
      },
    },
    openedBy: { id: 1, email: 'client@example.com' },
    respondent: { id: 2, email: 'freelancer@example.com' },
    decisionBy: null,
    evidences: [],
    decisionReviews: [],
  };

  beforeEach(() => {
    repo = {
      findMilestoneWithContract: jest.fn(),
      findDisputeById: jest.fn(),
      findDisputeByMilestoneId: jest.fn(),
      findSharedFilesByIds: jest.fn(),
      createDisputeTransaction: jest.fn(),
      declineDisputeTransaction: jest.fn(),
      acceptExtendDeadlineTransaction: jest.fn(),
      withdrawDisputeTransaction: jest.fn(),
      escalateDisputeTransaction: jest.fn(),
      listDisputes: jest.fn(),
      upsertDecisionReview: jest.fn(),
      findDecisionReviews: jest.fn(),
      updateDisputeStatus: jest.fn(),
      finalizeDisputeTransaction: jest.fn(),
    } as unknown as jest.Mocked<DisputeRepository>;

    paymentService = {
      executeDisputeSettlementPayout: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PaymentService>;

    service = new DisputeService(repo, paymentService);
  });

  describe('createDispute', () => {
    it('creates dispute, locks milestone to DISPUTED, sets respondent to freelancer when client creates', async () => {
      repo.findMilestoneWithContract.mockResolvedValue(
        mockMilestone as unknown as any,
      );
      repo.createDisputeTransaction.mockResolvedValue(mockDispute as any);

      const result = await service.createDispute(1, {
        milestoneId: 10,
        reason: 'Work incomplete',
        description: 'Freelancer did not submit code deliverables.',
      });

      expect(repo.createDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 10,
          openedById: 1,
          respondentId: 2,
          reason: 'Work incomplete',
        }),
      );
      expect(result).toEqual(mockDispute);
    });

    it('rejects dispute if user is not part of contract', async () => {
      repo.findMilestoneWithContract.mockResolvedValue(
        mockMilestone as unknown as any,
      );

      await expect(
        service.createDispute(999, {
          milestoneId: 10,
          reason: 'Unrelated user',
          description: 'Trying to open dispute on foreign contract.',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects dispute if milestone already has a dispute', async () => {
      repo.findMilestoneWithContract.mockResolvedValue({
        ...mockMilestone,
        dispute: { id: 1 },
      } as any);

      await expect(
        service.createDispute(1, {
          milestoneId: 10,
          reason: 'Duplicate dispute',
          description: 'Trying to open duplicate dispute on milestone.',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('allows opening a new dispute when previous dispute was a finalized deadline extension', async () => {
      repo.findMilestoneWithContract.mockResolvedValue({
        ...mockMilestone,
        dispute: {
          id: 99,
          status: DisputeStatus.FINALIZED,
          resolutionType: DisputeResolutionType.EXTEND_DEADLINE,
        },
      } as any);
      repo.createDisputeTransaction.mockResolvedValue(mockDispute as any);

      const result = await service.createDispute(2, {
        milestoneId: 10,
        reason: 'Client requested work outside original scope',
        description: 'Client asked for additional modules after extension.',
        resolutionType: DisputeResolutionType.FULL_RELEASE,
      });

      expect(repo.createDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 10,
          openedById: 2,
          respondentId: 1,
          resolutionType: DisputeResolutionType.FULL_RELEASE,
          replaceCancelledDisputeId: 99,
        }),
      );
      expect(result).toEqual(mockDispute);
    });

    it('rejects dispute if milestone is already completed/released', async () => {
      repo.findMilestoneWithContract.mockResolvedValue({
        ...mockMilestone,
        status: MilestoneStatus.COMPLETED,
        paymentStatus: MilestonePaymentStatus.RELEASED,
      } as any);

      await expect(
        service.createDispute(1, {
          milestoneId: 10,
          reason: 'Already completed milestone',
          description: 'Milestone has already been released.',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects dispute if evidence files count exceeds 5', async () => {
      repo.findMilestoneWithContract.mockResolvedValue(
        mockMilestone as unknown as any,
      );

      const tooManyFiles = [
        { fileId: 1 },
        { fileId: 2 },
        { fileId: 3 },
        { fileId: 4 },
        { fileId: 5 },
        { fileId: 6 },
      ];

      await expect(
        service.createDispute(1, {
          milestoneId: 10,
          reason: 'Too many files',
          description: 'Exceeds maximum 5 evidence files limit.',
          evidenceFiles: tooManyFiles,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDisputeDetail & getDisputeByMilestoneId', () => {
    it('returns dispute detail for contract participant', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      const result = await service.getDisputeDetail(1, 5);
      expect(result).toEqual(mockDispute);
      expect(repo.findDisputeById).toHaveBeenCalledWith(5);
    });

    it('blocks non-participant from viewing dispute detail', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      await expect(service.getDisputeDetail(999, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns dispute detail by milestoneId for contract participant', async () => {
      repo.findDisputeByMilestoneId.mockResolvedValue(mockDispute as any);

      const result = await service.getDisputeByMilestoneId(2, 10);
      expect(result).toEqual(mockDispute);
      expect(repo.findDisputeByMilestoneId).toHaveBeenCalledWith(10);
    });
  });

  describe('Resolution Center (Fiverr-style)', () => {
    it('accepts FULL_REFUND resolution and triggers automatic Stripe settlement', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        resolutionType: 'FULL_REFUND',
        proposedFreelancerAmount: new Prisma.Decimal(0),
        proposedClientAmount: new Prisma.Decimal(500),
        declinedAt: null,
      } as any);
      repo.finalizeDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      } as any);

      const result = (await service.respondToDispute(2, 5, {
        action: 'ACCEPT',
      }))!;

      expect(
        paymentService.executeDisputeSettlementPayout,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 0,
          clientAmount: 500,
        }),
      );
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });

    it('accepts EXTEND_DEADLINE resolution and updates milestone dueDate without payout', async () => {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        resolutionType: 'EXTEND_DEADLINE',
        proposedDueDate: nextWeek,
        previousMilestoneStatus: MilestoneStatus.LATE,
        declinedAt: null,
      } as any);
      repo.acceptExtendDeadlineTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      } as any);

      const result = (await service.respondToDispute(2, 5, {
        action: 'ACCEPT',
      }))!;

      expect(
        paymentService.executeDisputeSettlementPayout,
      ).not.toHaveBeenCalled();
      expect(repo.acceptExtendDeadlineTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          milestoneId: 10,
          proposedDueDate: nextWeek,
          restoredStatus: MilestoneStatus.IN_PROGRESS,
        }),
      );
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });

    it('records decline reason when respondent declines', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        declinedAt: null,
      } as any);
      repo.declineDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
        declineReason: 'Work was delivered per requirements',
        declinedAt: new Date(),
      } as any);

      const result = (await service.respondToDispute(2, 5, {
        action: 'DECLINE',
        reason: 'Work was delivered per requirements',
      }))!;

      expect(repo.declineDisputeTransaction).toHaveBeenCalledWith(
        5,
        2,
        'Work was delivered per requirements',
        undefined,
      );
      expect(result.declineReason).toBe('Work was delivered per requirements');
    });

    it('allows opener to withdraw ticket and restores previous milestone status', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        previousMilestoneStatus: MilestoneStatus.SUBMITTED,
      } as any);
      repo.withdrawDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.CANCELLED,
      } as any);

      const result = (await service.withdrawDispute(1, 5))!;

      expect(repo.withdrawDisputeTransaction).toHaveBeenCalledWith(
        5,
        10,
        MilestoneStatus.SUBMITTED,
      );
      expect(result.status).toBe(DisputeStatus.CANCELLED);
    });

    it('blocks escalation before decline or 48h deadline, allows after decline', async () => {
      repo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        declinedAt: null,
        responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any);

      await expect(service.escalateDispute(1, 5)).rejects.toThrow(
        UnprocessableEntityException,
      );

      repo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        declinedAt: new Date(),
      } as any);
      repo.escalateDisputeTransaction.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      } as any);

      const escalated = (await service.escalateDispute(1, 5))!;
      expect(escalated.status).toBe(DisputeStatus.UNDER_REVIEW);
    });
  });
});
