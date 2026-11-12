import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  ContractStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  ContractHoldActionResponseType,
  CreateContractHoldResponseType,
  DisputeSettlementBodyType,
  GetTransactionListQueryType,
  RoleName,
} from '@shared/types';
import { envConfig } from '../../shared/config/validate-env';
import {
  ContractExpiredException,
  ContractNotActiveException,
  ContractNotAwaitingPaymentException,
  DisputeSettlementInvalidAmountException,
  HoldIntentCancelFailedException,
  HoldIntentCaptureFailedException,
  HoldMilestoneRequiredException,
  MilestoneAlreadyReleasedException,
  MilestoneNotEligibleForFundingException,
  MilestoneNotEligibleForRefundException,
  MilestoneNotFundedException,
  PaymentForbiddenException,
  StripeAccountNotConnectedException,
  StripeOnboardingIncompleteException,
  WebhookSignatureInvalidException,
} from './payment.error';
import { PaymentRepository } from './payment.repo';
import { ContractPdfService } from '../../shared/services/contract-pdf.service';
import { StripeService } from '../../shared/services/stripe.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly contractPdfService: ContractPdfService,
  ) { }

  async getOnboardingLink(userId: number, returnUrl?: string) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user) {
      throw PaymentForbiddenException();
    }

    let stripeAccountId = user.stripeAccountId;
    try {
      if (!stripeAccountId) {
        const account = await this.stripeService.createExpressAccount(
          user.email,
        );
        stripeAccountId = account.id;
        await this.paymentRepo.updateUserStripe(userId, { stripeAccountId });
      } else {
        // Verify account exists in current Stripe environment
        try {
          const existingAccount =
            await this.stripeService.getAccount(stripeAccountId);
          if (
            existingAccount?.country &&
            existingAccount.country !== envConfig.STRIPE_ACCOUNT_COUNTRY &&
            !existingAccount.details_submitted
          ) {
            this.logger.warn(
              `Stripe account ${stripeAccountId} country (${existingAccount.country}) does not match configured (${envConfig.STRIPE_ACCOUNT_COUNTRY}). Re-creating account...`,
            );
            const account = await this.stripeService.createExpressAccount(
              user.email,
            );
            stripeAccountId = account.id;
            await this.paymentRepo.updateUserStripe(userId, {
              stripeAccountId,
            });
          }
        } catch (accountErr: unknown) {
          const errObj = accountErr as { code?: string; statusCode?: number };
          if (
            errObj?.code === 'resource_missing' ||
            errObj?.statusCode === 404
          ) {
            this.logger.warn(
              `Stripe account ${stripeAccountId} not found. Re-creating Express account...`,
            );
            const account = await this.stripeService.createExpressAccount(
              user.email,
            );
            stripeAccountId = account.id;
            await this.paymentRepo.updateUserStripe(userId, {
              stripeAccountId,
            });
          } else {
            throw accountErr;
          }
        }
      }

      const defaultReturnUrl = `${envConfig.NEXT_URL}/account-profile?tab=payments`;
      const finalReturnUrl = returnUrl || defaultReturnUrl;

      const accountLink = await this.stripeService.createAccountLink(
        stripeAccountId,
        finalReturnUrl,
        finalReturnUrl,
      );

      return { onboardingUrl: accountLink.url };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create Stripe onboarding link';
      this.logger.error(
        `Failed to create Stripe onboarding link for user ${userId}: ${message}`,
      );
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async getConnectStatus(userId: number) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user || !user.stripeAccountId) {
      return {
        isConnected: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        stripeAccountId: null,
      };
    }

    try {
      const account = await this.stripeService.getAccount(user.stripeAccountId);
      const isConnected = !!account.id;
      const payoutsEnabled = !!account.payouts_enabled;
      const chargesEnabled = !!account.charges_enabled;

      if (user.stripeOnboardingCompleted !== payoutsEnabled) {
        await this.paymentRepo.updateUserStripe(userId, {
          stripeOnboardingCompleted: payoutsEnabled,
        });
      }

      return {
        isConnected,
        payoutsEnabled,
        chargesEnabled,
        stripeAccountId: user.stripeAccountId,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe account status', error);
      return {
        isConnected: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        stripeAccountId: user.stripeAccountId,
      };
    }
  }

  async getCustomerPortalLink(userId: number, returnUrl?: string) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user) {
      throw PaymentForbiddenException();
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(user.email);
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const defaultReturnUrl = `${envConfig.NEXT_URL}/account-profile?tab=payments`;
    const finalReturnUrl = returnUrl || defaultReturnUrl;

    try {
      const portal = await this.stripeService.createBillingPortalSession(
        customerId,
        finalReturnUrl,
      );
      return { portalUrl: portal.url };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to create Billing Portal session';
      this.logger.error(`Customer Portal error for user ${userId}: ${msg}`);
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  async getSavedPaymentMethods(userId: number) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return { paymentMethods: [] };
    }

    try {
      const pms = await this.stripeService.listPaymentMethods(
        user.stripeCustomerId,
      );
      let defaultPmId: string | null = null;
      try {
        const customer = await this.stripeService.getCustomer(
          user.stripeCustomerId,
        );
        if (customer && !('deleted' in customer)) {
          defaultPmId =
            (customer.invoice_settings?.default_payment_method as string) ??
            null;
        }
      } catch {
        // Ignore customer retrieval failure
      }

      const paymentMethods = pms.data.map((pm, idx) => ({
        id: pm.id,
        brand: pm.card?.brand ?? 'card',
        last4: pm.card?.last4 ?? '****',
        expMonth: pm.card?.exp_month ?? 0,
        expYear: pm.card?.exp_year ?? 0,
        isDefault: defaultPmId ? pm.id === defaultPmId : idx === 0,
      }));

      return { paymentMethods };
    } catch (err) {
      this.logger.error(
        `Failed to list payment methods for user ${userId}`,
        err,
      );
      return { paymentMethods: [] };
    }
  }

  async createSetupIntent(userId: number) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user) {
      throw PaymentForbiddenException();
    }

    const customerId = await this.ensureCustomerId(
      userId,
      user.email,
      user.stripeCustomerId,
    );

    try {
      const setupIntent =
        await this.stripeService.createSetupIntent(customerId);
      if (!setupIntent.client_secret) {
        throw new HttpException(
          'Failed to initialize payment method setup',
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to create payment method setup intent';
      this.logger.error(`SetupIntent error for user ${userId}: ${msg}`);
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: string) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user) {
      throw PaymentForbiddenException();
    }

    const customerId = await this.ensureCustomerId(
      userId,
      user.email,
      user.stripeCustomerId,
    );

    try {
      const pm =
        await this.stripeService.retrievePaymentMethod(paymentMethodId);
      const pmCustomer =
        typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
      if (pmCustomer && pmCustomer !== customerId) {
        throw PaymentForbiddenException(
          'Payment method belongs to another account',
        );
      }

      await this.stripeService.setDefaultPaymentMethod(
        customerId,
        paymentMethodId,
      );
      return {
        success: true,
        message: 'Default payment method updated successfully',
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to update default payment method';
      this.logger.error(
        `setDefaultPaymentMethod error for user ${userId}: ${msg}`,
      );
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  async removePaymentMethod(userId: number, paymentMethodId: string) {
    const user = await this.paymentRepo.findUserById(userId);
    if (!user || !user.stripeCustomerId) {
      throw PaymentForbiddenException();
    }

    try {
      const pm =
        await this.stripeService.retrievePaymentMethod(paymentMethodId);
      const pmCustomer =
        typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
      if (pmCustomer !== user.stripeCustomerId) {
        throw PaymentForbiddenException(
          'Payment method does not belong to user',
        );
      }

      await this.stripeService.detachPaymentMethod(paymentMethodId);
      return {
        success: true,
        message: 'Payment method removed successfully',
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg =
        err instanceof Error ? err.message : 'Failed to remove payment method';
      this.logger.error(`removePaymentMethod error for user ${userId}: ${msg}`);
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  private async ensureCustomerId(
    userId: number,
    email: string,
    existingCustomerId?: string | null,
  ): Promise<string> {
    if (existingCustomerId) return existingCustomerId;
    const customer = await this.stripeService.createCustomer(email);
    await this.paymentRepo.updateUserStripe(userId, {
      stripeCustomerId: customer.id,
    });
    return customer.id;
  }

  /**
   * Bước 1 (Authorize / Hold): Tạo Stripe PaymentIntent với `capture_method: 'manual'`
   * để giữ tiền trên thẻ của Client cho ít nhất 1 milestone (hoặc toàn bộ) + 3% phí hợp đồng.
   * Trả về `clientSecret` cho Frontend hiển thị Stripe Elements.
   */
  async createContractHoldIntent(
    userId: number,
    contractId: number,
    milestoneIds: number[],
    paymentMethodId?: string,
  ): Promise<CreateContractHoldResponseType> {
    const contract = await this.paymentRepo.findContractById(contractId);
    if (!contract) {
      throw PaymentForbiddenException('Contract not found');
    }

    if (contract.clientId !== userId) {
      throw PaymentForbiddenException();
    }

    if (contract.status !== ContractStatus.AWAITING_PAYMENT) {
      throw ContractNotAwaitingPaymentException();
    }

    if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
      throw ContractExpiredException();
    }

    const uniqueIds = Array.from(new Set(milestoneIds));
    if (uniqueIds.length === 0) {
      throw HoldMilestoneRequiredException();
    }

    const selectedMilestones = uniqueIds.map((id) =>
      contract.milestones.find((m) => m.id === id),
    );
    if (
      selectedMilestones.some(
        (m) => !m || m.paymentStatus !== MilestonePaymentStatus.PENDING,
      )
    ) {
      throw MilestoneNotEligibleForFundingException();
    }

    const validMilestones = selectedMilestones.filter(
      (m): m is NonNullable<typeof m> => Boolean(m),
    );

    const milestonesAmount =
      Math.round(
        validMilestones.reduce((sum, m) => sum + Number(m.amount), 0) * 100,
      ) / 100;
    const clientFeeAmount =
      Math.round(Number(contract.totalAmount) * 0.03 * 100) / 100;
    const totalAmount =
      Math.round((milestonesAmount + clientFeeAmount) * 100) / 100;

    // Nếu trước đó đã có PaymentIntent giữ chỗ chưa capture, hủy lệnh cũ để tránh hold trùng trên thẻ.
    if (contract.holdPaymentIntentId) {
      try {
        await this.cancelContractHold(
          contract.holdPaymentIntentId,
          'Replaced by updated contract escrow hold selection',
        );
      } catch (cancelErr) {
        this.logger.warn(
          `Could not cancel previous hold intent ${contract.holdPaymentIntentId}: ${cancelErr instanceof Error ? cancelErr.message : String(cancelErr)}`,
        );
      }
    }

    const customerId = await this.ensureCustomerId(
      contract.client.id,
      contract.client.email,
      contract.client.stripeCustomerId,
    );

    if (paymentMethodId) {
      const pm =
        await this.stripeService.retrievePaymentMethod(paymentMethodId);
      const pmCustomer =
        typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
      if (pmCustomer && pmCustomer !== customerId) {
        throw PaymentForbiddenException(
          'Payment method belongs to another account',
        );
      }
    }

    const metadata = {
      type: 'CONTRACT_HOLD',
      contractId: String(contractId),
      userId: String(userId),
      milestoneIds: uniqueIds.join(','),
      milestonesAmount: String(milestonesAmount),
      clientFeeAmount: String(clientFeeAmount),
    };

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripeService.createPaymentIntent({
        amountInCents: Math.round(totalAmount * 100),
        currency: 'usd',
        customerId,
        ...(paymentMethodId
          ? { paymentMethodId, offSessionConfirm: true }
          : {}),
        captureMethod: 'manual',
        metadata,
      });
    } catch (err: unknown) {
      const stripeErr = err as {
        raw?: { payment_intent?: Stripe.PaymentIntent };
        message?: string;
      };
      if (stripeErr?.raw?.payment_intent?.client_secret) {
        paymentIntent = stripeErr.raw.payment_intent;
      } else {
        const msg =
          err instanceof Error ? err.message : 'Failed to authorize card hold';
        this.logger.error(`createContractHoldIntent failed: ${msg}`);
        throw new HttpException(msg, HttpStatus.PAYMENT_REQUIRED);
      }
    }

    await this.paymentRepo.setContractHoldIntent({
      contractId,
      paymentIntentId: paymentIntent.id,
      milestoneIds: uniqueIds,
      clientPlatformFee: clientFeeAmount,
    });

    const isAuthorized = paymentIntent.status === 'requires_capture';

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      milestoneId: uniqueIds.length === 1 ? uniqueIds[0] : undefined,
      amount: totalAmount,
      currency: 'usd',
      type: TransactionType.ESCROW_DEPOSIT,
      status: TransactionStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        type: 'CONTRACT_HOLD',
        holdStatus: isAuthorized ? 'REQUIRES_CAPTURE' : 'REQUIRES_CONFIRMATION',
        contractId,
        milestoneIds: uniqueIds,
        milestonesAmount,
        clientFeeAmount,
      } as Prisma.InputJsonValue,
    });

    if (isAuthorized) {
      await this.paymentRepo.markContractHoldAuthorized({
        contractId,
        paymentIntentId: paymentIntent.id,
        milestoneIds: uniqueIds,
      });
    }

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      milestonesAmount,
      platformFeeAmount: clientFeeAmount,
      currency: 'usd',
      milestoneIds: uniqueIds,
      status: paymentIntent.status,
      authorized: isAuthorized,
    };
  }

  /**
   * Bước 2 (Capture): Khớp lệnh trừ tiền thật khi Freelancer bấm ký hợp đồng.
   * Gọi `paymentIntents.capture(paymentIntentId)`, cập nhật Transaction & đánh dấu milestone đã chọn thành FUNDED.
   */
  async captureContractHold(
    paymentIntentId: string,
  ): Promise<ContractHoldActionResponseType> {
    try {
      const existingPi =
        await this.stripeService.retrievePaymentIntent(paymentIntentId);

      const capturedPi =
        existingPi.status === 'requires_capture'
          ? await this.stripeService.capturePaymentIntent(paymentIntentId)
          : existingPi;

      if (capturedPi.status !== 'succeeded') {
        throw HoldIntentCaptureFailedException();
      }

      const meta = capturedPi.metadata ?? {};
      const contractId = Number(meta.contractId);
      const txRecord =
        await this.paymentRepo.findTransactionByPaymentIntentId(
          paymentIntentId,
        );
      const txMeta =
        (txRecord?.metadata as Record<string, unknown> | null) ?? {};

      const resolvedContractId =
        contractId || Number(txRecord?.contractId ?? txMeta.contractId ?? 0);

      if (resolvedContractId) {
        const contract =
          await this.paymentRepo.findContractById(resolvedContractId);
        const milestoneIds = meta.milestoneIds
          ? meta.milestoneIds
            .split(',')
            .map((v) => Number(v.trim()))
            .filter((v) => Number.isFinite(v) && v > 0)
          : Array.isArray(contract?.holdMilestoneIds)
            ? contract.holdMilestoneIds
            : [];

        const clientFeeAmount =
          Number(meta.clientFeeAmount) ||
          Number(contract?.clientPlatformFee ?? 0) ||
          (contract
            ? Math.round(Number(contract.totalAmount) * 0.03 * 100) / 100
            : 0);

        const milestonesAmount =
          Number(meta.milestonesAmount) ||
          Math.max(
            0,
            Math.round((capturedPi.amount / 100 - clientFeeAmount) * 100) / 100,
          );

        await this.paymentRepo.finalizeContractHoldCaptured({
          contractId: resolvedContractId,
          paymentIntentId: capturedPi.id,
          milestoneIds,
          milestonesAmount,
          clientFeeAmount,
        });
      }

      return {
        success: true,
        paymentIntentId: capturedPi.id,
        status: capturedPi.status,
        message: 'Contract escrow hold captured successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to capture hold PaymentIntent ${paymentIntentId}:`,
        error,
      );
      if (error instanceof HttpException) throw error;
      throw HoldIntentCaptureFailedException();
    }
  }

  /**
   * Bước 3 (Cancel/Release): Hủy lệnh giữ tiền khi Freelancer từ chối ký hoặc hợp đồng quá hạn,
   * giải phóng tiền bị khóa trên thẻ mà không mất phí refund.
   */
  async cancelContractHold(
    paymentIntentId: string,
    reason?: string,
  ): Promise<ContractHoldActionResponseType> {
    try {
      const existingPi =
        await this.stripeService.retrievePaymentIntent(paymentIntentId);

      const cancelableStatuses = new Set<Stripe.PaymentIntent.Status>([
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'requires_capture',
      ]);

      let finalStatus: Stripe.PaymentIntent.Status = existingPi.status;
      if (cancelableStatuses.has(existingPi.status)) {
        const canceledPi =
          await this.stripeService.cancelPaymentIntent(paymentIntentId);
        finalStatus = canceledPi.status;
      } else if (existingPi.status !== 'canceled') {
        throw HoldIntentCancelFailedException();
      }

      const txRecord =
        await this.paymentRepo.findTransactionByPaymentIntentId(
          paymentIntentId,
        );
      const contractId =
        Number(existingPi.metadata?.contractId) ||
        Number(txRecord?.contractId ?? 0);

      if (contractId) {
        await this.paymentRepo.markContractHoldCanceled({
          contractId,
          paymentIntentId,
          reason,
        });
      }

      return {
        success: true,
        paymentIntentId,
        status: finalStatus,
        message: 'Contract escrow hold canceled and released successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel hold PaymentIntent ${paymentIntentId}:`,
        error,
      );
      if (error instanceof HttpException) throw error;
      throw HoldIntentCancelFailedException();
    }
  }

  async chargeSavedCardForMilestoneFund(
    userId: number,
    contractId: number,
    milestoneId: number,
    paymentMethodId?: string,
  ) {
    const milestone = await this.paymentRepo.findMilestoneById(milestoneId);
    if (
      !milestone ||
      milestone.contractId !== contractId ||
      milestone.contract.clientId !== userId
    ) {
      throw PaymentForbiddenException();
    }

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw ContractNotActiveException();
    }

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    const customerId = milestone.contract.client.stripeCustomerId;
    if (!customerId) {
      throw new HttpException(
        'No saved payment method found. Please authorize a card first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let targetPmId = paymentMethodId;
    if (!targetPmId) {
      const { paymentMethods } = await this.getSavedPaymentMethods(userId);
      const defaultPm =
        paymentMethods.find((p) => p.isDefault) || paymentMethods[0];
      if (!defaultPm) {
        throw new HttpException(
          'No saved payment method found. Please pay via Stripe Elements to save your card.',
          HttpStatus.BAD_REQUEST,
        );
      }
      targetPmId = defaultPm.id;
    }

    const milestoneAmount = Number(milestone.amount);
    const amountInCents = Math.round(milestoneAmount * 100);

    try {
      const paymentIntent = await this.stripeService.chargeOffSession({
        amountInCents,
        currency: 'usd',
        customerId,
        paymentMethodId: targetPmId,
        metadata: {
          type: TransactionType.ESCROW_DEPOSIT,
          contractId: String(contractId),
          milestoneId: String(milestoneId),
          userId: String(userId),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        await this.paymentRepo.updateMilestonePaymentStatus(
          milestoneId,
          MilestonePaymentStatus.FUNDED,
        );

        const tx = await this.paymentRepo.createTransaction({
          userId,
          contractId,
          milestoneId,
          amount: milestoneAmount,
          currency: 'usd',
          type: TransactionType.ESCROW_DEPOSIT,
          status: TransactionStatus.SUCCEEDED,
          stripePaymentIntentId: paymentIntent.id,
        });

        return {
          success: true,
          message: 'Milestone funded successfully using saved card',
          transactionId: tx.id,
        };
      } else {
        throw new HttpException(
          `Payment could not be completed off-session: status ${paymentIntent.status}. Please use Stripe Checkout.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg =
        err instanceof Error ? err.message : 'Card charge failed off-session';
      this.logger.error(`Off-session milestone fund failed: ${msg}`);
      throw new HttpException(msg, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async createMilestoneFundIntent(
    userId: number,
    contractId: number,
    milestoneId: number,
  ) {
    const milestone = await this.paymentRepo.findMilestoneById(milestoneId);
    if (
      !milestone ||
      milestone.contractId !== contractId ||
      milestone.contract.clientId !== userId
    ) {
      throw PaymentForbiddenException();
    }

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw ContractNotActiveException();
    }

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    const customerId = await this.ensureCustomerId(
      userId,
      milestone.contract.client.email,
      milestone.contract.client.stripeCustomerId,
    );

    const milestoneAmount = Number(milestone.amount);
    const amountInCents = Math.round(milestoneAmount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amountInCents,
      currency: 'usd',
      customerId,
      metadata: {
        type: TransactionType.ESCROW_DEPOSIT,
        contractId: String(contractId),
        milestoneId: String(milestoneId),
        userId: String(userId),
      },
    });

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      milestoneId,
      amount: milestoneAmount,
      currency: 'usd',
      type: TransactionType.ESCROW_DEPOSIT,
      status: TransactionStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      metadata: { clientSecret: paymentIntent.client_secret },
    });

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentId: paymentIntent.id,
      amount: milestoneAmount,
      currency: 'usd',
    };
  }

  async createMilestoneFundCheckoutSession(
    userId: number,
    contractId: number,
    milestoneId: number,
  ) {
    const milestone = await this.paymentRepo.findMilestoneById(milestoneId);
    if (
      !milestone ||
      milestone.contractId !== contractId ||
      milestone.contract.clientId !== userId
    ) {
      throw PaymentForbiddenException();
    }

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw ContractNotActiveException();
    }

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    const customerId = await this.ensureCustomerId(
      userId,
      milestone.contract.client.email,
      milestone.contract.client.stripeCustomerId,
    );

    const milestoneAmount = Number(milestone.amount);
    const amountInCents = Math.round(milestoneAmount * 100);

    const session = await this.stripeService.createCheckoutSession({
      amountInCents,
      currency: 'usd',
      customerId,
      title: `Fund Milestone: ${milestone.title}`,
      description: `Escrow deposit for milestone #${milestoneId} on contract #${contractId}`,
      successUrl: `${envConfig.NEXT_URL}/client/contracts/${milestone.contract.slug || contractId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${envConfig.NEXT_URL}/client/contracts/${milestone.contract.slug || contractId}?payment=cancelled`,
      metadata: {
        type: TransactionType.ESCROW_DEPOSIT,
        contractId: String(contractId),
        milestoneId: String(milestoneId),
        userId: String(userId),
      },
    });

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      milestoneId,
      amount: milestoneAmount,
      currency: 'usd',
      type: TransactionType.ESCROW_DEPOSIT,
      status: TransactionStatus.PENDING,
      metadata: { sessionId: session.id },
    });

    return {
      checkoutUrl: session.url ?? '',
      sessionId: session.id,
    };
  }

  async releaseMilestone(
    userId: number,
    contractId: number,
    milestoneId: number,
  ) {
    const milestone = await this.paymentRepo.findMilestoneById(milestoneId);
    if (
      !milestone ||
      milestone.contractId !== contractId ||
      milestone.contract.clientId !== userId
    ) {
      throw PaymentForbiddenException();
    }

    if (milestone.paymentStatus === MilestonePaymentStatus.RELEASED) {
      throw MilestoneAlreadyReleasedException();
    }

    if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
      throw MilestoneNotFundedException();
    }

    const freelancer = milestone.contract.freelancer;
    if (!freelancer.stripeAccountId) {
      throw StripeAccountNotConnectedException();
    }
    if (!freelancer.stripeOnboardingCompleted) {
      throw StripeOnboardingIncompleteException();
    }

    const milestoneAmount = Number(milestone.amount);
    const freelancerFee = Math.round(milestoneAmount * 0.05 * 100) / 100;
    const freelancerPayout =
      Math.round((milestoneAmount - freelancerFee) * 100) / 100;
    const amountInCents = Math.round(freelancerPayout * 100);

    const transfer = await this.stripeService.createTransfer({
      amountInCents,
      currency: 'usd',
      destination: freelancer.stripeAccountId,
      transferGroup: `contract_${contractId}`,
      metadata: {
        type: TransactionType.MILESTONE_PAYOUT,
        contractId: String(contractId),
        milestoneId: String(milestoneId),
        freelancerId: String(freelancer.id),
        freelancerFee: String(freelancerFee),
      },
    });

    await this.paymentRepo.updateMilestonePaymentStatus(
      milestoneId,
      MilestonePaymentStatus.RELEASED,
      MilestoneStatus.COMPLETED,
    );

    await this.paymentRepo.createTransaction({
      userId: freelancer.id,
      contractId,
      milestoneId,
      amount: freelancerPayout,
      currency: 'usd',
      type: TransactionType.MILESTONE_PAYOUT,
      status: TransactionStatus.SUCCEEDED,
      stripeTransferId: transfer.id,
    });

    if (freelancerFee > 0) {
      await this.paymentRepo.createTransaction({
        userId: freelancer.id,
        contractId,
        milestoneId,
        amount: freelancerFee,
        currency: 'usd',
        type: TransactionType.PLATFORM_FEE,
        status: TransactionStatus.SUCCEEDED,
        metadata: {
          type: 'FREELANCER_RELEASE_FEE',
          feeRole: 'FREELANCER',
          feePercent: 5,
          transferId: transfer.id,
        } as Prisma.InputJsonValue,
      });
    }

    await this.paymentRepo.checkAndCompleteFreelancerFee(contractId);
    await this.paymentRepo.syncContractCompletion(contractId);

    return {
      success: true,
      message: 'Milestone payment released to freelancer successfully',
      transferId: transfer.id,
    };
  }

  async refundContractEscrow(contractId: number) {
    const [contract, deposits] = await Promise.all([
      this.paymentRepo.findContractById(contractId),
      this.paymentRepo.findContractEscrowDeposits(contractId),
    ]);

    const fundedByMilestoneId = new Map<number, number>();
    for (const m of contract?.milestones ?? []) {
      if (m.paymentStatus === MilestonePaymentStatus.FUNDED) {
        fundedByMilestoneId.set(m.id, Number(m.amount));
      }
    }

    const refundResults: { refundId: string; amount: number }[] = [];
    for (const deposit of deposits) {
      if (!deposit.stripePaymentIntentId) continue;

      const meta =
        (deposit.metadata as { milestoneIds?: unknown } | null) ?? {};
      let refundableAmount = Number(deposit.amount);
      if (Array.isArray(meta.milestoneIds)) {
        refundableAmount = meta.milestoneIds.reduce<number>((sum, rawId) => {
          const milestoneAmount = fundedByMilestoneId.get(Number(rawId)) ?? 0;
          return Math.round((sum + milestoneAmount) * 100) / 100;
        }, 0);
      } else if (deposit.milestoneId) {
        refundableAmount = fundedByMilestoneId.get(deposit.milestoneId) ?? 0;
      }

      if (refundableAmount <= 0) continue;

      try {
        const refund = await this.stripeService.createRefund({
          paymentIntentId: deposit.stripePaymentIntentId,
          amountInCents: Math.round(refundableAmount * 100),
          metadata: {
            type: TransactionType.REFUND,
            contractId: String(contractId),
            reason: 'contract_rejected_or_expired',
          },
        });

        await this.paymentRepo.createTransaction({
          userId: deposit.userId,
          contractId,
          milestoneId: deposit.milestoneId ?? undefined,
          amount: refundableAmount,
          currency: deposit.currency,
          type: TransactionType.REFUND,
          status: TransactionStatus.SUCCEEDED,
          stripeRefundId: refund.id,
        });

        refundResults.push({
          refundId: refund.id,
          amount: refundableAmount,
        });
      } catch (err) {
        this.logger.error(
          `Failed to refund deposit tx #${deposit.id} for contract #${contractId}:`,
          err,
        );
      }
    }

    await this.paymentRepo.updateAllContractMilestonesPaymentStatus(
      contractId,
      MilestonePaymentStatus.FUNDED,
      MilestonePaymentStatus.REFUNDED,
    );

    return {
      success: true,
      refundCount: refundResults.length,
      refunds: refundResults,
    };
  }

  async refundMilestone(
    userId: number,
    contractId: number,
    milestoneId: number,
  ) {
    const milestone = await this.paymentRepo.findMilestoneById(milestoneId);
    if (
      !milestone ||
      milestone.contractId !== contractId ||
      milestone.contract.clientId !== userId
    ) {
      throw PaymentForbiddenException();
    }

    if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
      throw MilestoneNotFundedException();
    }

    if (
      milestone.status !== MilestoneStatus.LATE &&
      milestone.status !== MilestoneStatus.PENDING
    ) {
      throw MilestoneNotEligibleForRefundException();
    }

    const escrowTx = await this.paymentRepo.findEscrowDepositTransaction(
      milestoneId,
      contractId,
    );
    if (!escrowTx || !escrowTx.stripePaymentIntentId) {
      throw new Error('Original escrow payment record not found');
    }

    const reason =
      milestone.status === MilestoneStatus.LATE
        ? 'FREELANCER_LATE_NO_SUBMISSION'
        : 'FREELANCER_NOT_STARTED';

    const milestoneAmount = Number(milestone.amount);
    const refund = await this.stripeService.createRefund({
      paymentIntentId: escrowTx.stripePaymentIntentId,
      amountInCents: Math.round(milestoneAmount * 100),
      metadata: {
        type: TransactionType.REFUND,
        contractId: String(contractId),
        milestoneId: String(milestoneId),
        reason,
      },
      idempotencyKey: `refund-milestone-${milestoneId}`,
    });

    await this.paymentRepo.applyMilestoneRefundTransaction({
      milestoneId,
      contractId,
      contractSlug: milestone.contract.slug,
      clientId: userId,
      freelancerId: milestone.contract.freelancerId,
      milestoneTitle: milestone.title,
      amount: milestoneAmount,
      refundId: refund.id,
      reason,
      isAuto: true,
    });

    return {
      success: true,
      message: 'Milestone funds refunded to client successfully',
      refundId: refund.id,
    };
  }

  /**
   * Tiếp nhận sự kiện Stripe Webhook:
   * - `payment_intent.amount_capturable_updated`: Hold tiền đã được authorize thành công -> chuyển hợp đồng sang PENDING_SIGN.
   * - `payment_intent.succeeded`: Lệnh capture (Bước 2) hoặc fund milestone lẻ hoàn tất -> cập nhật DB idempotent.
   * - `payment_intent.canceled`: Lệnh giữ tiền đã hủy / hết hạn hold -> cập nhật Transaction và nhả trạng thái hold.
   */
  async handleWebhook(payload: Buffer | string, signature: string) {
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(payload, signature);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw WebhookSignatureInvalidException();
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.processCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.processPaymentIntentAuthorized(pi);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.processPaymentIntentSucceeded(pi);
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.processPaymentIntentCanceled(pi);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const tx = await this.paymentRepo.findTransactionByPaymentIntentId(
          pi.id,
        );
        if (tx) {
          await this.paymentRepo.updateTransactionStatus(
            tx.id,
            TransactionStatus.FAILED,
          );
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.id) {
          const user = await this.paymentRepo.findUserById(
            Number(account.metadata?.userId || 0),
          );
          if (user) {
            await this.paymentRepo.updateUserStripe(user.id, {
              stripeOnboardingCompleted: !!account.payouts_enabled,
            });
          }
        }
        break;
      }

      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  }

  async getTransactions(
    userId: number,
    roleName: string,
    query: GetTransactionListQueryType,
  ) {
    const isAdmin =
      roleName === RoleName.ADMIN ||
      (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
    const filter = isAdmin ? {} : { userId };
    return this.paymentRepo.getTransactions(query, filter);
  }

  async processPaymentIntentAuthorized(pi: Stripe.PaymentIntent) {
    const metadata = pi.metadata || {};
    if (metadata.type !== 'CONTRACT_HOLD' || !metadata.contractId) {
      return;
    }

    const contractId = Number(metadata.contractId);
    const milestoneIds = (metadata.milestoneIds || '')
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0);

    await this.paymentRepo.markContractHoldAuthorized({
      contractId,
      paymentIntentId: pi.id,
      milestoneIds,
    });
  }

  async processPaymentIntentCanceled(pi: Stripe.PaymentIntent) {
    const metadata = pi.metadata || {};
    if (!metadata.contractId) return;

    await this.paymentRepo.markContractHoldCanceled({
      contractId: Number(metadata.contractId),
      paymentIntentId: pi.id,
      reason: pi.cancellation_reason ?? 'payment_intent_canceled',
    });
  }

  async processPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const metadata = pi.metadata || {};
    const type = metadata.type;

    if (type === 'CONTRACT_HOLD' && metadata.contractId) {
      await this.captureContractHold(pi.id);
      return;
    }

    const tx = await this.paymentRepo.findTransactionByPaymentIntentId(pi.id);
    if (tx) {
      await this.paymentRepo.updateTransactionStatus(
        tx.id,
        TransactionStatus.SUCCEEDED,
      );
    }

    if (type === TransactionType.ESCROW_DEPOSIT && metadata.milestoneId) {
      await this.paymentRepo.updateMilestonePaymentStatus(
        Number(metadata.milestoneId),
        MilestonePaymentStatus.FUNDED,
      );
    }
  }

  async syncPaymentIntent(userId: number, paymentIntentId: string) {
    const pi = await this.stripeService.retrievePaymentIntent(paymentIntentId);
    if (pi.status === 'requires_capture') {
      await this.processPaymentIntentAuthorized(pi);
      return { success: true, status: 'requires_capture' };
    }
    if (pi.status === 'succeeded') {
      await this.processPaymentIntentSucceeded(pi);
      return { success: true, status: 'succeeded' };
    }
    if (pi.status === 'canceled') {
      await this.processPaymentIntentCanceled(pi);
      return { success: false, status: 'canceled' };
    }
    return { success: false, status: pi.status };
  }

  async processCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    const type = metadata.type;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    const tx = await this.paymentRepo.findTransactionBySessionId(session.id);
    if (tx) {
      await this.paymentRepo.updateTransactionStatus(
        tx.id,
        TransactionStatus.SUCCEEDED,
        {
          ...(paymentIntentId && { stripePaymentIntentId: paymentIntentId }),
        },
      );
    } else if (paymentIntentId) {
      const txByPi =
        await this.paymentRepo.findTransactionByPaymentIntentId(
          paymentIntentId,
        );
      if (txByPi) {
        await this.paymentRepo.updateTransactionStatus(
          txByPi.id,
          TransactionStatus.SUCCEEDED,
        );
      }
    }

    if (type === TransactionType.ESCROW_DEPOSIT && metadata.milestoneId) {
      await this.paymentRepo.updateMilestonePaymentStatus(
        Number(metadata.milestoneId),
        MilestonePaymentStatus.FUNDED,
      );
    }
  }

  async syncCheckoutSession(userId: number, sessionId: string) {
    const session = await this.stripeService.retrieveCheckoutSession(sessionId);
    if (session.payment_status === 'paid') {
      await this.processCheckoutSessionCompleted(session);
      return { success: true, status: 'paid' };
    }
    return { success: false, status: session.payment_status };
  }
}
