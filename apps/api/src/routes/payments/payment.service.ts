import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  PlatformFeeStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import {
  DisputeSettlementBodyType,
  GetTransactionListQueryType,
  RoleName,
} from '@shared/types';
import { envConfig } from '../../shared/config/validate-env';
import {
  ContractNotSignedException,
  DisputeFeeAlreadyPaidException,
  DisputeSettlementInvalidAmountException,
  MilestoneAlreadyReleasedException,
  MilestoneNotEligibleForFundingException,
  MilestoneNotFundedException,
  PaymentForbiddenException,
  PlatformFeeAlreadyPaidException,
  StripeAccountNotConnectedException,
  StripeOnboardingIncompleteException,
  WebhookSignatureInvalidException,
} from './payment.error';
import { PaymentRepository } from './payment.repo';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly stripeService: StripeService,
  ) {}

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

  async chargeSavedCardForPlatformFee(
    userId: number,
    contractId: number,
    paymentMethodId?: string,
  ) {
    const contract = await this.paymentRepo.findContractById(contractId);
    if (!contract || contract.clientId !== userId) {
      throw PaymentForbiddenException();
    }

    if (!contract.signedByClient || !contract.signedByFreelancer) {
      throw ContractNotSignedException();
    }

    if (contract.platformFeeStatus === PlatformFeeStatus.PAID) {
      throw PlatformFeeAlreadyPaidException();
    }

    const customerId = contract.client.stripeCustomerId;
    if (!customerId) {
      throw new HttpException(
        'No saved payment method found. Please pay via Stripe Checkout to save your card.',
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
          'No saved payment method found. Please pay via Stripe Checkout to save your card.',
          HttpStatus.BAD_REQUEST,
        );
      }
      targetPmId = defaultPm.id;
    }

    const feeAmount = Number(contract.platformFee) || 10.0;
    const amountInCents = Math.round(feeAmount * 100);

    try {
      const paymentIntent = await this.stripeService.chargeOffSession({
        amountInCents,
        currency: 'usd',
        customerId,
        paymentMethodId: targetPmId,
        metadata: {
          type: TransactionType.PLATFORM_FEE,
          contractId: String(contractId),
          userId: String(userId),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        await this.paymentRepo.updateContractPlatformFee(
          contractId,
          PlatformFeeStatus.PAID,
        );

        const tx = await this.paymentRepo.createTransaction({
          userId,
          contractId,
          amount: feeAmount,
          currency: 'usd',
          type: TransactionType.PLATFORM_FEE,
          status: TransactionStatus.SUCCEEDED,
          stripePaymentIntentId: paymentIntent.id,
        });

        return {
          success: true,
          message: 'Platform fee paid successfully using saved card',
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
      this.logger.error(`Off-session platform fee payment failed: ${msg}`);
      throw new HttpException(msg, HttpStatus.PAYMENT_REQUIRED);
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

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    const customerId = milestone.contract.client.stripeCustomerId;
    if (!customerId) {
      throw new HttpException(
        'No saved payment method found. Please pay via Stripe Checkout to save your card.',
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
          'No saved payment method found. Please pay via Stripe Checkout to save your card.',
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

  async createPlatformFeeIntent(userId: number, contractId: number) {
    const contract = await this.paymentRepo.findContractById(contractId);
    if (!contract || contract.clientId !== userId) {
      throw PaymentForbiddenException();
    }

    if (!contract.signedByClient || !contract.signedByFreelancer) {
      throw ContractNotSignedException();
    }

    if (contract.platformFeeStatus === PlatformFeeStatus.PAID) {
      throw PlatformFeeAlreadyPaidException();
    }

    let customerId = contract.client.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        contract.client.email,
      );
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const feeAmount = Number(contract.platformFee) || 10.0;
    const amountInCents = Math.round(feeAmount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amountInCents,
      currency: 'usd',
      customerId,
      metadata: {
        type: TransactionType.PLATFORM_FEE,
        contractId: String(contractId),
        userId: String(userId),
      },
    });

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      amount: feeAmount,
      currency: 'usd',
      type: TransactionType.PLATFORM_FEE,
      status: TransactionStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      metadata: { clientSecret: paymentIntent.client_secret },
    });

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentId: paymentIntent.id,
      amount: feeAmount,
      currency: 'usd',
    };
  }

  async createPlatformFeeCheckoutSession(userId: number, contractId: number) {
    const contract = await this.paymentRepo.findContractById(contractId);
    if (!contract || contract.clientId !== userId) {
      throw PaymentForbiddenException();
    }

    if (!contract.signedByClient || !contract.signedByFreelancer) {
      throw ContractNotSignedException();
    }

    if (contract.platformFeeStatus === PlatformFeeStatus.PAID) {
      throw PlatformFeeAlreadyPaidException();
    }

    let customerId = contract.client.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        contract.client.email,
      );
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const feeAmount = Number(contract.platformFee) || 10.0;
    const amountInCents = Math.round(feeAmount * 100);

    const session = await this.stripeService.createCheckoutSession({
      amountInCents,
      currency: 'usd',
      customerId,
      title: 'Contract Platform Activation Fee',
      description: `One-time platform fee to activate contract #${contractId}`,
      successUrl: `${envConfig.NEXT_URL}/client/contracts/${contractId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${envConfig.NEXT_URL}/client/contracts/${contractId}?payment=cancelled`,
      metadata: {
        type: TransactionType.PLATFORM_FEE,
        contractId: String(contractId),
        userId: String(userId),
      },
    });

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      amount: feeAmount,
      currency: 'usd',
      type: TransactionType.PLATFORM_FEE,
      status: TransactionStatus.PENDING,
      metadata: { sessionId: session.id },
    });

    return {
      checkoutUrl: session.url ?? '',
      sessionId: session.id,
    };
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

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    let customerId = milestone.contract.client.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        milestone.contract.client.email,
      );
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

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

    if (milestone.paymentStatus !== MilestonePaymentStatus.PENDING) {
      throw MilestoneNotEligibleForFundingException();
    }

    let customerId = milestone.contract.client.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        milestone.contract.client.email,
      );
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const milestoneAmount = Number(milestone.amount);
    const amountInCents = Math.round(milestoneAmount * 100);

    const session = await this.stripeService.createCheckoutSession({
      amountInCents,
      currency: 'usd',
      customerId,
      title: `Fund Milestone: ${milestone.title}`,
      description: `Escrow deposit for milestone #${milestoneId} on contract #${contractId}`,
      successUrl: `${envConfig.NEXT_URL}/client/contracts/${contractId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${envConfig.NEXT_URL}/client/contracts/${contractId}?payment=cancelled`,
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

  async createDisputeFeeIntent(userId: number, disputeId: number) {
    const dispute = await this.paymentRepo.findDisputeById(disputeId);
    if (!dispute) {
      throw PaymentForbiddenException();
    }

    const isParticipant =
      dispute.openedById === userId || dispute.respondentId === userId;
    if (!isParticipant) {
      throw PaymentForbiddenException();
    }

    const fee = await this.paymentRepo.findDisputeFee(disputeId, userId);
    if (!fee) {
      throw PaymentForbiddenException();
    }

    if (fee.status === DisputeFeeStatus.PAID) {
      throw DisputeFeeAlreadyPaidException();
    }

    const user = await this.paymentRepo.findUserById(userId);
    let customerId = user?.stripeCustomerId ?? undefined;
    if (!customerId && user?.email) {
      const customer = await this.stripeService.createCustomer(user.email);
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const feeAmount = Number(fee.amount);
    const amountInCents = Math.round(feeAmount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amountInCents,
      currency: 'usd',
      customerId,
      metadata: {
        type: TransactionType.DISPUTE_FEE,
        disputeId: String(disputeId),
        userId: String(userId),
        feeId: String(fee.id),
      },
    });

    await this.paymentRepo.updateDisputeFeeStatus(
      fee.id,
      DisputeFeeStatus.PENDING,
      paymentIntent.id,
    );

    await this.paymentRepo.createTransaction({
      userId,
      contractId: dispute.milestone.contractId,
      milestoneId: dispute.milestoneId,
      disputeId,
      amount: feeAmount,
      currency: 'usd',
      type: TransactionType.DISPUTE_FEE,
      status: TransactionStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentId: paymentIntent.id,
      amount: feeAmount,
      currency: 'usd',
    };
  }

  async createDisputeFeeCheckoutSession(userId: number, disputeId: number) {
    const dispute = await this.paymentRepo.findDisputeById(disputeId);
    if (!dispute) {
      throw PaymentForbiddenException();
    }

    const isParticipant =
      dispute.openedById === userId || dispute.respondentId === userId;
    if (!isParticipant) {
      throw PaymentForbiddenException();
    }

    const fee = await this.paymentRepo.findDisputeFee(disputeId, userId);
    if (!fee) {
      throw PaymentForbiddenException();
    }

    if (fee.status === DisputeFeeStatus.PAID) {
      throw DisputeFeeAlreadyPaidException();
    }

    const user = await this.paymentRepo.findUserById(userId);
    let customerId = user?.stripeCustomerId ?? undefined;
    if (!customerId && user?.email) {
      const customer = await this.stripeService.createCustomer(user.email);
      customerId = customer.id;
      await this.paymentRepo.updateUserStripe(userId, {
        stripeCustomerId: customerId,
      });
    }

    const feeAmount = Number(fee.amount);
    const amountInCents = Math.round(feeAmount * 100);

    const session = await this.stripeService.createCheckoutSession({
      amountInCents,
      currency: 'usd',
      customerId,
      title: 'Dispute Arbitration Fee',
      description: `Arbitration deposit for dispute #${disputeId}`,
      successUrl: `${envConfig.NEXT_URL}/client/contracts/${dispute.milestone.contractId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${envConfig.NEXT_URL}/client/contracts/${dispute.milestone.contractId}?payment=cancelled`,
      metadata: {
        type: TransactionType.DISPUTE_FEE,
        disputeId: String(disputeId),
        userId: String(userId),
        feeId: String(fee.id),
      },
    });

    await this.paymentRepo.updateDisputeFeeStatus(
      fee.id,
      DisputeFeeStatus.PENDING,
      session.id,
    );

    await this.paymentRepo.createTransaction({
      userId,
      contractId: dispute.milestone.contractId,
      milestoneId: dispute.milestoneId,
      disputeId,
      amount: feeAmount,
      currency: 'usd',
      type: TransactionType.DISPUTE_FEE,
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
    const amountInCents = Math.round(milestoneAmount * 100);

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
      amount: milestoneAmount,
      currency: 'usd',
      type: TransactionType.MILESTONE_PAYOUT,
      status: TransactionStatus.SUCCEEDED,
      stripeTransferId: transfer.id,
    });

    return {
      success: true,
      message: 'Milestone payment released to freelancer successfully',
      transferId: transfer.id,
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

    const escrowTx =
      await this.paymentRepo.findEscrowDepositTransaction(milestoneId);
    if (!escrowTx || !escrowTx.stripePaymentIntentId) {
      throw new Error('Original escrow payment record not found');
    }

    const refund = await this.stripeService.createRefund({
      paymentIntentId: escrowTx.stripePaymentIntentId,
      metadata: {
        type: TransactionType.REFUND,
        contractId: String(contractId),
        milestoneId: String(milestoneId),
      },
    });

    await this.paymentRepo.updateMilestonePaymentStatus(
      milestoneId,
      MilestonePaymentStatus.REFUNDED,
    );

    await this.paymentRepo.createTransaction({
      userId,
      contractId,
      milestoneId,
      amount: Number(milestone.amount),
      currency: 'usd',
      type: TransactionType.REFUND,
      status: TransactionStatus.SUCCEEDED,
      stripeRefundId: refund.id,
    });

    return {
      success: true,
      message: 'Milestone funds refunded to client successfully',
      refundId: refund.id,
    };
  }

  async settleDispute(
    callerUserId: number,
    callerRoleName: string,
    disputeId: number,
    body: DisputeSettlementBodyType,
  ) {
    const dispute = await this.paymentRepo.findDisputeById(disputeId);
    if (!dispute) {
      throw PaymentForbiddenException('Dispute not found');
    }

    const isAdmin = callerRoleName === RoleName.ADMIN;
    const isAssignedArbitrator = dispute.decisionById === callerUserId;

    if (!isAdmin && !isAssignedArbitrator) {
      throw PaymentForbiddenException(
        'Only admin or assigned dispute arbitrator can settle dispute payout',
      );
    }

    const totalMilestoneAmount = Number(dispute.milestone.amount);
    const splitSum = Number(body.clientAmount) + Number(body.freelancerAmount);

    if (Math.abs(splitSum - totalMilestoneAmount) > 0.01) {
      throw DisputeSettlementInvalidAmountException();
    }

    const escrowTx = await this.paymentRepo.findEscrowDepositTransaction(
      dispute.milestoneId,
    );
    const contract = dispute.milestone.contract;

    // 1. Client refund portion
    if (body.clientAmount > 0 && escrowTx?.stripePaymentIntentId) {
      const clientRefundCents = Math.round(body.clientAmount * 100);
      const refund = await this.stripeService.createRefund({
        paymentIntentId: escrowTx.stripePaymentIntentId,
        amountInCents: clientRefundCents,
        metadata: { disputeId: String(disputeId), target: 'client' },
      });

      await this.paymentRepo.createTransaction({
        userId: contract.clientId,
        contractId: contract.id,
        milestoneId: dispute.milestoneId,
        disputeId,
        amount: body.clientAmount,
        currency: 'usd',
        type: TransactionType.REFUND,
        status: TransactionStatus.SUCCEEDED,
        stripeRefundId: refund.id,
      });
    }

    // 2. Freelancer payout portion
    if (body.freelancerAmount > 0 && contract.freelancer.stripeAccountId) {
      const freelancerPayoutCents = Math.round(body.freelancerAmount * 100);
      const transfer = await this.stripeService.createTransfer({
        amountInCents: freelancerPayoutCents,
        destination: contract.freelancer.stripeAccountId,
        transferGroup: `dispute_${disputeId}`,
        metadata: { disputeId: String(disputeId), target: 'freelancer' },
      });

      await this.paymentRepo.createTransaction({
        userId: contract.freelancerId,
        contractId: contract.id,
        milestoneId: dispute.milestoneId,
        disputeId,
        amount: body.freelancerAmount,
        currency: 'usd',
        type: TransactionType.MILESTONE_PAYOUT,
        status: TransactionStatus.SUCCEEDED,
        stripeTransferId: transfer.id,
      });
    }

    // 3. Arbitration fee handling for winner / loser
    const clientFee = dispute.fees.find((f) => f.userId === contract.clientId);
    const freelancerFee = dispute.fees.find(
      (f) => f.userId === contract.freelancerId,
    );

    if (body.winningParty === 'CLIENT' && clientFee?.paymentIntentId) {
      // Refund dispute fee to Client
      await this.stripeService.createRefund({
        paymentIntentId: clientFee.paymentIntentId,
      });
    } else if (
      body.winningParty === 'FREELANCER' &&
      freelancerFee?.paymentIntentId
    ) {
      // Refund dispute fee to Freelancer
      await this.stripeService.createRefund({
        paymentIntentId: freelancerFee.paymentIntentId,
      });
    }

    // 4. Arbitrator payout
    let arbitratorPayoutAmount = 0;
    if (
      dispute.decisionBy?.stripeAccountId &&
      dispute.decisionBy.stripeOnboardingCompleted
    ) {
      const arbitrationFee = Number(dispute.arbitrationFee) || 50;
      arbitratorPayoutAmount = Math.round(arbitrationFee * 0.7); // 70% to expert
      if (arbitratorPayoutAmount > 0) {
        const transfer = await this.stripeService.createTransfer({
          amountInCents: Math.round(arbitratorPayoutAmount * 100),
          destination: dispute.decisionBy.stripeAccountId,
          metadata: { disputeId: String(disputeId), type: 'ARBITRATOR_PAYOUT' },
        });

        await this.paymentRepo.createTransaction({
          userId: dispute.decisionBy.id,
          contractId: contract.id,
          disputeId,
          amount: arbitratorPayoutAmount,
          currency: 'usd',
          type: TransactionType.ARBITRATOR_PAYOUT,
          status: TransactionStatus.SUCCEEDED,
          stripeTransferId: transfer.id,
        });
      }
    }

    await this.paymentRepo.updateDisputeStatus(
      disputeId,
      DisputeStatus.FINALIZED,
      new Date(),
    );

    await this.paymentRepo.updateMilestonePaymentStatus(
      dispute.milestoneId,
      MilestonePaymentStatus.RELEASED,
      MilestoneStatus.COMPLETED,
    );

    return {
      disputeId,
      status: 'FINALIZED',
      clientRefundAmount: body.clientAmount,
      freelancerPayoutAmount: body.freelancerAmount,
      arbitratorPayoutAmount,
    };
  }

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

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.processPaymentIntentSucceeded(pi);
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
    const isAdmin = roleName === RoleName.ADMIN;
    const filter = isAdmin ? {} : { userId };
    return this.paymentRepo.getTransactions(query, filter);
  }

  async processPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const metadata = pi.metadata || {};
    const type = metadata.type;

    const tx = await this.paymentRepo.findTransactionByPaymentIntentId(pi.id);
    if (tx) {
      await this.paymentRepo.updateTransactionStatus(
        tx.id,
        TransactionStatus.SUCCEEDED,
      );
    }

    if (type === TransactionType.PLATFORM_FEE && metadata.contractId) {
      await this.paymentRepo.updateContractPlatformFee(
        Number(metadata.contractId),
        PlatformFeeStatus.PAID,
      );
    } else if (
      type === TransactionType.ESCROW_DEPOSIT &&
      metadata.milestoneId
    ) {
      await this.paymentRepo.updateMilestonePaymentStatus(
        Number(metadata.milestoneId),
        MilestonePaymentStatus.FUNDED,
      );
    } else if (type === TransactionType.DISPUTE_FEE && metadata.feeId) {
      await this.paymentRepo.updateDisputeFeeStatus(
        Number(metadata.feeId),
        DisputeFeeStatus.PAID,
        pi.id,
        new Date(),
      );
    }
  }

  async syncPaymentIntent(userId: number, paymentIntentId: string) {
    const pi = await this.stripeService.retrievePaymentIntent(paymentIntentId);
    if (pi.status === 'succeeded') {
      await this.processPaymentIntentSucceeded(pi);
      return { success: true, status: 'succeeded' };
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

    if (type === TransactionType.PLATFORM_FEE && metadata.contractId) {
      await this.paymentRepo.updateContractPlatformFee(
        Number(metadata.contractId),
        PlatformFeeStatus.PAID,
      );
    } else if (
      type === TransactionType.ESCROW_DEPOSIT &&
      metadata.milestoneId
    ) {
      await this.paymentRepo.updateMilestonePaymentStatus(
        Number(metadata.milestoneId),
        MilestonePaymentStatus.FUNDED,
      );
    } else if (type === TransactionType.DISPUTE_FEE && metadata.feeId) {
      await this.paymentRepo.updateDisputeFeeStatus(
        Number(metadata.feeId),
        DisputeFeeStatus.PAID,
        paymentIntentId,
        new Date(),
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
