import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { envConfig } from '../../shared/config/validate-env';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    this.stripe = new Stripe(envConfig.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  async createExpressAccount(
    email: string,
    country: string = envConfig.STRIPE_ACCOUNT_COUNTRY,
  ): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
  }

  async createAccountLink(
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string,
  ): Promise<Stripe.AccountLink> {
    return this.stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  async getAccount(stripeAccountId: string): Promise<Stripe.Account> {
    return this.stripe.accounts.retrieve(stripeAccountId);
  }

  async createPaymentIntent({
    amountInCents,
    currency = 'usd',
    customerId,
    metadata,
  }: {
    amountInCents: number;
    currency?: string;
    customerId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amountInCents),
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async createTransfer({
    amountInCents,
    currency = 'usd',
    destination,
    transferGroup,
    metadata,
  }: {
    amountInCents: number;
    currency?: string;
    destination: string;
    transferGroup?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Transfer> {
    return this.stripe.transfers.create({
      amount: Math.round(amountInCents),
      currency: currency.toLowerCase(),
      destination,
      transfer_group: transferGroup,
      metadata,
    });
  }

  async createRefund({
    paymentIntentId,
    amountInCents,
    metadata,
  }: {
    paymentIntentId: string;
    amountInCents?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountInCents ? Math.round(amountInCents) : undefined,
      metadata,
    });
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  constructWebhookEvent(
    payload: Buffer | string,
    signature: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      envConfig.STRIPE_WEBHOOK_SECRET,
    );
  }
}
