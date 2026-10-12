import { z } from 'zod';
import { SubmissionStatusEnum } from '../constants/milestone.constant';
import { ManageMilestoneSubmissionMessage } from '../message/manage-milestone-submission.message';
import { MilestoneFileSchema } from './milestone-file.model';

export const SubmissionFileSchema = z.object({
    fileId: z.number(),
    submissionId: z.number(),
    file: MilestoneFileSchema,
});

export const MilestoneSubmissionSchema = z.object({
    id: z.number(),
    milestoneId: z.number(),
    freelancerId: z.number(),
    message: z.string().nullable(),
    links: z.array(z.string()),
    status: SubmissionStatusEnum,
    changeRequestMessage: z.string().nullable(),
    changeRequestDueDate: z.coerce.date().nullable(),
    submittedAt: z.coerce.date(),
    reviewedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const SubmitMilestoneBodySchema = z.object({
    message: z.string().optional(),
    links: z.array(z.string().url()).optional().default([]),
    fileIds: z.array(z.number().int().positive()).optional().default([]),
});

export const RequestChangesBodySchema = z.object({
    changeRequestMessage: z
        .string({ message: ManageMilestoneSubmissionMessage.MESSAGE_REQUIRED })
        .min(1, { message: ManageMilestoneSubmissionMessage.MESSAGE_REQUIRED }),
    changeRequestDueDate: z
        .string()
        .datetime()
        .refine((val) => new Date(val) > new Date(), {
            message: 'Change request due date must be in the future',
        })
        .optional(),
});

export const SubmitMilestoneResponseSchema = MilestoneSubmissionSchema;
export const GetSubmissionsResponseSchema = z.array(
    MilestoneSubmissionSchema.extend({
        files: z.array(SubmissionFileSchema),
    }),
);
export const GetSubmissionResponseSchema = MilestoneSubmissionSchema.extend({
    files: z.array(SubmissionFileSchema),
});
export const RequestChangesResponseSchema = MilestoneSubmissionSchema;
export const ApproveMilestoneResponseSchema = MilestoneSubmissionSchema;

export type MilestoneSubmissionType = z.infer<typeof MilestoneSubmissionSchema>;
export type SubmitMilestoneBodyType = z.infer<typeof SubmitMilestoneBodySchema>;
export type RequestChangesBodyType = z.infer<typeof RequestChangesBodySchema>;
export type SubmitMilestoneResponseType = z.infer<typeof SubmitMilestoneResponseSchema>;
export type GetSubmissionsResponseType = z.infer<typeof GetSubmissionsResponseSchema>;
export type GetSubmissionResponseType = z.infer<typeof GetSubmissionResponseSchema>;
export type RequestChangesResponseType = z.infer<typeof RequestChangesResponseSchema>;
export type ApproveMilestoneResponseType = z.infer<typeof ApproveMilestoneResponseSchema>;
