import { z } from "zod";

import { ManageProposalMessage } from "../message/manage-proposal.message";

export const ProposalStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
]);

const CoverLetterSchema = z
  .string()
  .trim()
  .nonempty(ManageProposalMessage.COVER_LETTER_REQUIRED)
  .max(5000, ManageProposalMessage.COVER_LETTER_TOO_LONG);

const BidAmountSchema = z.coerce
  .number({ error: ManageProposalMessage.BID_AMOUNT_REQUIRED })
  .positive(ManageProposalMessage.BID_AMOUNT_POSITIVE);

const DeliveryDaysSchema = z.coerce
  .number({ error: ManageProposalMessage.DELIVERY_DAYS_REQUIRED })
  .int(ManageProposalMessage.DELIVERY_DAYS_POSITIVE)
  .positive(ManageProposalMessage.DELIVERY_DAYS_POSITIVE);

export const ProposalSchema = z.object({
  id: z.number(),
  jobId: z.number(),
  freelancerId: z.number(),
  coverLetter: z.string().nullable(),
  bidAmount: z.coerce.number().nullable(),
  deliveryDays: z.number().int().nullable(),
  status: ProposalStatusSchema,
  createdAt: z.date(),
  submittedAt: z.date().nullable(),
  acceptedAt: z.date().nullable(),
  rejectedAt: z.date().nullable(),
  withdrawnAt: z.date().nullable(),
  updatedAt: z.date(),
});

const ProposalJobSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  budgetMin: z.coerce.number().nullable(),
  budgetMax: z.coerce.number().nullable(),
  budgetType: z.enum(["FIXED_PRICE"]),
  deadline: z.date().nullable(),
  expiryDate: z.date().nullable(),
  status: z.enum([
    "DRAFT",
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
    "CANCELLED",
  ]),
});

const ProposalClientSchema = z.object({
  id: z.number(),
  email: z.string(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

export const ProposalDetailSchema = ProposalSchema.extend({
  job: ProposalJobSchema,
  client: ProposalClientSchema,
});

const ProposalFreelancerSchema = z.object({
  id: z.number(),
  email: z.string(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      freelancerProfile: z
        .object({
          title: z.string().nullable(),
          idVerified: z.boolean(),
        })
        .nullable(),
    })
    .nullable(),
});

export const ClientJobProposalSchema = ProposalSchema.extend({
  freelancer: ProposalFreelancerSchema,
});

export const ClientJobProposalsResponseSchema = z.array(
  ClientJobProposalSchema,
);

export const MyProposalsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  jobId: z.coerce.number().int().positive().optional(),
  status: ProposalStatusSchema.optional(),
});

export const MyProposalsResponseSchema = z.object({
  data: z.array(ProposalDetailSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateProposalBodySchema = z
  .object({
    coverLetter: CoverLetterSchema,
    bidAmount: BidAmountSchema,
    deliveryDays: DeliveryDaysSchema,
  })
  .strict();

export const SaveProposalDraftBodySchema = z
  .object({
    coverLetter: CoverLetterSchema.optional(),
    bidAmount: BidAmountSchema.optional(),
    deliveryDays: DeliveryDaysSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: ManageProposalMessage.DRAFT_CONTENT_REQUIRED,
  });

export type ProposalType = z.infer<typeof ProposalSchema>;
export type ProposalStatusType = z.infer<typeof ProposalStatusSchema>;
export type CreateProposalBodyType = z.output<typeof CreateProposalBodySchema>;
export type SaveProposalDraftBodyType = z.output<
  typeof SaveProposalDraftBodySchema
>;
export type ProposalDetailType = z.infer<typeof ProposalDetailSchema>;
export type ClientJobProposalType = z.infer<typeof ClientJobProposalSchema>;
export type ClientJobProposalsResponseType = z.infer<
  typeof ClientJobProposalsResponseSchema
>;
export type MyProposalsQueryType = z.output<typeof MyProposalsQuerySchema>;
export type MyProposalsResponseType = z.infer<typeof MyProposalsResponseSchema>;
