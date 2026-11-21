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

export const DisputeResolutionTypeEnum = z.enum([
  'EXTEND_DEADLINE',
  'PARTIAL_REFUND',
  'FULL_REFUND',
  'FULL_RELEASE',
]);
export type DisputeResolutionTypeType = z.infer<
  typeof DisputeResolutionTypeEnum
>;

export const DisputeRespondActionEnum = z.enum(['ACCEPT', 'DECLINE']);
export type DisputeRespondActionType = z.infer<typeof DisputeRespondActionEnum>;

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

export const RESPONSE_DEADLINE_HOURS = 48;
export const MAX_DISPUTE_EVIDENCE_FILES = 5;
