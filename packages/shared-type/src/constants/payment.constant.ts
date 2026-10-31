import { z } from 'zod';

export const TransactionTypeEnum = z.enum([
  'PLATFORM_FEE',
  'ESCROW_DEPOSIT',
  'MILESTONE_PAYOUT',
  'DISPUTE_FEE',
  'ARBITRATOR_PAYOUT',
  'REFUND',
]);
export type TransactionTypeType = z.infer<typeof TransactionTypeEnum>;

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
