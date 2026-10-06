import { z } from 'zod';
import { ManageContractMessage } from '../message/manage-contract.message';
import { ContractStatusEnum } from '../constants/contract.constand';

export const ContractSchema = z.object({
    id: z.number(),
    jobId: z.number(),
    proposalId: z.number(),
    clientId: z.number(),
    freelancerId: z.number(),
    terms: z.string().nullable(),
    totalAmount: z.coerce.number(),
    status: ContractStatusEnum,
    signedByClient: z.boolean(),
    signedByFreelancer: z.boolean(),
    createdAt: z.coerce.date(),
    signedAt: z.coerce.date().nullable(),
    completedAt: z.coerce.date().nullable(),
    expiresAt: z.coerce.date().nullable(),
    deletedAt: z.coerce.date().nullable(),
});

export const CreateContractBodySchema = z.object({
    proposalId: z
        .number({ message: ManageContractMessage.PROPOSAL_ID_REQUIRED })
        .int()
        .positive(),

    totalAmount: z
        .number({ message: ManageContractMessage.TOTAL_AMOUNT_REQUIRED })
        .positive({ message: ManageContractMessage.TOTAL_AMOUNT_POSITIVE }),

    terms: z.string().optional(),

    expiresAt: z
        .string()
        .datetime({ message: ManageContractMessage.EXPIRES_AT_FUTURE })
        .refine(
            (val) => new Date(val) > new Date(),
            { message: ManageContractMessage.EXPIRES_AT_FUTURE },
        )
        .optional(),
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
        .refine(
            (val) => new Date(val) > new Date(),
            { message: ManageContractMessage.EXPIRES_AT_FUTURE },
        )
        .optional(),
});

const ContractUserSchema = z.object({
    id: z.number(),
    email: z.string(),
    profile: z.object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
    }).nullable(),
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
});

export const GetContractListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: ContractStatusEnum.optional(),
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

export type ContractType = z.infer<typeof ContractSchema>;
export type ContractDetailType = z.infer<typeof ContractDetailSchema>;
export type CreateContractBodyType = z.infer<typeof CreateContractBodySchema>;
export type UpdateContractBodyType = z.infer<typeof UpdateContractBodySchema>;
export type CreateContractResponseType = z.infer<typeof CreateContractResponseSchema>;
export type GetContractListQueryType = z.infer<typeof GetContractListQuerySchema>;
export type GetContractListResponseType = z.infer<typeof GetContractListResponseSchema>;