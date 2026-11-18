import {
  DisputeDecisionResponse,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import {
  AdminDisputeDecisionBodySchema,
  AdminDisputeDecisionBodyType,
  AdminDisputeFinalDecisionBodyType,
  CreateDisputeBodySchema,
  CreateDisputeBodyType,
  GetDisputeListQuerySchema,
  GetDisputeListQueryType,
  RespondDisputeBodyType,
  ReviewDisputeDecisionBodySchema,
  ReviewDisputeDecisionBodyType,
  RoleName,
} from '@shared/types';
import {
  DisputeDecisionNotPendingException,
  DisputeEvidenceLimitExceededException,
  DisputeForbiddenException,
  DisputeMilestoneNotFoundException,
  DisputeNotContractParticipantException,
  DisputeNotFoundException,
  DisputeResponseAlreadySubmittedException,
  DisputeResponseNotAllowedException,
  DisputeReviewReasonRequiredException,
  MilestoneAlreadyDisputedException,
  MilestoneCannotBeDisputedException,
} from '../../src/routes/disputes/user/dispute.error';
import { DisputeRepository } from '../../src/routes/disputes/user/dispute.repo';
import { DisputeService } from '../../src/routes/disputes/user/dispute.service';
import {
  ExpertDisputeForbiddenException,
  ExpertDisputeInvalidSplitAmountException,
} from '../../src/routes/disputes/expert/disputes-expert.error';
import { DisputesExpertRepository } from '../../src/routes/disputes/expert/disputes-expert.repo';
import { DisputesExpertService } from '../../src/routes/disputes/expert/disputes-expert.service';
import { PaymentService } from '../../src/routes/payments/payment.service';

describe('Dispute Management (UF-147 to UF-152)', () => {
  const disputeRepo = {
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
    findDecisionReviews: jest.fn(),
    upsertDecisionReview: jest.fn(),
    updateDisputeStatus: jest.fn(),
    finalizeDisputeTransaction: jest.fn(),
  };

  const expertDisputeRepo = {
    findActiveExpert: jest.fn(),
    findDisputeById: jest.fn(),
    listDisputes: jest.fn(),
    makeDecisionTransaction: jest.fn(),
    finalizeDisputeTransaction: jest.fn(),
  };

  const paymentService = {
    executeDisputeSettlementPayout: jest.fn().mockResolvedValue(undefined),
  };

  const service = new DisputeService(
    disputeRepo as unknown as DisputeRepository,
    paymentService as unknown as PaymentService,
  );

  const expertService = new DisputesExpertService(
    expertDisputeRepo as unknown as DisputesExpertRepository,
    paymentService as unknown as PaymentService,
  );

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

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
    createdAt: mockDate,
    updatedAt: mockDate,
    deletedAt: null,
    dispute: null,
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
    },
  };

  const mockDispute = {
    id: 5,
    milestoneId: 10,
    openedById: 1,
    respondentId: 2,
    reason: 'Work does not match specifications',
    description: 'Detailed description of dispute',
    status: DisputeStatus.OPEN,
    freelancerAmount: null,
    clientAmount: null,
    decisionReason: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    milestone: mockMilestone,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    expertDisputeRepo.findActiveExpert.mockResolvedValue({ id: 9 });
  });

  // =========================================================================
  // UF-147: createDispute
  // =========================================================================
  describe('UF-147 createDispute', () => {
    it('creates dispute successfully on funded milestone by participant', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );
      disputeRepo.findSharedFilesByIds.mockResolvedValueOnce([{ id: 1 }]);
      disputeRepo.createDisputeTransaction.mockResolvedValueOnce(mockDispute);

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Work does not match specifications',
        description: 'Detailed description',
        evidenceFiles: [{ fileId: 1 }],
      };

      const result = await service.createDispute(1, body);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.createDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 10,
          openedById: 1,
          respondentId: 2,
          reason: 'Work does not match specifications',
        }),
      );
    });

    it('throws DisputeMilestoneNotFoundException when milestone is not found', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(null);

      const body: CreateDisputeBodyType = {
        milestoneId: 999,
        reason: 'Missing milestone',
        description: 'Milestone was not delivered according to requirements',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        DisputeMilestoneNotFoundException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws DisputeNotContractParticipantException when user is non-participant', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'IDOR attempt',
        description: 'Unauthorized user dispute attempt',
      };

      await expect(service.createDispute(999, body)).rejects.toThrow(
        DisputeNotContractParticipantException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws MilestoneAlreadyDisputedException when milestone already has a dispute', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce({
        ...mockMilestone,
        dispute: { id: 1, status: DisputeStatus.OPEN },
      });

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Duplicate dispute',
        description: 'Attempting to open duplicate dispute on milestone',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        MilestoneAlreadyDisputedException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws MilestoneCannotBeDisputedException when milestone is not funded', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.PENDING,
      });

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Unfunded milestone',
        description: 'Cannot open dispute on unfunded milestone',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        MilestoneCannotBeDisputedException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws DisputeEvidenceLimitExceededException when evidence files exceed limit', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Too many files',
        description: 'Excessive evidence attachments',
        evidenceFiles: [
          { fileId: 1 },
          { fileId: 2 },
          { fileId: 3 },
          { fileId: 4 },
          { fileId: 5 },
          { fileId: 6 },
        ],
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        DisputeEvidenceLimitExceededException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    it('rejects empty reason through CreateDisputeBodySchema', () => {
      const parsed = CreateDisputeBodySchema.safeParse({
        milestoneId: 10,
        reason: '',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-148: listMyDisputes & Expert listDisputes
  // =========================================================================
  describe('UF-148 listMyDisputes', () => {
    it('returns paginated disputes for authenticated user', async () => {
      const expectedData = {
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      disputeRepo.listDisputes.mockResolvedValueOnce(expectedData);

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };
      const result = await service.listMyDisputes(1, query);

      expect(result).toEqual(expectedData);
      expect(disputeRepo.listDisputes).toHaveBeenCalledWith(query, 1);
    });

    it('returns all system disputes for active expert role', async () => {
      const expectedData = {
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      expertDisputeRepo.listDisputes.mockResolvedValueOnce(expectedData);

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };
      const result = await expertService.listDisputes(
        99,
        RoleName.EXPERT,
        query,
      );

      expect(result).toEqual(expectedData);
      expect(expertDisputeRepo.listDisputes).toHaveBeenCalledWith(query);
    });

    it('throws ExpertDisputeForbiddenException when non-expert accesses expert dispute list', async () => {
      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      await expect(
        expertService.listDisputes(1, RoleName.CLIENT, query),
      ).rejects.toThrow(ExpertDisputeForbiddenException());
      expect(expertDisputeRepo.listDisputes).not.toHaveBeenCalled();
    });

    it('filters dispute list by status cleanly', async () => {
      disputeRepo.listDisputes.mockResolvedValueOnce({
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
        status: DisputeStatus.OPEN,
      };
      const result = await service.listMyDisputes(1, query);

      expect(result.data).toHaveLength(1);
    });

    it('rejects limit > 50 through GetDisputeListQuerySchema', () => {
      const parsed = GetDisputeListQuerySchema.safeParse({ limit: 100 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-149: getDisputeDetail
  // =========================================================================
  describe('UF-149 getDisputeDetail', () => {
    it('returns dispute detail by ID for participant', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeDetail(1, 5);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.findDisputeById).toHaveBeenCalledWith(5);
    });

    it('returns dispute detail by milestone ID for participant', async () => {
      disputeRepo.findDisputeByMilestoneId.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeByMilestoneId(2, 10);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.findDisputeByMilestoneId).toHaveBeenCalledWith(10);
    });

    it('returns dispute detail with correct dispute data for participant', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeDetail(1, 5);

      expect(result.id).toBe(5);
      expect(result.reason).toBe('Work does not match specifications');
    });

    it('throws DisputeNotFoundException when dispute is not found', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(null);

      await expect(service.getDisputeDetail(1, 999)).rejects.toThrow(
        DisputeNotFoundException(),
      );
    });

    it('throws DisputeForbiddenException when non-participant accesses dispute detail', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      await expect(service.getDisputeDetail(999, 5)).rejects.toThrow(
        DisputeForbiddenException(),
      );
    });
  });

  // =========================================================================
  // UF-150: respondToDispute
  // =========================================================================
  describe('UF-150 respondToDispute', () => {
    it('submits counter-response with explanation and files by respondent', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);
      disputeRepo.findSharedFilesByIds.mockResolvedValueOnce([{ id: 2 }]);
      const updatedDispute = {
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
        declineReason:
          'All requested requirements were delivered according to specification',
        declinedAt: mockDate,
      };
      disputeRepo.declineDisputeTransaction.mockResolvedValueOnce(
        updatedDispute,
      );

      const body: RespondDisputeBodyType = {
        action: 'DECLINE',
        reason:
          'All requested requirements were delivered according to specification',
        evidenceFiles: [{ fileId: 2 }],
      };

      const result = await service.respondToDispute(2, 5, body);

      expect(result!.declineReason).toBe(body.reason);
      expect(disputeRepo.declineDisputeTransaction).toHaveBeenCalledWith(
        5,
        2,
        body.reason,
        body.evidenceFiles,
      );
    });

    it('throws DisputeForbiddenException when opener attempts to submit respondent defense', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const body: RespondDisputeBodyType = {
        action: 'DECLINE',
        reason: 'Invalid caller response',
      };

      await expect(service.respondToDispute(1, 5, body)).rejects.toThrow(
        DisputeForbiddenException(),
      );
      expect(disputeRepo.declineDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws DisputeResponseAlreadySubmittedException on duplicate response submission', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        declinedAt: mockDate,
      });

      const body: RespondDisputeBodyType = {
        action: 'DECLINE',
        reason: 'Second response attempt',
      };

      await expect(service.respondToDispute(2, 5, body)).rejects.toThrow(
        DisputeResponseAlreadySubmittedException(),
      );
      expect(disputeRepo.declineDisputeTransaction).not.toHaveBeenCalled();
    });

    it('throws DisputeResponseNotAllowedException when dispute is not awaiting response', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      });

      const body: RespondDisputeBodyType = {
        action: 'DECLINE',
        reason: 'Late response',
      };

      await expect(service.respondToDispute(2, 5, body)).rejects.toThrow(
        DisputeResponseNotAllowedException(),
      );
    });
  });

  // =========================================================================
  // UF-151: submitDecisionReview
  // =========================================================================
  describe('UF-151 submitDecisionReview', () => {
    it('rejects proposed split with reason and transitions to REVIEW_REQUESTED', async () => {
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(200.0),
        clientAmount: new Prisma.Decimal(300.0),
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(decisionDispute);
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
      ]);
      const reviewRequestedDispute = {
        ...decisionDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
      };
      disputeRepo.updateDisputeStatus.mockResolvedValueOnce(
        reviewRequestedDispute,
      );

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.REJECTED,
        reason: 'Client refund portion is insufficient',
      };

      const result = await service.submitDecisionReview(1, 5, body);

      expect(result!.status).toBe(DisputeStatus.REVIEW_REQUESTED);
      expect(disputeRepo.upsertDecisionReview).toHaveBeenCalledWith(
        5,
        1,
        DisputeDecisionResponse.REJECTED,
        'Client refund portion is insufficient',
      );
    });

    it('automatically finalizes dispute when both parties accept resolution', async () => {
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(250.0),
        clientAmount: new Prisma.Decimal(250.0),
        decisionReason: 'Equal compromise settlement',
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(decisionDispute);
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
        { userId: 2, response: DisputeDecisionResponse.ACCEPTED },
      ]);
      const finalized = { ...decisionDispute, status: DisputeStatus.FINALIZED };
      disputeRepo.finalizeDisputeTransaction.mockResolvedValueOnce(finalized);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.ACCEPTED,
      };

      const result = await service.submitDecisionReview(1, 5, body);

      expect(result!.status).toBe(DisputeStatus.FINALIZED);
      expect(disputeRepo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 250,
          clientAmount: 250,
        }),
      );
    });

    it('throws DisputeReviewReasonRequiredException when rejection reason is missing', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
      });
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
      ]);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.REJECTED,
        reason: '',
      };

      await expect(service.submitDecisionReview(1, 5, body)).rejects.toThrow(
        DisputeReviewReasonRequiredException(),
      );
      expect(disputeRepo.upsertDecisionReview).not.toHaveBeenCalled();
    });

    it('throws DisputeDecisionNotPendingException when dispute is not in DECISION_MADE', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.ACCEPTED,
      };

      await expect(service.submitDecisionReview(1, 5, body)).rejects.toThrow(
        DisputeDecisionNotPendingException(),
      );
    });

    it('rejects invalid response enum through ReviewDisputeDecisionBodySchema', () => {
      const parsed = ReviewDisputeDecisionBodySchema.safeParse({
        response: 'MAYBE',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-152: DisputesExpertService makeDecision & makeFinalDecision
  // =========================================================================
  describe('UF-152 expertMakeDecision', () => {
    it('proposes valid split resolution allocation by expert', async () => {
      expertDisputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      });
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(300.0),
        clientAmount: new Prisma.Decimal(200.0),
      };
      expertDisputeRepo.makeDecisionTransaction.mockResolvedValueOnce(
        decisionDispute,
      );

      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 300,
        clientAmount: 200,
        decisionReason: 'Milestone 60% delivered satisfactorily',
      };

      const result = await expertService.makeDecision(
        99,
        RoleName.EXPERT,
        5,
        body,
      );

      expect(result!.status).toBe(DisputeStatus.DECISION_MADE);
      expect(expertDisputeRepo.makeDecisionTransaction).toHaveBeenCalledWith(
        5,
        99,
        300,
        200,
        'Milestone 60% delivered satisfactorily',
        1,
        2,
      );
    });

    it('throws ExpertDisputeInvalidSplitAmountException when split sum differs from milestone amount', async () => {
      expertDisputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      });

      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 200,
        clientAmount: 200,
        decisionReason: 'Mismatch sum',
      };

      await expect(
        expertService.makeDecision(99, RoleName.EXPERT, 5, body),
      ).rejects.toThrow(ExpertDisputeInvalidSplitAmountException());
      expect(expertDisputeRepo.makeDecisionTransaction).not.toHaveBeenCalled();
    });

    it('throws ExpertDisputeForbiddenException when non-expert attempts to propose resolution', async () => {
      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 300,
        clientAmount: 200,
        decisionReason: 'Unauthorized',
      };

      await expect(
        expertService.makeDecision(1, RoleName.CLIENT, 5, body),
      ).rejects.toThrow(ExpertDisputeForbiddenException());
    });

    it('issues final binding decision when consensus cannot be reached', async () => {
      const reviewRequestedDispute = {
        ...mockDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
        milestone: mockMilestone,
      };
      expertDisputeRepo.findDisputeById.mockResolvedValueOnce(
        reviewRequestedDispute,
      );
      const finalized = {
        ...reviewRequestedDispute,
        status: DisputeStatus.FINALIZED,
      };
      expertDisputeRepo.finalizeDisputeTransaction.mockResolvedValueOnce(
        finalized,
      );

      const body: AdminDisputeFinalDecisionBodyType = {
        freelancerAmount: 350,
        clientAmount: 150,
        decisionReason: 'Final expert determination',
      };

      const result = await expertService.makeFinalDecision(
        99,
        RoleName.EXPERT,
        5,
        body,
      );

      expect(result!.status).toBe(DisputeStatus.FINALIZED);
      expect(expertDisputeRepo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 350,
          clientAmount: 150,
        }),
      );
    });

    it('rejects negative clientAmount through AdminDisputeDecisionBodySchema', () => {
      const parsed = AdminDisputeDecisionBodySchema.safeParse({
        freelancerAmount: 500,
        clientAmount: -50,
        decisionReason: 'Invalid',
      });
      expect(parsed.success).toBe(false);
    });
  });
});
