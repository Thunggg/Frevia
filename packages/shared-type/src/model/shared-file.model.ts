import { z } from 'zod';

export const SharedFileSchema = z.object({
    id: z.number(),
    contractId: z.number(),
    uploaderId: z.number(),
    fileUrl: z.string(),
    publicId: z.string(),
    fileName: z.string().nullable(),
    createdAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const UploadSharedFileResponseSchema = SharedFileSchema;

export const GetSharedFilesResponseSchema = z.array(
    SharedFileSchema,
);

export const DeleteSharedFileResponseSchema = SharedFileSchema;

export type SharedFileType = z.infer<typeof SharedFileSchema>;
export type UploadSharedFileResponseType = z.infer<typeof UploadSharedFileResponseSchema>;
export type GetSharedFilesResponseType = z.infer<typeof GetSharedFilesResponseSchema>;
export type DeleteSharedFileResponseType = z.infer<typeof DeleteSharedFileResponseSchema>;