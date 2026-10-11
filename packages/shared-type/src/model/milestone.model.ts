import { z } from 'zod';
import { ManageMilestoneMessage } from '../message/manage-milestone.message';
import { MilestoneStatusEnum, MilestonePaymentStatusEnum } from '../constants/milestone.constant';

export const MilestoneSchema = z.object({
    id: z.number(),
    contractId: z.number(),
    title: z.string(),
    description: z.string().nullable(),
    amount: z.coerce.number(),
    status: MilestoneStatusEnum,
    paymentStatus: MilestonePaymentStatusEnum,
    dueDate: z.coerce.date().nullable(),
    completedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable(),
});

export const CreateMilestoneBodySchema = z.object({
    title: z
        .string({ message: ManageMilestoneMessage.TITLE_REQUIRED })
        .min(1, { message: ManageMilestoneMessage.TITLE_REQUIRED }),

    description: z.string().optional(),

    amount: z
        .number({ message: ManageMilestoneMessage.AMOUNT_REQUIRED })
        .positive({ message: ManageMilestoneMessage.AMOUNT_POSITIVE }),

    dueDate: z
        .string()
        .datetime({ message: ManageMilestoneMessage.DUE_DATE_FUTURE })
        .refine(
            (val) => new Date(val) > new Date(),
            { message: ManageMilestoneMessage.DUE_DATE_FUTURE },
        )
        .optional(),
});

export const UpdateMilestoneBodySchema = z.object({
    title: z
        .string({ message: ManageMilestoneMessage.TITLE_REQUIRED })
        .min(1, { message: ManageMilestoneMessage.TITLE_REQUIRED })
        .optional(),

    description: z.string().optional(),

    amount: z
        .number({ message: ManageMilestoneMessage.AMOUNT_REQUIRED })
        .positive({ message: ManageMilestoneMessage.AMOUNT_POSITIVE })
        .optional(),

    dueDate: z
        .string()
        .datetime({ message: ManageMilestoneMessage.DUE_DATE_FUTURE })
        .refine(
            (val) => new Date(val) > new Date(),
            { message: ManageMilestoneMessage.DUE_DATE_FUTURE },
        )
        .optional(),
});


export const GetMilestoneListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: MilestoneStatusEnum.optional(),
});


export const GetMilestoneListResponseSchema = z.object({
    data: z.array(MilestoneSchema),
    totalItems: z.number(),
    totalPages: z.number(),
    page: z.number(),
    limit: z.number(),
});

export const CreateMilestoneResponseSchema = MilestoneSchema;
export const UpdateMilestoneResponseSchema = MilestoneSchema;
export const DeleteMilestoneResponseSchema = MilestoneSchema;
export const ProgressMilestoneResponseSchema = MilestoneSchema;

export type MilestoneType = z.infer<typeof MilestoneSchema>;
export type CreateMilestoneBodyType = z.infer<typeof CreateMilestoneBodySchema>;
export type UpdateMilestoneBodyType = z.infer<typeof UpdateMilestoneBodySchema>;
export type GetMilestoneListQueryType = z.infer<typeof GetMilestoneListQuerySchema>;
export type GetMilestoneListResponseType = z.infer<typeof GetMilestoneListResponseSchema>;
