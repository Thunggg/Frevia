import { z } from "zod";

export const PortfolioItemSchema = z.object({
  id: z.number(),
  freelancerProfileId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  mediaUrls: z.array(z.string()),
  projectUrl: z.string().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
  deletedAt: z.any().nullable(),
});

export const PortfolioItemListResponseSchema = z.array(PortfolioItemSchema);

export type PortfolioItemType = z.infer<typeof PortfolioItemSchema>;
export type PortfolioItemListResponseType = z.infer<
  typeof PortfolioItemListResponseSchema
>;
