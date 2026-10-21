import { z } from 'zod';
import {
  DisputeDecisionResponseEnum,
  DisputeEvidenceTypeEnum,
  DisputeFeeStatusEnum,
  DisputeStatusEnum,
  MAX_DISPUTE_EVIDENCE_FILES,
} from '../constants/dispute.constant';

export const DisputeEvidenceFileItemSchema = z.object({
  fileId: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});
export type DisputeEvidenceFileItemType = z.infer<
  typeof DisputeEvidenceFileItemSchema
>;

export const CreateDisputeBodySchema = z.object({
  milestoneId: z.number().int().positive(),
  reason: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  evidenceFiles: z
    .array(DisputeEvidenceFileItemSchema)
    .max(MAX_DISPUTE_EVIDENCE_FILES)
    .optional(),
});
export type CreateDisputeBodyType = z.infer<typeof CreateDisputeBodySchema>;

export const PayDisputeFeeBodySchema = z.object({
  paymentMethodId: z.string().optional(),
});
export type PayDisputeFeeBodyType = z.infer<typeof PayDisputeFeeBodySchema>;

export const SubmitDisputeResponseBodySchema = z.object({
  description: z.string().min(10).max(5000),
  evidenceFiles: z
    .array(DisputeEvidenceFileItemSchema)
    .max(MAX_DISPUTE_EVIDENCE_FILES)
    .optional(),
});
export type SubmitDisputeResponseBodyType = z.infer<
  typeof SubmitDisputeResponseBodySchema
>;

export const ReviewDisputeDecisionBodySchema = z.object({
  response: z.enum(['ACCEPTED', 'REJECTED']),
  reason: z.string().max(2000).optional(),
});
export type ReviewDisputeDecisionBodyType = z.infer<
  typeof ReviewDisputeDecisionBodySchema
>;

export const AdminDisputeDecisionBodySchema = z.object({
  freelancerAmount: z.coerce.number().min(0),
  clientAmount: z.coerce.number().min(0),
  decisionReason: z.string().min(5).max(3000),
});
export type AdminDisputeDecisionBodyType = z.infer<
  typeof AdminDisputeDecisionBodySchema
>;

export const AdminDisputeFinalDecisionBodySchema = z.object({
  freelancerAmount: z.coerce.number().min(0),
  clientAmount: z.coerce.number().min(0),
  decisionReason: z.string().min(5).max(3000),
});
export type AdminDisputeFinalDecisionBodyType = z.infer<
  typeof AdminDisputeFinalDecisionBodySchema
>;

export const GetDisputeListQuerySchema = z.object({
  status: DisputeStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'feeDeadline', 'responseDeadline'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type GetDisputeListQueryType = z.infer<typeof GetDisputeListQuerySchema>;

export const DisputeFeeSchema = z.object({
  id: z.number(),
  disputeId: z.number(),
  userId: z.number(),
  amount: z.coerce.number(),
  status: DisputeFeeStatusEnum,
  paymentIntentId: z.string().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type DisputeFeeType = z.infer<typeof DisputeFeeSchema>;

export const DisputeEvidenceSchema = z.object({
  id: z.number(),
  disputeId: z.number(),
  submittedById: z.number(),
  type: DisputeEvidenceTypeEnum,
  description: z.string().nullable().optional(),
  fileId: z.number().nullable().optional(),
  createdAt: z.coerce.date(),
  file: z
    .object({
      id: z.number(),
      fileUrl: z.string(),
      fileName: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type DisputeEvidenceTypeModel = z.infer<typeof DisputeEvidenceSchema>;

export const DisputeDecisionReviewSchema = z.object({
  id: z.number(),
  disputeId: z.number(),
  userId: z.number(),
  response: DisputeDecisionResponseEnum,
  reason: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});
export type DisputeDecisionReviewType = z.infer<
  typeof DisputeDecisionReviewSchema
>;

export const DisputeDetailSchema = z.object({
  id: z.number(),
  milestoneId: z.number(),
  openedById: z.number(),
  respondentId: z.number(),
  reason: z.string(),
  description: z.string(),
  status: DisputeStatusEnum,
  arbitrationFee: z.coerce.number(),
  feeDeadline: z.coerce.date(),
  responseDeadline: z.coerce.date().nullable().optional(),
  freelancerAmount: z.coerce.number().nullable().optional(),
  clientAmount: z.coerce.number().nullable().optional(),
  decisionReason: z.string().nullable().optional(),
  decisionById: z.number().nullable().optional(),
  decisionAt: z.coerce.date().nullable().optional(),
  finalDecisionAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  milestone: z
    .object({
      id: z.number(),
      contractId: z.number(),
      title: z.string(),
      amount: z.coerce.number(),
      status: z.string(),
      paymentStatus: z.string(),
    })
    .optional(),
  openedBy: z
    .object({
      id: z.number(),
      email: z.string(),
    })
    .optional(),
  respondent: z
    .object({
      id: z.number(),
      email: z.string(),
    })
    .optional(),
  decisionBy: z
    .object({
      id: z.number(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  fees: z.array(DisputeFeeSchema).optional(),
  evidences: z.array(DisputeEvidenceSchema).optional(),
  decisionReviews: z.array(DisputeDecisionReviewSchema).optional(),
});
export type DisputeDetailType = z.infer<typeof DisputeDetailSchema>;

export const DisputeListResponseSchema = z.object({
  data: z.array(DisputeDetailSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type DisputeListResponseType = z.infer<typeof DisputeListResponseSchema>;
