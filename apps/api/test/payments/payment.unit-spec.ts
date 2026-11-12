import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DisputeFeeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  PlatformFeeStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  DisputeSettlementBodySchema,
  DisputeSettlementBodyType,
  GetTransactionListQuerySchema,
  GetTransactionListQueryType,
  RoleName,
} from '@shared/types';
import type Stripe from 'stripe';
import {
  DisputeFeeAlreadyPaidException,
  DisputeSettlementInvalidAmountException,
  PaymentForbiddenException,
  WebhookSignatureInvalidException,
} from '../../src/routes/payments/payment.error';
import { PaymentRepository } from '../../src/routes/payments/payment.repo';
import { PaymentService } from '../../src/routes/payments/payment.service';
import { StripeService } from '../../src/routes/payments/stripe.service';
import { ContractPdfService } from '../../src/shared/services/contract-pdf.service';

describe('Payment Management (UF-153 to UF-165)', () => {
  const repo = {
    findUserById: jest.fn(),
    updateUserStripe: jest.fn(),
    findContractById: jest.fn(),
    recordPartyPlatformFeePaid: jest.fn(),
    activateContractIfReady: jest.fn(),
    updateContractPlatformFee: jest.fn(),
    findMilestoneById: jest.fn(),
    updateMilestonePaymentStatus: jest.fn(),
    findDisputeById: jest.fn(),
    findDisputeFee: jest.fn(),
    updateDisputeFeeStatus: jest.fn(),
    updateDisputeStatus: jest.fn(),
    createTransaction: jest.fn(),
    findTransactionById: jest.fn(),
    findTransactionByPaymentIntentId: jest.fn(),
    findTransactionBySessionId: jest.fn(),
    findEscrowDepositTransaction: jest.fn(),
    updateTransactionStatus: jest.fn(),
    getTransactions: jest.fn(),
    checkAndCompleteFreelancerFee: jest.fn(),
    handleEscrowDepositSuccess: jest.fn(),
  };

  const stripeService = {
    createCustomer: jest.fn(),
    createExpressAccount: jest.fn(),
    createAccountLink: jest.fn(),
    createBillingPortalSession: jest.fn(),
    createCustomerPortalSession: jest.fn(),
    createCheckoutSession: jest.fn(),
    retrieveCheckoutSession: jest.fn(),
    getAccount: jest.fn(),
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    createTransfer: jest.fn(),
    createRefund: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  const contractPdfService = {
    generateAndSaveContractPdf: jest.fn(),
  };

  const service = new PaymentService(
    repo as unknown as PaymentRepository,
    stripeService as unknown as StripeService,
    contractPdfService as unknown as ContractPdfService,
  );

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockUser = {
    id: 1,
    email: 'client@example.com',
    fullName: 'Client User',
    stripeCustomerId: 'cus_client_123',
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
    totalAmount: new Prisma.Decimal(1000.0),
    platformFee: new Prisma.Decimal(10.0),
    platformFeeStatus: PlatformFeeStatus.UNPAID,
    platformFeePaidAt: null,
    clientFeeStatus: PlatformFeeStatus.UNPAID,
    freelancerFeeStatus: PlatformFeeStatus.UNPAID,
    client: {
      id: 1,
      email: 'client@example.com',
      stripeCustomerId: 'cus_client_123',
    },
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

  const mockTransaction = {
    id: 77,
    userId: 1,
    contractId: 10,
    milestoneId: 20,
    disputeId: null,
    amount: new Prisma.Decimal(250.0),
    currency: 'usd',
    type: TransactionType.ESCROW_DEPOSIT,
    status: TransactionStatus.SUCCEEDED,
    stripePaymentIntentId: 'pi_escrow_deposit',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-153: getOnboardingLink
  // =========================================================================
  describe('UF-153 getOnboardingLink', () => {
    // UF-153: Tạo tài khoản Stripe Express mới và trả về liên kết onboarding khi người dùng chưa có tài khoản.
    it('creates new stripe express account and returns onboarding link', async () => {
      repo.findUserById.mockResolvedValueOnce({
        ...mockUser,
        stripeAccountId: null,
      });
      stripeService.createExpressAccount.mockResolvedValueOnce({
        id: 'acct_new_123',
      });
      repo.updateUserStripe.mockResolvedValueOnce({});
      stripeService.createAccountLink.mockResolvedValueOnce({
        url: 'https://connect.stripe.com/setup/s/123',
      });

      const result = await service.getOnboardingLink(1);

      expect(result).toEqual({
        onboardingUrl: 'https://connect.stripe.com/setup/s/123',
      });
      expect(stripeService.createExpressAccount).toHaveBeenCalledWith(
        'client@example.com',
      );
      expect(repo.updateUserStripe).toHaveBeenCalledWith(1, {
        stripeAccountId: 'acct_new_123',
      });
    });

    // Tái sử dụng tài khoản Stripe Connect đã có sẵn và tạo liên kết tiếp tục hoàn thiện hồ sơ.
    it('reuses existing stripe account and returns account link', async () => {
      repo.findUserById.mockResolvedValueOnce(mockFreelancer);
      stripeService.getAccount.mockResolvedValueOnce({
        id: 'acct_freelancer_123',
        details_submitted: true,
      });
      stripeService.createAccountLink.mockResolvedValueOnce({
        url: 'https://connect.stripe.com/express/onboarding',
      });

      const result = await service.getOnboardingLink(2);

      expect(result.onboardingUrl).toBe(
        'https://connect.stripe.com/express/onboarding',
      );
      expect(stripeService.createExpressAccount).not.toHaveBeenCalled();
    });

    // Lấy trạng thái kết nối Stripe Connect của Freelancer.
    it('returns stripe connect status for freelancer', async () => {
      repo.findUserById.mockResolvedValueOnce({
        ...mockFreelancer,
        stripeOnboardingCompleted: false,
      });
      stripeService.getAccount.mockResolvedValueOnce({
        id: 'acct_freelancer_123',
        payouts_enabled: true,
        charges_enabled: true,
      });
      repo.updateUserStripe.mockResolvedValueOnce({});

      const status = await service.getConnectStatus(2);

      expect(status.isConnected).toBe(true);
      expect(status.payoutsEnabled).toBe(true);
      expect(repo.updateUserStripe).toHaveBeenCalledWith(2, {
        stripeOnboardingCompleted: true,
      });
    });

    // Tạo phiên Stripe Customer Portal cho khách hàng quản lý thẻ thanh toán.
    it('creates customer portal session for client', async () => {
      repo.findUserById.mockResolvedValueOnce(mockUser);
      stripeService.createBillingPortalSession.mockResolvedValueOnce({
        url: 'https://billing.stripe.com/session/123',
      });

      const result = await service.getCustomerPortalLink(1);

      expect(result).toEqual({
        portalUrl: 'https://billing.stripe.com/session/123',
      });
    });

    // Ném ngoại lệ PaymentForbiddenException khi người dùng không tồn tại.
    it('throws PaymentForbiddenException when user is not found', async () => {
      repo.findUserById.mockResolvedValueOnce(null);

      await expect(service.getOnboardingLink(999)).rejects.toThrow(
        PaymentForbiddenException(),
      );
    });
  });

  // =========================================================================
  // UF-154: viewPayoutHistory
  // =========================================================================
  describe('UF-154 viewPayoutHistory', () => {
    // UF-154: Lấy danh sách lịch sử các giao dịch rút tiền của freelancer kèm phân trang.
    it('returns paginated payout transactions for freelancer', async () => {
      const payoutTx = {
        ...mockTransaction,
        type: TransactionType.MILESTONE_PAYOUT,
      };
      repo.getTransactions.mockResolvedValueOnce({
        data: [payoutTx],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetTransactionListQueryType = {
        page: 1,
        limit: 10,
        type: TransactionType.MILESTONE_PAYOUT,
      };
      const result = await service.getTransactions(
        2,
        RoleName.FREELANCER,
        query,
      );

      expect(result.data).toHaveLength(1);
      expect(repo.getTransactions).toHaveBeenCalledWith(query, { userId: 2 });
    });

    // Lọc danh sách giao dịch rút tiền theo trạng thái hoàn thành.
    it('filters payout history by SUCCEEDED status cleanly', async () => {
      repo.getTransactions.mockResolvedValueOnce({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetTransactionListQueryType = {
        page: 1,
        limit: 10,
        status: TransactionStatus.SUCCEEDED,
      };
      const result = await service.getTransactions(
        2,
        RoleName.FREELANCER,
        query,
      );

      expect(result.data).toHaveLength(1);
    });
  });

  // =========================================================================
  // UF-155: viewPayoutDetail
  // =========================================================================
  describe('UF-155 viewPayoutDetail', () => {
    // UF-155: Lấy thông tin chi tiết một giao dịch chuyển tiền payout theo ID cho người sở hữu.
    it('returns payout transaction detail by ID for owner', async () => {
      repo.findTransactionById.mockResolvedValueOnce(mockTransaction);

      const result = await repo.findTransactionById(77);

      expect(result).toEqual(mockTransaction);
      expect(repo.findTransactionById).toHaveBeenCalledWith(77);
    });

    // Trả về null khi mã giao dịch rút tiền không tồn tại trong hệ thống.
    it('returns null when payout transaction ID does not exist', async () => {
      repo.findTransactionById.mockResolvedValueOnce(null);

      const result = await repo.findTransactionById(999);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // UF-156: fundMilestone
  // =========================================================================
  describe('UF-156 fundMilestone', () => {
    // UF-156: Tạo PaymentIntent để nạp tiền vào quỹ ký quỹ của milestone.
    it('creates milestone funding payment intent for client', async () => {
      repo.findMilestoneById.mockResolvedValueOnce(mockMilestone);
      stripeService.createPaymentIntent.mockResolvedValueOnce({
        id: 'pi_milestone_fund',
        client_secret: 'pi_secret_456',
      });
      repo.createTransaction.mockResolvedValueOnce(mockTransaction);

      const result = await service.createMilestoneFundIntent(1, 10, 20);

      expect(result).toEqual({
        clientSecret: 'pi_secret_456',
        paymentIntentId: 'pi_milestone_fund',
        amount: 280,
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

    // Nạp tiền ký quỹ milestone thành công thông qua phiên Checkout Session.
    it('creates milestone funding checkout session cleanly', async () => {
      repo.findMilestoneById.mockResolvedValueOnce(mockMilestone);
      stripeService.createCheckoutSession.mockResolvedValueOnce({
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      });
      repo.createTransaction.mockResolvedValueOnce(mockTransaction);

      const result = await service.createMilestoneFundCheckoutSession(
        1,
        10,
        20,
      );

      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_session',
        sessionId: 'cs_test_session',
      });
    });

    // Ném ngoại lệ UnprocessableEntityException khi milestone đã được nạp tiền ký quỹ trước đó.
    it('throws UnprocessableEntityException when milestone is already funded', async () => {
      repo.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      });

      await expect(
        service.createMilestoneFundIntent(1, 10, 20),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    // Ném ngoại lệ ForbiddenException khi người thực hiện nạp tiền không phải là khách hàng của hợp đồng.
    it('throws ForbiddenException when non-client attempts to fund milestone', async () => {
      repo.findMilestoneById.mockResolvedValueOnce(mockMilestone);

      await expect(
        service.createMilestoneFundIntent(99, 10, 20),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // UF-157: refundPayment
  // =========================================================================
  describe('UF-157 refundPayment', () => {
    // UF-157: Hoàn lại tiền ký quỹ milestone thành công cho khách hàng qua Stripe.
    it('refunds escrow deposit to client for funded milestone', async () => {
      repo.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      });
      repo.findEscrowDepositTransaction.mockResolvedValueOnce({
        id: 77,
        stripePaymentIntentId: 'pi_original_deposit',
      });
      stripeService.createRefund.mockResolvedValueOnce({ id: 're_refund_123' });
      repo.updateMilestonePaymentStatus.mockResolvedValueOnce({});
      repo.createTransaction.mockResolvedValueOnce({});

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

    // Ném ngoại lệ UnprocessableEntityException khi cố hoàn tiền cho milestone chưa được nạp tiền.
    it('throws UnprocessableEntityException when attempting to refund unfunded milestone', async () => {
      repo.findMilestoneById.mockResolvedValueOnce(mockMilestone);

      await expect(service.refundMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // =========================================================================
  // UF-158: payPlatformFee
  // =========================================================================
  describe('UF-158 payPlatformFee', () => {
    // UF-158: Tạo PaymentIntent thanh toán phí nền tảng kích hoạt hợp đồng thành công.
    it('creates platform fee payment intent for signed contract', async () => {
      repo.findContractById.mockResolvedValueOnce(mockContract);
      stripeService.createPaymentIntent.mockResolvedValueOnce({
        id: 'pi_platform_fee',
        client_secret: 'pi_secret_123',
      });
      repo.createTransaction.mockResolvedValueOnce(mockTransaction);

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
        }),
      );
    });

    // Ném ngoại lệ UnprocessableEntityException khi phí nền tảng của hợp đồng đã được thanh toán.
    it('throws UnprocessableEntityException when platform fee is already paid', async () => {
      repo.findContractById.mockResolvedValueOnce({
        ...mockContract,
        platformFeeStatus: PlatformFeeStatus.PAID,
        clientFeeStatus: PlatformFeeStatus.PAID,
      });

      await expect(service.createPlatformFeeIntent(1, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    // Ném ngoại lệ UnprocessableEntityException khi hợp đồng chưa được ký đủ bởi cả hai bên.
    it('throws UnprocessableEntityException when contract is not signed by freelancer', async () => {
      repo.findContractById.mockResolvedValueOnce({
        ...mockContract,
        signedByFreelancer: false,
      });

      await expect(service.createPlatformFeeIntent(1, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // =========================================================================
  // UF-159: releasePayment
  // =========================================================================
  describe('UF-159 releasePayment', () => {
    // UF-159: Giải ngân thanh toán ký quỹ của milestone cho Freelancer qua chuyển khoản Stripe Connect.
    it('transfers escrow amount to freelancer when milestone is funded and freelancer is onboarded', async () => {
      repo.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      });
      stripeService.createTransfer.mockResolvedValueOnce({
        id: 'tr_payout_123',
      });
      repo.updateMilestonePaymentStatus.mockResolvedValueOnce({});
      repo.createTransaction.mockResolvedValueOnce({});

      const result = await service.releaseMilestone(1, 10, 20);

      expect(result.success).toBe(true);
      expect(result.transferId).toBe('tr_payout_123');
      expect(stripeService.createTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'acct_freelancer_123',
          transferGroup: 'contract_10',
        }),
      );
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.RELEASED,
        MilestoneStatus.COMPLETED,
      );
    });

    // Ném ngoại lệ UnprocessableEntityException khi giải ngân milestone chưa được nạp tiền ký quỹ.
    it('throws UnprocessableEntityException when releasing unfunded milestone', async () => {
      repo.findMilestoneById.mockResolvedValueOnce(mockMilestone);

      await expect(service.releaseMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    // Ném ngoại lệ UnprocessableEntityException khi Freelancer chưa liên kết tài khoản Stripe nhận tiền.
    it('throws UnprocessableEntityException when freelancer has no connected stripe account', async () => {
      repo.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
        contract: {
          ...mockContract,
          freelancer: { ...mockFreelancer, stripeAccountId: null },
        },
      });

      await expect(service.releaseMilestone(1, 10, 20)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // =========================================================================
  // UF-160: payDisputeFee
  // =========================================================================
  describe('UF-160 payDisputeFee', () => {
    const mockDispute = {
      id: 5,
      openedById: 1,
      respondentId: 2,
      milestone: mockMilestone,
    };

    const mockFee = {
      id: 88,
      disputeId: 5,
      userId: 1,
      amount: new Prisma.Decimal(50.0),
      status: DisputeFeeStatus.PENDING,
    };

    // UF-160: Tạo PaymentIntent thanh toán phí trọng tài tranh chấp cho bên tham gia.
    it('creates dispute fee payment intent for dispute participant', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDispute);
      repo.findDisputeFee.mockResolvedValueOnce(mockFee);
      repo.findUserById.mockResolvedValueOnce(mockUser);
      stripeService.createPaymentIntent.mockResolvedValueOnce({
        id: 'pi_dispute_fee',
        client_secret: 'pi_dispute_secret',
      });
      repo.updateDisputeFeeStatus.mockResolvedValueOnce({});
      repo.createTransaction.mockResolvedValueOnce({});

      const result = await service.createDisputeFeeIntent(1, 5);

      expect(result).toEqual({
        clientSecret: 'pi_dispute_secret',
        paymentIntentId: 'pi_dispute_fee',
        amount: 50,
        currency: 'usd',
      });
    });

    // Ném ngoại lệ DisputeFeeAlreadyPaidException khi phí trọng tài đã được nạp trước đó.
    it('throws DisputeFeeAlreadyPaidException when dispute fee is already paid', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDispute);
      repo.findDisputeFee.mockResolvedValueOnce({
        ...mockFee,
        status: DisputeFeeStatus.PAID,
      });

      await expect(service.createDisputeFeeIntent(1, 5)).rejects.toThrow(
        DisputeFeeAlreadyPaidException(),
      );
    });

    // Ném ngoại lệ PaymentForbiddenException khi người ngoài không thuộc tranh chấp cố nạp phí.
    it('throws PaymentForbiddenException when non-participant pays dispute fee', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDispute);

      await expect(service.createDisputeFeeIntent(99, 5)).rejects.toThrow(
        PaymentForbiddenException(),
      );
    });
  });

  // =========================================================================
  // UF-161: viewPaymentHistory
  // =========================================================================
  describe('UF-161 viewPaymentHistory', () => {
    // UF-161: Lấy danh sách lịch sử giao dịch cá nhân của người dùng kèm phân trang.
    it('returns paginated transactions for authenticated user', async () => {
      repo.getTransactions.mockResolvedValueOnce({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetTransactionListQueryType = { page: 1, limit: 10 };
      const result = await service.getTransactions(1, RoleName.CLIENT, query);

      expect(result.data).toHaveLength(1);
      expect(repo.getTransactions).toHaveBeenCalledWith(query, { userId: 1 });
    });

    // Quản trị viên hệ thống có quyền lấy toàn bộ lịch sử giao dịch không giới hạn người dùng.
    it('returns all system transactions for admin role', async () => {
      repo.getTransactions.mockResolvedValueOnce({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetTransactionListQueryType = { page: 1, limit: 10 };
      const result = await service.getTransactions(99, RoleName.ADMIN, query);

      expect(result.data).toHaveLength(1);
      expect(repo.getTransactions).toHaveBeenCalledWith(query, {});
    });

    // Schema query từ chối khi limit vượt quá 50.
    it('rejects limit > 50 through GetTransactionListQuerySchema', () => {
      const parsed = GetTransactionListQuerySchema.safeParse({ limit: 100 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-162: viewPaymentDetail
  // =========================================================================
  describe('UF-162 viewPaymentDetail', () => {
    // UF-162: Lấy thông tin chi tiết của một giao dịch thanh toán thành công theo ID.
    it('returns transaction detail by ID from repository', async () => {
      repo.findTransactionById.mockResolvedValueOnce(mockTransaction);

      const result = await repo.findTransactionById(77);

      expect(result).toEqual(mockTransaction);
      expect(repo.findTransactionById).toHaveBeenCalledWith(77);
    });

    // Trả về null khi mã giao dịch không tồn tại trong hệ thống.
    it('returns null when transaction ID is not found', async () => {
      repo.findTransactionById.mockResolvedValueOnce(null);

      const result = await repo.findTransactionById(999);

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // UF-163: settleDispute
  // =========================================================================
  describe('UF-163 settleDispute', () => {
    const mockDisputeForSettlement = {
      id: 5,
      milestoneId: 20,
      decisionById: 99,
      arbitrationFee: new Prisma.Decimal(50.0),
      milestone: {
        id: 20,
        amount: new Prisma.Decimal(100.0),
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

    // UF-163: Quản trị viên thực hiện giải ngân thanh toán phán quyết tranh chấp theo tỷ lệ phân chia thành công.
    it('settles split dispute with refund to client and transfer to freelancer', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDisputeForSettlement);
      repo.findEscrowDepositTransaction.mockResolvedValueOnce({
        stripePaymentIntentId: 'pi_escrow_deposit',
      });
      stripeService.createRefund.mockResolvedValueOnce({
        id: 're_split_client',
      });
      stripeService.createTransfer.mockResolvedValue({
        id: 'tr_split_transfer',
      });
      repo.createTransaction.mockResolvedValue({});
      repo.updateDisputeStatus.mockResolvedValueOnce({});
      repo.updateMilestonePaymentStatus.mockResolvedValueOnce({});

      const body: DisputeSettlementBodyType = {
        clientAmount: 40,
        freelancerAmount: 60,
        winningParty: 'CLIENT',
        decisionReason: 'Arbitration split decision',
      };

      const result = await service.settleDispute(99, RoleName.ADMIN, 5, body);

      expect(result.status).toBe('FINALIZED');
      expect(result.clientRefundAmount).toBe(40);
      expect(result.freelancerPayoutAmount).toBe(60);
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({ paymentIntentId: 'pi_escrow_deposit' }),
      );
    });

    // Ném ngoại lệ DisputeSettlementInvalidAmountException khi tổng số tiền phân bổ không bằng số tiền milestone.
    it('throws DisputeSettlementInvalidAmountException when split sum differs from milestone amount', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDisputeForSettlement);

      const body: DisputeSettlementBodyType = {
        clientAmount: 40,
        freelancerAmount: 40,
        winningParty: 'SPLIT',
        decisionReason: 'Arbitration split decision',
      };

      await expect(
        service.settleDispute(99, RoleName.ADMIN, 5, body),
      ).rejects.toThrow(DisputeSettlementInvalidAmountException());
    });

    // Ném ngoại lệ PaymentForbiddenException khi người thực hiện không phải Admin hoặc Trọng tài viên được giao.
    it('throws PaymentForbiddenException when unauthorized user attempts settlement', async () => {
      repo.findDisputeById.mockResolvedValueOnce(mockDisputeForSettlement);

      const body: DisputeSettlementBodyType = {
        clientAmount: 50,
        freelancerAmount: 50,
        winningParty: 'SPLIT',
        decisionReason: 'Arbitration split decision',
      };

      await expect(
        service.settleDispute(1, RoleName.CLIENT, 5, body),
      ).rejects.toThrow(PaymentForbiddenException());
    });

    // Schema từ chối khi số tiền hoàn cho khách là số âm.
    it('rejects negative clientAmount through DisputeSettlementBodySchema', () => {
      const parsed = DisputeSettlementBodySchema.safeParse({
        clientAmount: -10,
        freelancerAmount: 110,
        winningParty: 'SPLIT',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-164: handleWebhook
  // =========================================================================
  describe('UF-164 handleWebhook', () => {
    // UF-164: Xử lý sự kiện webhook payment_intent.succeeded thành công từ Stripe.
    it('processes payment_intent.succeeded webhook event cleanly', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_webhook_test',
            metadata: {
              type: TransactionType.ESCROW_DEPOSIT,
              milestoneId: '20',
              contractId: '10',
            },
          },
        },
      } as unknown as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValueOnce(event);
      repo.findTransactionByPaymentIntentId.mockResolvedValueOnce(
        mockTransaction,
      );
      repo.updateTransactionStatus.mockResolvedValueOnce({});
      repo.updateMilestonePaymentStatus.mockResolvedValueOnce({});
      repo.handleEscrowDepositSuccess.mockResolvedValueOnce({});

      const result = await service.handleWebhook('raw_payload', 'valid_sig');

      expect(result).toEqual({ received: true });
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.FUNDED,
      );
    });

    // Xử lý sự kiện webhook checkout.session.completed từ Stripe Checkout.
    it('processes checkout.session.completed webhook event cleanly', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_webhook_session',
            payment_intent: 'pi_from_checkout',
            metadata: { type: TransactionType.PLATFORM_FEE, contractId: '10' },
          },
        },
      } as unknown as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValueOnce(event);
      repo.findTransactionBySessionId.mockResolvedValueOnce(mockTransaction);
      repo.updateTransactionStatus.mockResolvedValueOnce({});
      repo.findContractById.mockResolvedValueOnce(mockContract);

      const result = await service.handleWebhook('raw_payload', 'valid_sig');

      expect(result).toEqual({ received: true });
    });

    // Ném ngoại lệ WebhookSignatureInvalidException khi chữ ký webhook không khớp.
    it('throws WebhookSignatureInvalidException when signature verification fails', async () => {
      stripeService.constructWebhookEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook('bad_payload', 'invalid_sig'),
      ).rejects.toThrow(WebhookSignatureInvalidException());
    });
  });

  // =========================================================================
  // UF-165: syncPaymentIntent
  // =========================================================================
  describe('UF-165 syncPaymentIntent', () => {
    // UF-165: Đồng bộ trạng thái PaymentIntent thành công trực tiếp với Stripe API.
    it('syncs succeeded payment intent directly from Stripe API', async () => {
      stripeService.retrievePaymentIntent.mockResolvedValueOnce({
        id: 'pi_sync_test',
        status: 'succeeded',
        metadata: {
          type: TransactionType.ESCROW_DEPOSIT,
          milestoneId: '20',
          contractId: '10',
        },
      });
      repo.findTransactionByPaymentIntentId.mockResolvedValueOnce(
        mockTransaction,
      );
      repo.updateTransactionStatus.mockResolvedValueOnce({});
      repo.updateMilestonePaymentStatus.mockResolvedValueOnce({});
      repo.handleEscrowDepositSuccess.mockResolvedValueOnce({});

      const result = await service.syncPaymentIntent(1, 'pi_sync_test');

      expect(result).toEqual({ success: true, status: 'succeeded' });
      expect(repo.updateMilestonePaymentStatus).toHaveBeenCalledWith(
        20,
        MilestonePaymentStatus.FUNDED,
      );
    });

    // Trả về false khi trạng thái PaymentIntent trên Stripe vẫn chưa thành công.
    it('returns false status when payment intent is still pending on Stripe', async () => {
      stripeService.retrievePaymentIntent.mockResolvedValueOnce({
        id: 'pi_sync_test',
        status: 'requires_payment_method',
      });

      const result = await service.syncPaymentIntent(1, 'pi_sync_test');

      expect(result).toEqual({
        success: false,
        status: 'requires_payment_method',
      });
    });

    // Đồng bộ trạng thái Checkout Session thành công trực tiếp với Stripe API.
    it('syncs succeeded checkout session directly from Stripe API', async () => {
      stripeService.retrieveCheckoutSession.mockResolvedValueOnce({
        id: 'cs_sync_test',
        payment_status: 'paid',
        payment_intent: 'pi_checkout_paid',
        metadata: { type: TransactionType.PLATFORM_FEE, contractId: '10' },
      });
      repo.findTransactionBySessionId.mockResolvedValueOnce(mockTransaction);
      repo.updateTransactionStatus.mockResolvedValueOnce({});
      repo.findContractById.mockResolvedValueOnce(mockContract);

      const result = await service.syncCheckoutSession(1, 'cs_sync_test');

      expect(result).toEqual({ success: true, status: 'paid' });
    });
  });
});
