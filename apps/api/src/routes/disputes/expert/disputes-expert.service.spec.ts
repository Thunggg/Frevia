/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { PaymentService } from '../../payments/payment.service';
import { DisputesExpertRepository } from './disputes-expert.repo';
import { DisputesExpertService } from './disputes-expert.service';

describe('DisputesExpertService', () => {
  let service: DisputesExpertService;
  let repo: jest.Mocked<DisputesExpertRepository>;
  let paymentService: jest.Mocked<PaymentService>;

  const mockDispute = {
    id: 5,
    milestoneId: 10,
    openedById: 1,
    respondentId: 2,
    reason: 'Poor work quality',
    description: 'The deliverable does not match specifications.',
    status: DisputeStatus.UNDER_REVIEW,
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
      findActiveExpert: jest.fn(),
      findDisputeById: jest.fn(),
      findConversationMessages: jest.fn().mockResolvedValue([]),
      listDisputes: jest.fn(),
      makeDecisionTransaction: jest.fn(),
      finalizeDisputeTransaction: jest.fn(),
    } as unknown as jest.Mocked<DisputesExpertRepository>;

    paymentService = {
      executeDisputeSettlementPayout: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PaymentService>;

    service = new DisputesExpertService(repo, paymentService);
  });

  describe('access control & listing', () => {
    it('lets an active expert list disputes', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.listDisputes.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const query = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const,
        order: 'desc' as const,
      };
      await service.listDisputes(99, 'Expert', query);

      expect(repo.findActiveExpert).toHaveBeenCalledWith(99);
      expect(repo.listDisputes).toHaveBeenCalledWith(query);
    });

    it('blocks an inactive expert before listing disputes', async () => {
      repo.findActiveExpert.mockResolvedValue(null);

      await expect(
        service.listDisputes(99, 'Expert', {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.listDisputes).not.toHaveBeenCalled();
    });

    it('blocks Admin or Client role because only Expert arbitrates disputes', async () => {
      await expect(
        service.listDisputes(99, 'Admin', {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.listDisputes(1, 'Client', {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.listDisputes).not.toHaveBeenCalled();
    });

    it('returns dispute detail with conversation messages for active expert and throws NotFound if missing', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.findDisputeById.mockResolvedValueOnce(mockDispute as any);
      const mockMessages = [
        {
          id: 1,
          senderId: 1,
          message: 'Please share the repo link.',
          fileUrl: null,
          fileName: null,
          createdAt: new Date(),
        },
      ];
      repo.findConversationMessages.mockResolvedValueOnce(mockMessages);

      const detail = await service.getDisputeDetail(99, 'Expert', 5);
      expect(repo.findConversationMessages).toHaveBeenCalledWith(1, 2);
      expect(detail).toEqual({
        ...mockDispute,
        conversationMessages: mockMessages,
      });

      repo.findDisputeById.mockResolvedValueOnce(null);
      await expect(
        service.getDisputeDetail(99, 'Expert', 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('makeDecision', () => {
    it('finalizes decision, executes settlement payout immediately without requiring mutual approval', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.finalizeDisputeTransaction.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
        freelancerAmount: new Prisma.Decimal(300.0),
        clientAmount: new Prisma.Decimal(200.0),
        decisionReason: 'Work 60% complete based on evidence.',
      } as any);

      const result = (await service.makeDecision(99, 'Expert', 5, {
        freelancerAmount: 300.0,
        clientAmount: 200.0,
        decisionReason: 'Work 60% complete based on evidence.',
      }))!;

      expect(paymentService.executeDisputeSettlementPayout).toHaveBeenCalledWith(
        {
          disputeId: 5,
          contractId: 100,
          milestoneId: 10,
          freelancerId: 2,
          clientId: 1,
          freelancerAmount: 300.0,
          clientAmount: 200.0,
        },
      );
      expect(repo.finalizeDisputeTransaction).toHaveBeenCalled();
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });

    it('rejects decision if split amounts do not equal milestone amount', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      await expect(
        service.makeDecision(99, 'Expert', 5, {
          freelancerAmount: 300.0,
          clientAmount: 100.0,
          decisionReason: 'Invalid split amount test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects decision if dispute is not in a decidable status', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.WAITING_RESPONSE,
      } as any);

      await expect(
        service.makeDecision(99, 'Expert', 5, {
          freelancerAmount: 300.0,
          clientAmount: 200.0,
          decisionReason: 'Not yet escalated',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('blocks inactive experts and non-expert roles from submitting decisions', async () => {
      repo.findActiveExpert.mockResolvedValue(null);
      const body = {
        freelancerAmount: 300.0,
        clientAmount: 200.0,
        decisionReason: 'Unauthorized',
      };

      await expect(
        service.makeDecision(99, 'Expert', 5, body),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.makeDecision(1, 'Admin', 5, body),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.makeDecisionTransaction).not.toHaveBeenCalled();
    });
  });

  describe('makeFinalDecision', () => {
    it('finalizes dispute, executes settlement payout, and updates milestone status', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
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

      const result = (await service.makeFinalDecision(99, 'Expert', 5, {
        freelancerAmount: 250.0,
        clientAmount: 250.0,
        decisionReason: 'Final 50/50 split resolution',
      }))!;

      expect(
        paymentService.executeDisputeSettlementPayout,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 250.0,
          clientAmount: 250.0,
        }),
      );
      expect(repo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          milestoneId: 10,
          expertId: 99,
          freelancerAmount: 250.0,
          clientAmount: 250.0,
          decisionReason: 'Final 50/50 split resolution',
          milestoneStatus: MilestoneStatus.COMPLETED,
          milestonePaymentStatus: MilestonePaymentStatus.RELEASED,
        }),
      );
      expect(result.status).toBe(DisputeStatus.FINALIZED);
    });

    it('rejects final decision if dispute is already finalized', async () => {
      repo.findActiveExpert.mockResolvedValue({ id: 9 });
      repo.findDisputeById.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      } as any);

      await expect(
        service.makeFinalDecision(99, 'Expert', 5, {
          freelancerAmount: 250.0,
          clientAmount: 250.0,
          decisionReason: 'Trying to re-finalize',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(
        paymentService.executeDisputeSettlementPayout,
      ).not.toHaveBeenCalled();
    });

    it('blocks inactive experts from finalizing decisions', async () => {
      repo.findActiveExpert.mockResolvedValue(null);

      await expect(
        service.makeFinalDecision(99, 'Expert', 5, {
          freelancerAmount: 250.0,
          clientAmount: 250.0,
          decisionReason: 'Unauthorized',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.finalizeDisputeTransaction).not.toHaveBeenCalled();
    });
  });
});
