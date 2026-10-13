import { z } from 'zod';

import { ManageProposalMessage } from '../message/manage-proposal.message';

export const ProposalStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
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
export type CreateProposalBodyType = z.output<typeof CreateProposalBodySchema>;
export type SaveProposalDraftBodyType = z.output<
  typeof SaveProposalDraftBodySchema
>;
