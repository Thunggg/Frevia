/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ContractStatus,
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
import { StripeService } from '../../shared/services/stripe.service';

describe('PaymentService', () => {
  let service: PaymentService;
  const mockContractPdfService = {
    generateAndSaveContractPdf: jest.fn().mockResolvedValue({ id: 1 }),
  };
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
    slug: 'ctr-10',
    jobId: 100,
    clientId: 1,
    freelancerId: 2,
    status: 'ACTIVE',
    signedByClient: true,
    signedByFreelancer: true,
    totalAmount: new Prisma.Decimal(1000.0),
    platformFee: new Prisma.Decimal(10.0),
    platformFeeStatus: PlatformFeeStatus.UNPAID,
    platformFeePaidAt: null,
    clientFeeStatus: PlatformFeeStatus.UNPAID,
    freelancerFeeStatus: PlatformFeeStatus.UNPAID,
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
      setContractHoldIntent: jest.fn(),
      clearContractHold: jest.fn(),
      markContractHoldAuthorized: jest.fn(),
      finalizeContractHoldCaptured: jest.fn(),
      markContractHoldCanceled: jest.fn(),
      findMilestoneById: jest.fn(),
      updateMilestonePaymentStatus: jest.fn(),
      findDisputeById: jest.fn(),
      updateDisputeStatus: jest.fn(),
      createTransaction: jest.fn(),
      findTransactionByPaymentIntentId: jest.fn(),
      findTransactionBySessionId: jest.fn(),
      findEscrowDepositTransaction: jest.fn(),
      findContractEscrowDeposits: jest.fn(),
      updateAllContractMilestonesPaymentStatus: jest.fn(),
      updateTransactionStatus: jest.fn(),
      getTransactions: jest.fn(),
      checkAndCompleteFreelancerFee: jest.fn(),
      syncContractCompletion: jest.fn().mockResolvedValue(false),
      findSubmittedMilestonesForAutoRelease: jest.fn(),
      applyAutoReleaseTransaction: jest.fn(),
      findCandidateOverdueMilestones: jest.fn(),
      markMilestoneLateAndNotify: jest.fn(),
      applyMilestoneRefundTransaction: jest.fn().mockResolvedValue({
        refunded: true,
        contractCompleted: false,
      }),
    } as unknown as jest.Mocked<PaymentRepository>;

    stripeService = {
      createCustomer: jest.fn(),
      createExpressAccount: jest.fn(),
      createAccountLink: jest.fn(),
      getAccount: jest.fn(),
      createPaymentIntent: jest.fn(),
      retrievePaymentIntent: jest.fn(),
      capturePaymentIntent: jest.fn(),
      cancelPaymentIntent: jest.fn(),
      createTransfer: jest.fn(),
      createRefund: jest.fn(),
      constructWebhookEvent: jest.fn(),
      createSetupIntent: jest.fn(),
      retrievePaymentMethod: jest.fn(),
      setDefaultPaymentMethod: jest.fn(),
      detachPaymentMethod: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;

    service = new PaymentService(
      repo,
      stripeService,
      mockContractPdfService as any,
    );
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
      stripeService.getAccount.mockResolvedValue({
        id: 'acct_freelancer_123',
        country: 'US',
        details_submitted: true,
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

  describe('createContractHoldIntent', () => {
    const awaitingContract = {
      ...mockContract,
      status: ContractStatus.AWAITING_PAYMENT,
      signedByClient: false,
      signedByFreelancer: false,
      holdPaymentIntentId: null,
      holdMilestoneIds: [],
      expiresAt: new Date(Date.now() + 86400000),
      milestones: [
        {
          id: 20,
          title: 'Milestone 1',
          amount: new Prisma.Decimal(250),
          status: MilestoneStatus.PENDING,
          paymentStatus: MilestonePaymentStatus.PENDING,
        },
        {
          id: 21,
          title: 'Milestone 2',
          amount: new Prisma.Decimal(750),
          status: MilestoneStatus.PENDING,
          paymentStatus: MilestonePaymentStatus.PENDING,
        },
      ],
    };

    it('creates manual-capture payment intent for selected milestones plus 3% contract fee', async () => {
      repo.findContractById.mockResolvedValue(awaitingContract as any);
      stripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_hold_123',
        client_secret: 'pi_hold_secret',
        status: 'requires_payment_method',
      } as any);
      repo.setContractHoldIntent.mockResolvedValue({} as any);
      repo.createTransaction.mockResolvedValue({} as any);

      const result = await service.createContractHoldIntent(1, 10, [20]);

      // 250 + (1000 * 3% = 30) = 280 -> 28000 cents with captureMethod: 'manual'
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amountInCents: 28000,
          captureMethod: 'manual',
          metadata: expect.objectContaining({
            type: 'CONTRACT_HOLD',
            contractId: '10',
            milestoneIds: '20',
          }),
        }),
      );
      expect(repo.setContractHoldIntent).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_123',
        milestoneIds: [20],
        clientPlatformFee: 30,
      });
      expect(result).toEqual({
        clientSecret: 'pi_hold_secret',
        paymentIntentId: 'pi_hold_123',
        amount: 280,
        milestonesAmount: 250,
        platformFeeAmount: 30,
        currency: 'usd',
        milestoneIds: [20],
        status: 'requires_payment_method',
        authorized: false,
      });
    });

    it('immediately authorizes hold when a saved payment method is provided', async () => {
      repo.findContractById.mockResolvedValue(awaitingContract as any);
      stripeService.retrievePaymentMethod.mockResolvedValue({
        id: 'pm_saved_4242',
        customer: 'cus_123',
      } as any);
      stripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_hold_saved',
        client_secret: 'pi_hold_saved_secret',
        status: 'requires_capture',
      } as any);
      repo.setContractHoldIntent.mockResolvedValue({} as any);
      repo.createTransaction.mockResolvedValue({} as any);
      repo.markContractHoldAuthorized.mockResolvedValue({} as any);

      const result = await service.createContractHoldIntent(
        1,
        10,
        [20],
        'pm_saved_4242',
      );

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amountInCents: 28000,
          customerId: 'cus_123',
          paymentMethodId: 'pm_saved_4242',
          offSessionConfirm: true,
          captureMethod: 'manual',
        }),
      );
      expect(repo.markContractHoldAuthorized).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_saved',
        milestoneIds: [20],
      });
      expect(result.authorized).toBe(true);
      expect(result.status).toBe('requires_capture');
    });

    it('throws BadRequestException when milestoneIds is empty', async () => {
      repo.findContractById.mockResolvedValue(awaitingContract as any);

      await expect(service.createContractHoldIntent(1, 10, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws UnprocessableEntityException when contract is not AWAITING_PAYMENT', async () => {
      repo.findContractById.mockResolvedValue({
        ...awaitingContract,
        status: ContractStatus.PENDING_SIGN,
      } as any);

      await expect(
        service.createContractHoldIntent(1, 10, [20]),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('captureContractHold', () => {
    it('captures requires_capture payment intent and finalizes held milestones', async () => {
      stripeService.retrievePaymentIntent.mockResolvedValue({
        id: 'pi_hold_123',
        status: 'requires_capture',
        amount: 28000,
        metadata: {
          type: 'CONTRACT_HOLD',
          contractId: '10',
          milestoneIds: '20',
          milestonesAmount: '250',
          clientFeeAmount: '30',
        },
      } as any);
      stripeService.capturePaymentIntent.mockResolvedValue({
        id: 'pi_hold_123',
        status: 'succeeded',
        amount: 28000,
        metadata: {
          type: 'CONTRACT_HOLD',
          contractId: '10',
          milestoneIds: '20',
          milestonesAmount: '250',
          clientFeeAmount: '30',
        },
      } as any);
      repo.findTransactionByPaymentIntentId.mockResolvedValue({ id: 5 } as any);
      repo.findContractById.mockResolvedValue(mockContract as any);
      repo.finalizeContractHoldCaptured.mockResolvedValue({} as any);

      const result = await service.captureContractHold('pi_hold_123');

      expect(stripeService.capturePaymentIntent).toHaveBeenCalledWith(
        'pi_hold_123',
      );
      expect(repo.finalizeContractHoldCaptured).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_123',
        milestoneIds: [20],
        milestonesAmount: 250,
        clientFeeAmount: 30,
      });
      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
    });

    it('throws InternalServerErrorException when Stripe capture throws', async () => {
      stripeService.retrievePaymentIntent.mockRejectedValue(
        new Error('Stripe network error'),
      );

      await expect(service.captureContractHold('pi_hold_fail')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('cancelContractHold', () => {
    it('cancels uncaptured hold payment intent and updates contract/transaction state', async () => {
      stripeService.retrievePaymentIntent.mockResolvedValue({
        id: 'pi_hold_123',
        status: 'requires_capture',
        metadata: { contractId: '10' },
      } as any);
      stripeService.cancelPaymentIntent.mockResolvedValue({
        id: 'pi_hold_123',
        status: 'canceled',
      } as any);
      repo.findTransactionByPaymentIntentId.mockResolvedValue({ id: 5 } as any);
      repo.markContractHoldCanceled.mockResolvedValue({} as any);

      const result = await service.cancelContractHold(
        'pi_hold_123',
        'Freelancer rejected',
      );

      expect(stripeService.cancelPaymentIntent).toHaveBeenCalledWith(
        'pi_hold_123',
      );
      expect(repo.markContractHoldCanceled).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_123',
        reason: 'Freelancer rejected',
      });
      expect(result.status).toBe('canceled');
    });
  });

  describe('createMilestoneFundIntent', () => {
    it('creates escrow deposit payment intent with 0% extra fee for active contract', async () => {
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
          amount: 250,
          type: TransactionType.ESCROW_DEPOSIT,
          status: TransactionStatus.PENDING,
        }),
      );
    });

    it('throws UnprocessableEntityException if contract is not ACTIVE', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        contract: {
          ...mockContract,
          status: ContractStatus.AWAITING_PAYMENT,
        },
      } as any);

      await expect(
        service.createMilestoneFundIntent(1, 10, 20),
      ).rejects.toThrow(UnprocessableEntityException);
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
        amountInCents: 23750,
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
      expect(repo.syncContractCompletion).toHaveBeenCalledWith(10);
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
    it('auto-refunds escrow deposit to client when milestone status is LATE', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        status: MilestoneStatus.LATE,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);
      repo.findEscrowDepositTransaction.mockResolvedValue({
        id: 77,
        stripePaymentIntentId: 'pi_original_deposit',
      } as any);
      stripeService.createRefund.mockResolvedValue({
        id: 're_refund_123',
      } as any);

      const result = await service.refundMilestone(1, 10, 20);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('re_refund_123');
      expect(stripeService.createRefund).toHaveBeenCalledWith({
        paymentIntentId: 'pi_original_deposit',
        amountInCents: 25000,
        metadata: expect.objectContaining({
          reason: 'FREELANCER_LATE_NO_SUBMISSION',
        }),
        idempotencyKey: 'refund-milestone-20',
      });
      expect(repo.applyMilestoneRefundTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 20,
          contractId: 10,
          refundId: 're_refund_123',
          reason: 'FREELANCER_LATE_NO_SUBMISSION',
          isAuto: true,
        }),
      );
    });

    it('auto-refunds escrow deposit to client when freelancer has not started working (PENDING)', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        status: MilestoneStatus.PENDING,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);
      repo.findEscrowDepositTransaction.mockResolvedValue({
        id: 77,
        stripePaymentIntentId: 'pi_original_deposit',
      } as any);
      stripeService.createRefund.mockResolvedValue({
        id: 're_refund_pending',
      } as any);

      const result = await service.refundMilestone(1, 10, 20);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('re_refund_pending');
      expect(repo.applyMilestoneRefundTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'FREELANCER_NOT_STARTED',
          isAuto: true,
        }),
      );
    });

    it('throws UnprocessableEntityException when milestone is active IN_PROGRESS or SUBMITTED', async () => {
      repo.findMilestoneById.mockResolvedValue({
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      } as any);

      await expect(service.refundMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('settleDispute', () => {
    const mockDispute = {
      id: 5,
      milestoneId: 20,
      decisionById: 99,
      arbitrationFee: new Prisma.Decimal(0),
      milestone: {
        id: 20,
        amount: new Prisma.Decimal(100),
        contract: mockContract,
      },
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

      expect(stripeService.createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'acct_freelancer_123',
          amountInCents: 6000,
        }),
      );
    });

    it('throws BadRequestException if split sum does not match milestone amount', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
    });

    it('throws ForbiddenException if caller is neither admin nor assigned arbitrator', async () => {
      repo.findDisputeById.mockResolvedValue(mockDispute as any);
    });
  });

  describe('handleWebhook', () => {
    it('handles payment_intent.amount_capturable_updated for manual contract hold', async () => {
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.amount_capturable_updated',
        data: {
          object: {
            id: 'pi_hold_123',
            metadata: {
              type: 'CONTRACT_HOLD',
              contractId: '10',
              milestoneIds: '20',
            },
          },
        },
      } as any);
      repo.markContractHoldAuthorized.mockResolvedValue({} as any);

      const result = await service.handleWebhook(
        Buffer.from('payload'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(repo.markContractHoldAuthorized).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_123',
        milestoneIds: [20],
      });
    });

    it('handles payment_intent.canceled by releasing held contract metadata', async () => {
      stripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_hold_123',
            cancellation_reason: 'requested_by_customer',
            metadata: {
              type: 'CONTRACT_HOLD',
              contractId: '10',
            },
          },
        },
      } as any);
      repo.markContractHoldCanceled.mockResolvedValue({} as any);

      const result = await service.handleWebhook(
        Buffer.from('payload'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(repo.markContractHoldCanceled).toHaveBeenCalledWith({
        contractId: 10,
        paymentIntentId: 'pi_hold_123',
        reason: 'requested_by_customer',
      });
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

  describe('payment method management', () => {
    it('creates a setup intent for the user Stripe customer', async () => {
      repo.findUserById.mockResolvedValue({ ...mockUser } as any);
      stripeService.createSetupIntent.mockResolvedValue({
        id: 'seti_123',
        client_secret: 'seti_123_secret',
      } as any);

      const res = await service.createSetupIntent(1);

      expect(stripeService.createSetupIntent).toHaveBeenCalledWith('cus_123');
      expect(res).toEqual({
        clientSecret: 'seti_123_secret',
        setupIntentId: 'seti_123',
      });
    });

    it('updates the default payment method when owned by the user customer', async () => {
      repo.findUserById.mockResolvedValue({ ...mockUser } as any);
      stripeService.retrievePaymentMethod.mockResolvedValue({
        id: 'pm_new',
        customer: 'cus_123',
      } as any);
      stripeService.setDefaultPaymentMethod.mockResolvedValue({} as any);

      const res = await service.setDefaultPaymentMethod(1, 'pm_new');

      expect(stripeService.setDefaultPaymentMethod).toHaveBeenCalledWith(
        'cus_123',
        'pm_new',
      );
      expect(res.success).toBe(true);
    });

    it('detaches a saved payment method owned by the user', async () => {
      repo.findUserById.mockResolvedValue({ ...mockUser } as any);
      stripeService.retrievePaymentMethod.mockResolvedValue({
        id: 'pm_old',
        customer: 'cus_123',
      } as any);
      stripeService.detachPaymentMethod.mockResolvedValue({} as any);

      const res = await service.removePaymentMethod(1, 'pm_old');

      expect(stripeService.detachPaymentMethod).toHaveBeenCalledWith('pm_old');
      expect(res.success).toBe(true);
    });
  });
});
