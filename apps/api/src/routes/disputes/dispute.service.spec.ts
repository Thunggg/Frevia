/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { DisputeRepository } from './dispute.repo';
import { DisputeService } from './dispute.service';

describe('DisputeService', () => {
  let service: DisputeService;
  let repo: jest.Mocked<DisputeRepository>;

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
    arbitrationFee: new Prisma.Decimal(50.0),
    feeDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    fees: [
      {
        id: 1,
        disputeId: 5,
        userId: 1,
        amount: new Prisma.Decimal(50.0),
        status: DisputeFeeStatus.PENDING,
        paymentIntentId: null,
        paidAt: null,
        deadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        disputeId: 5,
        userId: 2,
        amount: new Prisma.Decimal(50.0),
        status: DisputeFeeStatus.PENDING,
        paymentIntentId: null,
        paidAt: null,
        deadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    evidences: [],
    decisionReviews: [],
  };

  beforeEach(() => {
    repo = {
      findMilestoneWithContract: jest.fn(),
      findDisputeById: jest.fn(),
      findSharedFilesByIds: jest.fn(),
      createDisputeTransaction: jest.fn(),
      findFeeByDisputeAndUser: jest.fn(),
      updateFeeStatus: jest.fn(),
      markFeeOverdue: jest.fn(),
      hasUserSubmittedEvidence: jest.fn(),
      submitResponseTransaction: jest.fn(),
      listDisputes: jest.fn(),
      makeDecisionTransaction: jest.fn(),
      upsertDecisionReview: jest.fn(),
      findDecisionReviews: jest.fn(),
      updateDisputeStatus: jest.fn(),
      finalizeDisputeTransaction: jest.fn(),
    } as unknown as jest.Mocked<DisputeRepository>;

    service = new DisputeService(repo);
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
          arbitrationFee: 50.0,
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

  describe('payFee', () => {
    it('pays fee and updates fee status to PAID', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.findFeeByDisputeAndUser.mockResolvedValue({
        id: 1,
        disputeId: 5,
        userId: 1,
        amount: new Prisma.Decimal(50.0),
        status: DisputeFeeStatus.PENDING,
      } as any);
      repo.updateFeeStatus.mockResolvedValue({
        id: 1,
        status: DisputeFeeStatus.PAID,
      } as any);

      const result = await service.payFee(1, 5, {});

      expect(repo.updateFeeStatus).toHaveBeenCalledWith(
        1,
        DisputeFeeStatus.PAID,
        expect.any(String),
        expect.any(Date),
      );
      expect(result.success).toBe(true);
    });

    it('rejects if fee has already been paid', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.findFeeByDisputeAndUser.mockResolvedValue({
        id: 1,
        disputeId: 5,
        userId: 1,
        amount: new Prisma.Decimal(50.0),
        status: DisputeFeeStatus.PAID,
      } as any);

      await expect(service.payFee(1, 5, {})).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('submitResponse', () => {
    it('allows respondent to submit response once and updates status to UNDER_REVIEW', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.hasUserSubmittedEvidence.mockResolvedValue(false);
      repo.submitResponseTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      } as any);

      const result = await service.submitResponse(2, 5, {
        description: 'I delivered the required work according to the brief.',
      });

      expect(repo.submitResponseTransaction).toHaveBeenCalledWith(
        5,
        2,
        'I delivered the required work according to the brief.',
        undefined,
      );
      expect(result.status).toBe(DisputeStatus.UNDER_REVIEW);
    });

    it('rejects if respondent attempts to submit response more than once', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.hasUserSubmittedEvidence.mockResolvedValue(true);

      await expect(
        service.submitResponse(2, 5, {
          description: 'Second response attempt',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects if non-respondent attempts to submit response', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      await expect(
        service.submitResponse(1, 5, {
          description: 'Creator trying to submit response endpoint',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('adminMakeDecision', () => {
    it('records first decision with status DECISION_MADE when split amounts equal milestone amount', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      } as any);
      repo.makeDecisionTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(300.0),
        clientAmount: new Prisma.Decimal(200.0),
        decisionReason: 'Work 60% complete based on evidence.',
      } as any);

      const result = await service.adminMakeDecision(99, 'Admin', 5, {
        freelancerAmount: 300.0,
        clientAmount: 200.0,
        decisionReason: 'Work 60% complete based on evidence.',
      });

      expect(repo.makeDecisionTransaction).toHaveBeenCalledWith(
        5,
        99,
        300.0,
        200.0,
        'Work 60% complete based on evidence.',
        1,
        2,
      );
      expect(result.status).toBe(DisputeStatus.DECISION_MADE);
    });

    it('rejects decision if split amounts do not equal milestone amount', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      } as any);

      await expect(
        service.adminMakeDecision(99, 'Admin', 5, {
          freelancerAmount: 300.0,
          clientAmount: 100.0,
          decisionReason: 'Invalid split amount test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects decision if caller is not Admin', async () => {
      await expect(
        service.adminMakeDecision(1, 'Client', 5, {
          freelancerAmount: 300.0,
          clientAmount: 200.0,
          decisionReason: 'Unauthorized',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitDecisionReview', () => {
    it('sets status to REVIEW_REQUESTED when a party rejects the decision with a reason', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
      } as any);
      repo.findDecisionReviews.mockResolvedValue([
        {
          id: 1,
          disputeId: 5,
          userId: 1,
          response: DisputeDecisionResponse.PENDING,
          reason: null,
          createdAt: new Date(),
        },
      ]);
      repo.upsertDecisionReview.mockResolvedValue({} as any);
      repo.updateDisputeStatus.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
      } as any);

      const result = await service.submitDecisionReview(1, 5, {
        response: 'REJECTED',
        reason: 'The split does not cover the completed milestone deliverable.',
      });

      expect(repo.upsertDecisionReview).toHaveBeenCalledWith(
        5,
        1,
        DisputeDecisionResponse.REJECTED,
        'The split does not cover the completed milestone deliverable.',
      );
      expect(repo.updateDisputeStatus).toHaveBeenCalledWith(
        5,
        DisputeStatus.REVIEW_REQUESTED,
      );
      expect(result.status).toBe(DisputeStatus.REVIEW_REQUESTED);
    });

    it('rejects review submission if REJECTED without reason', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
      } as any);
      repo.findDecisionReviews.mockResolvedValue([
        {
          id: 1,
          disputeId: 5,
          userId: 1,
          response: DisputeDecisionResponse.PENDING,
          reason: null,
          createdAt: new Date(),
        },
      ]);

      await expect(
        service.submitDecisionReview(1, 5, {
          response: 'REJECTED',
          reason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('finalizes dispute when both parties accept', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(300.0),
        clientAmount: new Prisma.Decimal(200.0),
        decisionReason: '60/40 split',
      } as any);
      repo.findDecisionReviews.mockResolvedValue([
        {
          id: 1,
          disputeId: 5,
          userId: 1,
          response: DisputeDecisionResponse.PENDING,
          reason: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          disputeId: 5,
          userId: 2,
          response: DisputeDecisionResponse.ACCEPTED,
          reason: null,
          createdAt: new Date(),
        },
      ]);
      repo.upsertDecisionReview.mockResolvedValue({} as any);
      repo.finalizeDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      } as any);

      const result = await service.submitDecisionReview(1, 5, {
        response: 'ACCEPTED',
      });

      expect(repo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          milestoneId: 10,
          freelancerAmount: 300.0,
          clientAmount: 200.0,
          milestoneStatus: MilestoneStatus.COMPLETED,
          milestonePaymentStatus: MilestonePaymentStatus.RELEASED,
        }),
      );
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });
  });

  describe('adminFinalDecision', () => {
    it('finalizes dispute and updates milestone status', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
      } as any);
      repo.finalizeDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
        freelancerAmount: new Prisma.Decimal(250.0),
        clientAmount: new Prisma.Decimal(250.0),
        decisionReason: 'Final 50/50 split resolution',
      } as any);

      const result = await service.adminFinalDecision(99, 'Admin', 5, {
        freelancerAmount: 250.0,
        clientAmount: 250.0,
        decisionReason: 'Final 50/50 split resolution',
      });

      expect(repo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          milestoneId: 10,
          freelancerAmount: 250.0,
          clientAmount: 250.0,
          decisionReason: 'Final 50/50 split resolution',
          milestoneStatus: MilestoneStatus.COMPLETED,
          milestonePaymentStatus: MilestonePaymentStatus.RELEASED,
        }),
      );
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });

    it('rejects final decision if already finalized', async () => {
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      } as any);

      await expect(
        service.adminFinalDecision(99, 'Admin', 5, {
          freelancerAmount: 250.0,
          clientAmount: 250.0,
          decisionReason: 'Trying to re-finalize',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
