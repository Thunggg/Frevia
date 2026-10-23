/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MilestonePaymentStatus,
  MilestoneStatus,
  PlatformFeeStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { RoleName } from '@shared/types';
import { PaymentRepository } from './payment.repo';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let repo: jest.Mocked<PaymentRepository>;
  let stripeService: jest.Mocked<StripeService>;

  const mockUser = {
    id: 1,
    email: 'client@example.com',
    fullName: 'Client User',
    stripeCustomerId: 'cus_123',
    stripeAccountId: null as string | null,
    stripeOnboardingCompleted: false,
  };

  const mockFreelancer = {
    id: 2,
    email: 'freelancer@example.com',
    fullName: 'Freelancer User',
    stripeCustomerId: null,
    stripeAccountId: 'acct_freelancer_123',
    stripeOnboardingCompleted: true,
  };

  const mockContract = {
    id: 10,
    jobId: 100,
    clientId: 1,
    freelancerId: 2,
    status: 'ACTIVE',
    signedByClient: true,
    signedByFreelancer: true,
    platformFee: new Prisma.Decimal(10.0),
    platformFeeStatus: PlatformFeeStatus.UNPAID,
    platformFeePaidAt: null,
    client: { id: 1, email: 'client@example.com', stripeCustomerId: 'cus_123' },
    freelancer: mockFreelancer,
  };

  const mockMilestone = {
    id: 20,
    contractId: 10,
    title: 'Milestone 1',
    amount: new Prisma.Decimal(250.0),
    status: MilestoneStatus.IN_PROGRESS,
    paymentStatus: MilestonePaymentStatus.PENDING,
    contract: mockContract,
  };

  beforeEach(() => {
    repo = {
      findUserById: jest.fn(),
      updateUserStripe: jest.fn(),
      findContractById: jest.fn(),
      updateContractPlatformFee: jest.fn(),
      findMilestoneById: jest.fn(),
      updateMilestonePaymentStatus: jest.fn(),
      findDisputeById: jest.fn(),
      findDisputeFee: jest.fn(),
      updateDisputeFeeStatus: jest.fn(),
      updateDisputeStatus: jest.fn(),
      createTransaction: jest.fn(),
      findTransactionByPaymentIntentId: jest.fn(),
      findEscrowDepositTransaction: jest.fn(),
      updateTransactionStatus: jest.fn(),
      getTransactions: jest.fn(),
    } as unknown as jest.Mocked<PaymentRepository>;

    stripeService = {
      createCustomer: jest.fn(),
      createExpressAccount: jest.fn(),
      createAccountLink: jest.fn(),
      getAccount: jest.fn(),
      createPaymentIntent: jest.fn(),
      createTransfer: jest.fn(),
      createRefund: jest.fn(),
      constructWebhookEvent: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;

    service = new PaymentService(repo, stripeService);
  });

  describe('getOnboardingLink', () => {
    it('creates new stripe express account if user does not have one and returns onboarding link', async () => {
      repo.findUserById.mockResolvedValue({
        ...mockUser,
        stripeAccountId: null,
      } as any);
      stripeService.createExpressAccount.mockResolvedValue({
        id: 'acct_new_123',
      } as any);
      repo.updateUserStripe.mockResolvedValue({} as any);
      stripeService.createAccountLink.mockResolvedValue({
        url: 'https://connect.stripe.com/setup/s/123',
      } as any);

      const result = await service.getOnboardingLink(1);

      expect(stripeService.createExpressAccount).toHaveBeenCalledWith(
        'client@example.com',
      );
      expect(repo.updateUserStripe).toHaveBeenCalledWith(1, {
        stripeAccountId: 'acct_new_123',
      });
      expect(stripeService.createAccountLink).toHaveBeenCalledWith(
        'acct_new_123',
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({
        onboardingUrl: 'https://connect.stripe.com/setup/s/123',
      });
    });

    it('reuses existing stripe account if user already has one', async () => {
      repo.findUserById.mockResolvedValue({
        ...mockFreelancer,
      } as any);
      stripeService.createAccountLink.mockResolvedValue({
        url: 'https://connect.stripe.com/setup/s/existing',
      } as any);

      const result = await service.getOnboardingLink(2);

      expect(stripeService.createExpressAccount).not.toHaveBeenCalled();
      expect(stripeService.createAccountLink).toHaveBeenCalledWith(
        'acct_freelancer_123',
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({
        onboardingUrl: 'https://connect.stripe.com/setup/s/existing',
      });
    });

    it('throws ForbiddenException if user not found', async () => {
      repo.findUserById.mockResolvedValue(null);

      await expect(service.getOnboardingLink(999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getConnectStatus', () => {
    it('returns not connected if user has no stripeAccountId', async () => {
      repo.findUserById.mockResolvedValue({
        ...mockUser,
        stripeAccountId: null,
      } as any);

      const status = await service.getConnectStatus(1);

      expect(status).toEqual({
        isConnected: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        stripeAccountId: null,
      });
    });

    it('returns retrieved account status and syncs onboarding completed flag', async () => {
      repo.findUserById.mockResolvedValue({
        ...mockFreelancer,
        stripeOnboardingCompleted: false,
      } as any);
      stripeService.getAccount.mockResolvedValue({
        id: 'acct_freelancer_123',
        payouts_enabled: true,
        charges_enabled: true,
      } as any);
      repo.updateUserStripe.mockResolvedValue({} as any);

      const status = await service.getConnectStatus(2);

      expect(status.isConnected).toBe(true);
      expect(status.payoutsEnabled).toBe(true);
      expect(repo.updateUserStripe).toHaveBeenCalledWith(2, {
        stripeOnboardingCompleted: true,
      });
    });
  });

  describe('createPlatformFeeIntent', () => {
    it('creates payment intent and pending transaction for signed contract', async () => {
      repo.findContractById.mockResolvedValue(mockContract as any);
      stripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_platform_fee',
        client_secret: 'pi_secret_123',
      } as any);
      repo.createTransaction.mockResolvedValue({} as any);

      const result = await service.createPlatformFeeIntent(1, 10);

      expect(result).toEqual({
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_platform_fee',
        amount: 10,
        currency: 'usd',
      });
      expect(repo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          contractId: 10,
          type: TransactionType.PLATFORM_FEE,
          status: TransactionStatus.PENDING,
          stripePaymentIntentId: 'pi_platform_fee',
        }),
      );
    });

    it('throws ForbiddenException if caller is not the contract client', async () => {
      repo.findContractById.mockResolvedValue(mockContract as any);

      await expect(service.createPlatformFeeIntent(99, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws UnprocessableEntityException if contract is not signed by both parties', async () => {
      repo.findContractById.mockResolvedValue({
        ...mockContract,
        signedByFreelancer: false,
      } as any);

      await expect(service.createPlatformFeeIntent(1, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException if platform fee is already paid', async () => {
      repo.findContractById.mockResolvedValue({
        ...mockContract,
        platformFeeStatus: PlatformFeeStatus.PAID,
      } as any);

      await expect(service.createPlatformFeeIntent(1, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('createMilestoneFundIntent', () => {
    it('creates escrow deposit payment intent for pending milestone', async () => {
      repo.findMilestoneById.mockResolvedValue(mockMilestone as any);
      stripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_milestone_fund',
        client_secret: 'pi_secret_456',
      } as any);
      repo.createTransaction.mockResolvedValue({} as any);

      const result = await service.createMilestoneFundIntent(1, 10, 20);

      expect(result).toEqual({
        clientSecret: 'pi_secret_456',
        paymentIntentId: 'pi_milestone_fund',
        amount: 250,
        currency: 'usd',
      });
      expect(repo.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          contractId: 10,
          milestoneId: 20,
          type: TransactionType.ESCROW_DEPOSIT,
          status: TransactionStatus.PENDING,
        }),
      );
    });

    it('throws UnprocessableEntityException if milestone is already funded', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);

      await expect(
        service.createMilestoneFundIntent(1, 10, 20),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('releaseMilestone', () => {
    it('transfers escrow amount to freelancer when milestone is funded and freelancer is onboarded', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);
      stripeService.createTransfer.mockResolvedValue({
        id: 'tr_payout_123',
      } as any);
      repo.updateMilestonePaymentStatus.mockResolvedValue({} as any);
      repo.createTransaction.mockResolvedValue({} as any);

      const result = await service.releaseMilestone(1, 10, 20);

      expect(result.success).toBe(true);
      expect(result.transferId).toBe('tr_payout_123');
      expect(stripeService.createTransfer).toHaveBeenCalledWith({
        amountInCents: 25000,
        currency: 'usd',
        destination: 'acct_freelancer_123',
        transferGroup: 'contract_10',
        metadata: expect.any(Object),
      });
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.RELEASED,
        MilestoneStatus.COMPLETED,
      );
    });

    it('throws UnprocessableEntityException if milestone is not funded', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.PENDING,
      } as any);

      await expect(service.releaseMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException if freelancer has no connected stripe account', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
        contract: {
          ...mockContract,
          freelancer: {
            ...mockFreelancer,
            stripeAccountId: null,
          },
        },
      } as any);

      await expect(service.releaseMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('refundMilestone', () => {
    it('refunds escrow deposit to client for funded milestone', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);
      repo.findEscrowDepositTransaction.mockResolvedValue({
        id: 77,
        stripePaymentIntentId: 'pi_original_deposit',
      } as any);
      stripeService.createRefund.mockResolvedValue({
        id: 're_refund_123',
      } as any);
      repo.updateMilestonePaymentStatus.mockResolvedValue({} as any);
      repo.createTransaction.mockResolvedValue({} as any);

      const result = await service.refundMilestone(1, 10, 20);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('re_refund_123');
      expect(stripeService.createRefund).toHaveBeenCalledWith({
        paymentIntentId: 'pi_original_deposit',
        metadata: expect.any(Object),
      });
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.REFUNDED,
      );
    });
  });

  describe('settleDispute', () => {
    const mockDispute = {
      id: 5,
      milestoneId: 20,
      decisionById: 99,
      arbitrationFee: new Prisma.Decimal(50),
      milestone: {
        id: 20,
        amount: new Prisma.Decimal(100),
        contract: mockContract,
      },
      fees: [
        { userId: 1, paymentIntentId: 'pi_client_fee' },
        { userId: 2, paymentIntentId: 'pi_freelancer_fee' },
      ],
      decisionBy: {
        id: 99,
        stripeAccountId: 'acct_expert_99',
        stripeOnboardingCompleted: true,
      },
    };

    it('settles split dispute with refund to client and transfer to freelancer', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
      repo.findEscrowDepositTransaction.mockResolvedValue({
        stripePaymentIntentId: 'pi_escrow_deposit',
      } as any);
      stripeService.createRefund.mockResolvedValue({
        id: 're_split_client',
      } as any);
      stripeService.createTransfer.mockResolvedValue({
        id: 'tr_split_freelancer',
      } as any);
      repo.createTransaction.mockResolvedValue({} as any);
      repo.updateDisputeStatus.mockResolvedValue({} as any);
      repo.updateMilestonePaymentStatus.mockResolvedValue({} as any);

      const result = await service.settleDispute(99, RoleName.EXPERT, 5, {
        clientAmount: 40,
        freelancerAmount: 60,
        winningParty: 'SPLIT',
        decisionReason: 'Work partially delivered',
      });

      expect(result.disputeId).toBe(5);
      expect(result.status).toBe('FINALIZED');
      expect(result.clientRefundAmount).toBe(40);
      expect(result.freelancerPayoutAmount).toBe(60);
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentIntentId: 'pi_escrow_deposit',
          amountInCents: 4000,
        }),
      );
      expect(stripeService.createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'acct_freelancer_123',
          amountInCents: 6000,
        }),
      );
    });

    it('throws BadRequestException if split sum does not match milestone amount', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      await expect(
        service.settleDispute(99, RoleName.EXPERT, 5, {
          clientAmount: 40,
          freelancerAmount: 40, // 80 != 100
          winningParty: 'SPLIT',
          decisionReason: 'Wrong split calculation',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if caller is neither admin nor assigned arbitrator', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);

      await expect(
        service.settleDispute(1, RoleName.CLIENT, 5, {
          clientAmount: 50,
          freelancerAmount: 50,
          winningParty: 'SPLIT',
          decisionReason: 'Unauthorized caller',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleWebhook', () => {
    it('handles payment_intent.succeeded for platform fee', async () => {
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              type: TransactionType.PLATFORM_FEE,
              contractId: '10',
            },
          },
        },
      } as any);
      repo.findTransactionByPaymentIntentId.mockResolvedValue({
        id: 101,
      } as any);
      repo.updateTransactionStatus.mockResolvedValue({} as any);
      repo.updateContractPlatformFee.mockResolvedValue({} as any);

      const result = await service.handleWebhook(
        Buffer.from('payload'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(repo.updateTransactionStatus).toHaveBeenCalledWith(
        101,
        TransactionStatus.SUCCEEDED,
      );
      expect(repo.updateContractPlatformFee).toHaveBeenCalledWith(
        10,
        PlatformFeeStatus.PAID,
      );
    });

    it('handles payment_intent.succeeded for escrow deposit', async () => {
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_escrow_123',
            metadata: {
              type: TransactionType.ESCROW_DEPOSIT,
              milestoneId: '20',
            },
          },
        },
      } as any);
      repo.findTransactionByPaymentIntentId.mockResolvedValue({
        id: 102,
      } as any);
      repo.updateTransactionStatus.mockResolvedValue({} as any);
      repo.updateMilestonePaymentStatus.mockResolvedValue({} as any);

      const result = await service.handleWebhook(
        Buffer.from('payload'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.FUNDED,
      );
    });
  });

  describe('getTransactions', () => {
    it('filters by userId for non-admin roles', async () => {
      repo.getTransactions.mockResolvedValue({
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      } as any);

      await service.getTransactions(1, RoleName.CLIENT, { page: 1, limit: 10 });

      expect(repo.getTransactions).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { userId: 1 },
      );
    });

    it('queries all transactions without userId filter for admin role', async () => {
      repo.getTransactions.mockResolvedValue({
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      } as any);

      await service.getTransactions(999, RoleName.ADMIN, {
        page: 1,
        limit: 10,
      });

      expect(repo.getTransactions).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {},
      );
    });
  });
});
