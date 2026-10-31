import { z } from 'zod';

export const MilestoneFileSchema = z.object({
    id: z.number(),
    milestoneId: z.number(),
    uploaderId: z.number(),
    fileUrl: z.string(),
    publicId: z.string(),
    fileName: z.string().nullable(),
    createdAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable(),
});

export const UploadMilestoneFileResponseSchema = MilestoneFileSchema;
export const GetMilestoneFilesResponseSchema = z.array(MilestoneFileSchema);
export const DeleteMilestoneFileResponseSchema = MilestoneFileSchema;

export type MilestoneFileType = z.infer<typeof MilestoneFileSchema>;
export type UploadMilestoneFileResponseType = z.infer<typeof UploadMilestoneFileResponseSchema>;
export type GetMilestoneFilesResponseType = z.infer<typeof GetMilestoneFilesResponseSchema>;
export type DeleteMilestoneFileResponseType = z.infer<typeof DeleteMilestoneFileResponseSchema>;
