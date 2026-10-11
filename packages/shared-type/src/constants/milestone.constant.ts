import { z } from 'zod';

export const MilestoneStatusEnum = z.enum([
    'PENDING',
    'IN_PROGRESS',
    'SUBMITTED',
    'CHANGES_REQUESTED',
    'COMPLETED',
    'DISPUTED',
]);

export const MilestonePaymentStatusEnum = z.enum([
    'PENDING',
    'FUNDED',
    'RELEASED',
    'REFUNDED',
]);

export const SubmissionStatusEnum = z.enum([
    'PENDING_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
]);
