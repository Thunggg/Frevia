import { z } from "zod";

export const SavedSearchParamsSchema = z.record(z.string(), z.unknown());

export const SavedSearchSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  name: z.string().max(100),
  searchParams: SavedSearchParamsSchema,
  createdAt: z.date(),
});

export const CreateSavedSearchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    searchParams: SavedSearchParamsSchema,
  })
  .strict();

export const UpdateSavedSearchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
  })
  .strict();

export const GetSavedSearchesResponseSchema = z.array(SavedSearchSchema);
export const GetSavedSearchDetailResponseSchema = SavedSearchSchema;
export const CreateSavedSearchResponseSchema = SavedSearchSchema;
export const UpdateSavedSearchResponseSchema = SavedSearchSchema;

export type SavedSearchType = z.infer<typeof SavedSearchSchema>;
export type CreateSavedSearchBodyType = z.infer<
  typeof CreateSavedSearchBodySchema
>;
export type UpdateSavedSearchBodyType = z.infer<
  typeof UpdateSavedSearchBodySchema
>;
