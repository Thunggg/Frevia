import { z } from 'zod';

export const TransactionTypeEnum = z.enum([
  'PLATFORM_FEE',
  'ESCROW_DEPOSIT',
  'MILESTONE_PAYOUT',
  'DISPUTE_FEE',
  'ARBITRATOR_PAYOUT',
  'REFUND',
  'WITHDRAWAL',
]);
export type TransactionTypeType = z.infer<typeof TransactionTypeEnum>;

export const WithdrawalMethodEnum = z.enum([
  'BANK_TRANSFER',
  'STRIPE_EXPRESS',
]);
export type WithdrawalMethodType = z.infer<typeof WithdrawalMethodEnum>;

export const WithdrawalStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'REJECTED',
]);
export type WithdrawalStatusType = z.infer<typeof WithdrawalStatusEnum>;

export const TransactionStatusEnum = z.enum([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
]);
export type TransactionStatusType = z.infer<typeof TransactionStatusEnum>;

export const PlatformFeeStatusEnum = z.enum([
  'UNPAID',
  'PAID',
  'WAIVED',
]);
export type PlatformFeeStatusType = z.infer<typeof PlatformFeeStatusEnum>;

export const DEFAULT_PLATFORM_FEE = 10.0;
