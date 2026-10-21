import { z } from 'zod';

export const DisputeStatusEnum = z.enum([
  'OPEN',
  'WAITING_RESPONSE',
  'UNDER_REVIEW',
  'DECISION_MADE',
  'REVIEW_REQUESTED',
  'FINALIZED',
  'CANCELLED',
]);
export type DisputeStatusType = z.infer<typeof DisputeStatusEnum>;

export const DisputeFeeStatusEnum = z.enum(['PENDING', 'PAID', 'OVERDUE']);
export type DisputeFeeStatusType = z.infer<typeof DisputeFeeStatusEnum>;

export const DisputeEvidenceTypeEnum = z.enum(['CLAIM', 'RESPONSE']);
export type DisputeEvidenceTypeType = z.infer<typeof DisputeEvidenceTypeEnum>;

export const DisputeDecisionResponseEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'REJECTED',
]);
export type DisputeDecisionResponseType = z.infer<
  typeof DisputeDecisionResponseEnum
>;

export const DEFAULT_ARBITRATION_FEE = 50.0;
export const FEE_DEADLINE_HOURS = 24;
export const RESPONSE_DEADLINE_HOURS = 48;
export const MAX_DISPUTE_EVIDENCE_FILES = 5;
