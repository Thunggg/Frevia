import { z } from 'zod';
import {
  PlatformFeeStatusEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '../constants/payment.constant';

export const TransactionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  contractId: z.number().nullable().optional(),
  milestoneId: z.number().nullable().optional(),
  disputeId: z.number().nullable().optional(),
  amount: z.coerce.number(),
  currency: z.string(),
  type: TransactionTypeEnum,
  status: TransactionStatusEnum,
  stripePaymentIntentId: z.string().nullable().optional(),
  stripeTransferId: z.string().nullable().optional(),
  stripeRefundId: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  contract: z
    .object({
      id: z.number(),
      job: z
        .object({
          title: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});
export type TransactionType = z.infer<typeof TransactionSchema>;

export const GetTransactionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  type: TransactionTypeEnum.optional(),
  status: TransactionStatusEnum.optional(),
  contractId: z.coerce.number().int().positive().optional(),
});
export type GetTransactionListQueryType = z.infer<
  typeof GetTransactionListQuerySchema
>;

export const GetTransactionListResponseSchema = z.object({
  data: z.array(TransactionSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type GetTransactionListResponseType = z.infer<
  typeof GetTransactionListResponseSchema
>;

export const CreatePaymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentIntentId: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type CreatePaymentIntentResponseType = z.infer<
  typeof CreatePaymentIntentResponseSchema
>;

export const StripeOnboardingLinkResponseSchema = z.object({
  onboardingUrl: z.string().url(),
});
export type StripeOnboardingLinkResponseType = z.infer<
  typeof StripeOnboardingLinkResponseSchema
>;

export const StripeConnectStatusResponseSchema = z.object({
  isConnected: z.boolean(),
  payoutsEnabled: z.boolean(),
  chargesEnabled: z.boolean(),
  stripeAccountId: z.string().nullable().optional(),
});
export type StripeConnectStatusResponseType = z.infer<
  typeof StripeConnectStatusResponseSchema
>;

export const DisputeSettlementBodySchema = z.object({
  clientAmount: z.coerce.number().min(0),
  freelancerAmount: z.coerce.number().min(0),
  winningParty: z.enum(['CLIENT', 'FREELANCER', 'SPLIT']),
  decisionReason: z.string().min(5).max(3000),
});
export type DisputeSettlementBodyType = z.infer<
  typeof DisputeSettlementBodySchema
>;

export const DisputeSettlementResponseSchema = z.object({
  disputeId: z.number(),
  status: z.string(),
  clientRefundAmount: z.number(),
  freelancerPayoutAmount: z.number(),
  arbitratorPayoutAmount: z.number(),
});
export type DisputeSettlementResponseType = z.infer<
  typeof DisputeSettlementResponseSchema
>;

export const CreateOnboardingLinkBodySchema = z.object({
  returnUrl: z.string().url().optional(),
});
export type CreateOnboardingLinkBodyType = z.infer<
  typeof CreateOnboardingLinkBodySchema
>;

export const RefundMilestoneBodySchema = z.object({
  reason: z.string().optional(),
});
export type RefundMilestoneBodyType = z.infer<
  typeof RefundMilestoneBodySchema
>;

export const ReleaseMilestoneResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  transferId: z.string(),
});
export type ReleaseMilestoneResponseType = z.infer<
  typeof ReleaseMilestoneResponseSchema
>;

export const RefundMilestoneResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  refundId: z.string(),
});
export type RefundMilestoneResponseType = z.infer<
  typeof RefundMilestoneResponseSchema
>;

export const SyncPaymentIntentResponseSchema = z.object({
  success: z.boolean(),
  status: z.string(),
});
export type SyncPaymentIntentResponseType = z.infer<
  typeof SyncPaymentIntentResponseSchema
>;


