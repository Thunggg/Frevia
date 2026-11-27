import { z } from 'zod';
import {
  DisputeDecisionResponseEnum,
  DisputeEvidenceTypeEnum,
  DisputeResolutionTypeEnum,
  DisputeRespondActionEnum,
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
  resolutionType: DisputeResolutionTypeEnum.optional(),
  proposedFreelancerAmount: z.coerce.number().min(0).optional(),
  proposedClientAmount: z.coerce.number().min(0).optional(),
  proposedDueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(8))
    .optional(),
  evidenceFiles: z
    .array(DisputeEvidenceFileItemSchema)
    .max(MAX_DISPUTE_EVIDENCE_FILES)
    .optional(),
});
export type CreateDisputeBodyType = z.infer<typeof CreateDisputeBodySchema>;

export const RespondDisputeBodySchema = z.object({
  action: DisputeRespondActionEnum,
  reason: z.string().max(5000).optional(),
  evidenceFiles: z
    .array(DisputeEvidenceFileItemSchema)
    .max(MAX_DISPUTE_EVIDENCE_FILES)
    .optional(),
});
export type RespondDisputeBodyType = z.infer<typeof RespondDisputeBodySchema>;

export const AdminDisputeDecisionBodySchema = z.object({
  freelancerAmount: z.coerce.number().min(0),
  clientAmount: z.coerce.number().min(0),
  decisionReason: z.string().min(5).max(3000),
});
export type AdminDisputeDecisionBodyType = z.infer<
  typeof AdminDisputeDecisionBodySchema
>;

export const GetDisputeListQuerySchema = z.object({
  status: DisputeStatusEnum.optional(),
  contractId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'responseDeadline'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type GetDisputeListQueryType = z.infer<typeof GetDisputeListQuerySchema>;

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

export const DisputeFileSchema = z.object({
  id: z.number(),
  disputeId: z.number().nullable().optional(),
  uploaderId: z.number(),
  fileUrl: z.string(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  fileType: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
});
export type DisputeFileType = z.infer<typeof DisputeFileSchema>;

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
  resolutionType: DisputeResolutionTypeEnum.optional(),
  proposedFreelancerAmount: z.coerce.number().nullable().optional(),
  proposedClientAmount: z.coerce.number().nullable().optional(),
  proposedDueDate: z.coerce.date().nullable().optional(),
  previousMilestoneStatus: z.string().nullable().optional(),
  declineReason: z.string().nullable().optional(),
  declinedAt: z.coerce.date().nullable().optional(),
  escalatedAt: z.coerce.date().nullable().optional(),
  status: DisputeStatusEnum,
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
      description: z.string().nullable().optional(),
      amount: z.coerce.number(),
      status: z.string(),
      paymentStatus: z.string(),
      dueDate: z.coerce.date().nullable().optional(),
      files: z
        .array(
          z.object({
            id: z.number(),
            uploaderId: z.number(),
            fileUrl: z.string(),
            fileName: z.string().nullable().optional(),
            createdAt: z.coerce.date(),
          }),
        )
        .optional(),
      submissions: z
        .array(
          z.object({
            id: z.number(),
            freelancerId: z.number(),
            message: z.string().nullable().optional(),
            links: z.array(z.string()).default([]),
            status: z.string(),
            changeRequestMessage: z.string().nullable().optional(),
            changeRequestDueDate: z.coerce.date().nullable().optional(),
            submittedAt: z.coerce.date(),
            reviewedAt: z.coerce.date().nullable().optional(),
            files: z
              .array(
                z.object({
                  file: z.object({
                    id: z.number(),
                    fileUrl: z.string(),
                    fileName: z.string().nullable().optional(),
                  }),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      contract: z
        .object({
          id: z.number(),
          slug: z.string().optional(),
          clientId: z.number(),
          freelancerId: z.number(),
          terms: z.string().nullable().optional(),
          totalAmount: z.coerce.number().optional(),
          status: z.string().optional(),
          signedAt: z.coerce.date().nullable().optional(),
          expiresAt: z.coerce.date().nullable().optional(),
          job: z
            .object({
              id: z.number(),
              title: z.string(),
            })
            .optional(),
          milestones: z
            .array(
              z.object({
                id: z.number(),
                title: z.string(),
                amount: z.coerce.number(),
                status: z.string(),
                paymentStatus: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
    })
    .optional(),
  openedBy: z
    .object({
      id: z.number(),
      email: z.string(),
      profile: z
        .object({
          displayName: z.string().nullable().optional(),
          avatarUrl: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  respondent: z
    .object({
      id: z.number(),
      email: z.string(),
      profile: z
        .object({
          displayName: z.string().nullable().optional(),
          avatarUrl: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  decisionBy: z
    .object({
      id: z.number(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  evidences: z.array(DisputeEvidenceSchema).optional(),
  decisionReviews: z.array(DisputeDecisionReviewSchema).optional(),
  conversationMessages: z
    .array(
      z.object({
        id: z.number(),
        senderId: z.number(),
        message: z.string(),
        fileUrl: z.string().nullable().optional(),
        fileName: z.string().nullable().optional(),
        createdAt: z.coerce.date(),
      }),
    )
    .optional(),
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
