import { z } from "zod";

export const ForumCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ForumCategoryListResponseSchema = z.object({
  data: z.array(ForumCategorySchema),
});

export type ForumCategoryType = z.infer<typeof ForumCategorySchema>;
export type ForumCategoryListResponseType = z.infer<
  typeof ForumCategoryListResponseSchema
>;
