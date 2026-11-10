import { z } from "zod";
import { ManageContractMessage } from "../message/manage-contract.message";
import { ManageMilestoneMessage } from "../message/manage-milestone.message";
import { ContractStatusEnum } from "../constants/contract.constand";
import { PlatformFeeStatusEnum } from "../constants/payment.constant";

/**
 * Returns the upper bound timestamp (ms) for a contract's expiration date.
 * Date-only legacy values saved at 00:00:00.000Z are treated as extending through
 * the end of that UTC calendar day so same-day milestone deadlines stay valid.
 */
export function getEffectiveContractDeadlineMs(expiresAt: Date | string): number {
  const date = new Date(expiresAt);
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return date.getTime() + 86_399_999;
  }
  return date.getTime();
}

export const ContractSchema = z.object({
  id: z.number(),
  slug: z.string(),
  jobId: z.number(),
  proposalId: z.number(),
  clientId: z.number(),
  freelancerId: z.number(),
  terms: z.string().nullable(),
  totalAmount: z.coerce.number(),
  status: ContractStatusEnum,
  platformFee: z.coerce.number().optional().default(10),
  clientPlatformFee: z.coerce.number().optional().default(0),
  platformFeeStatus: PlatformFeeStatusEnum.optional().default("UNPAID"),
  platformFeePaidAt: z.coerce.date().nullable().optional(),
  clientFeeStatus: PlatformFeeStatusEnum.optional().default("UNPAID"),
  clientFeePaidAt: z.coerce.date().nullable().optional(),
  freelancerFeeStatus: PlatformFeeStatusEnum.optional().default("UNPAID"),
  freelancerFeePaidAt: z.coerce.date().nullable().optional(),
  signedByClient: z.boolean(),
  signedByFreelancer: z.boolean(),
  clientSignedAt: z.coerce.date().nullable().optional(),
  freelancerSignedAt: z.coerce.date().nullable().optional(),
  rejectedAt: z.coerce.date().nullable().optional(),
  rejectReason: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  signedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export const CreateContractMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z
    .string({ message: ManageMilestoneMessage.DUE_DATE_REQUIRED })
    .datetime({ message: ManageMilestoneMessage.DUE_DATE_FUTURE })
    .refine((val) => new Date(val) > new Date(), {
      message: ManageMilestoneMessage.DUE_DATE_FUTURE,
    }),
});
export type CreateContractMilestoneType = z.infer<typeof CreateContractMilestoneSchema>;

export const CreateContractBodySchema = z
  .object({
    proposalId: z
      .number({ message: ManageContractMessage.PROPOSAL_ID_REQUIRED })
      .int()
      .positive(),

    totalAmount: z
      .number({ message: ManageContractMessage.TOTAL_AMOUNT_REQUIRED })
      .positive({ message: ManageContractMessage.TOTAL_AMOUNT_POSITIVE }),

    terms: z.string().optional(),

    expiresAt: z
      .string({ message: ManageContractMessage.EXPIRES_AT_REQUIRED })
      .datetime({ message: ManageContractMessage.EXPIRES_AT_FUTURE })
      .refine((val) => new Date(val) > new Date(), {
        message: ManageContractMessage.EXPIRES_AT_FUTURE,
      }),

    milestones: z.array(CreateContractMilestoneSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.milestones || data.milestones.length === 0) return;
    const contractEndMs = getEffectiveContractDeadlineMs(data.expiresAt);
    data.milestones.forEach((m, index) => {
      if (new Date(m.dueDate).getTime() > contractEndMs) {
        ctx.addIssue({
          code: "custom",
          message: ManageContractMessage.MILESTONE_DUE_DATE_EXCEEDS_CONTRACT,
          path: ["milestones", index, "dueDate"],
        });
      }
    });
  });

export const UpdateContractBodySchema = z.object({
  totalAmount: z
    .number({ message: ManageContractMessage.TOTAL_AMOUNT_REQUIRED })
    .positive({ message: ManageContractMessage.TOTAL_AMOUNT_POSITIVE })
    .optional(),

  terms: z.string().optional(),

  expiresAt: z
    .string()
    .datetime({ message: ManageContractMessage.EXPIRES_AT_FUTURE })
    .refine((val) => new Date(val) > new Date(), {
      message: ManageContractMessage.EXPIRES_AT_FUTURE,
    })
    .optional(),
});

const ContractUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

const ContractJobSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
});

export const ContractDetailSchema = ContractSchema.extend({
  client: ContractUserSchema,
  freelancer: ContractUserSchema,
  job: ContractJobSchema,
  milestones: z
    .array(
      z.object({
        id: z.number(),
        contractId: z.number(),
        title: z.string(),
        description: z.string().nullable().optional(),
        amount: z.coerce.number(),
        status: z.string(),
        paymentStatus: z.string(),
        dueDate: z.coerce.date().nullable().optional(),
        completedAt: z.coerce.date().nullable().optional(),
      }),
    )
    .optional(),
});

export const GetContractListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: ContractStatusEnum.optional(),
  proposalId: z.coerce.number().int().positive().optional(),
});

export const GetContractListResponseSchema = z.object({
  data: z.array(ContractDetailSchema),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateContractResponseSchema = ContractSchema;
export const UpdateContractResponseSchema = ContractSchema;
export const SignContractResponseSchema = ContractSchema;
export const CompleteContractResponseSchema = ContractSchema;
export const CancelContractResponseSchema = ContractSchema;
export const RejectContractBodySchema = z.object({
  reason: z.string().optional(),
});
export const RejectContractResponseSchema = ContractSchema;

export type ContractType = z.infer<typeof ContractSchema>;
export type ContractDetailType = z.infer<typeof ContractDetailSchema>;
export type CreateContractBodyType = z.infer<typeof CreateContractBodySchema>;
export type UpdateContractBodyType = z.infer<typeof UpdateContractBodySchema>;
export type RejectContractBodyType = z.infer<typeof RejectContractBodySchema>;
export type CreateContractResponseType = z.infer<
  typeof CreateContractResponseSchema
>;
export type GetContractListQueryType = z.infer<
  typeof GetContractListQuerySchema
>;
export type GetContractListResponseType = z.infer<
  typeof GetContractListResponseSchema
>;
