import { z } from "zod";
import { PortfolioMessage } from "../message/portfolio.message";

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

export const AddPortfolioSchema = z.object({
  title: z
    .string({ message: PortfolioMessage.PORTFOLIO_TITLE_REQUIRED })
    .min(1, PortfolioMessage.PORTFOLIO_TITLE_REQUIRED)
    .max(255),
  description: z.string().nullable().optional(),
  mediaUrls: z.array(z.string()).optional(),
  projectUrl: z.string().nullable().optional(),
});

export const AddPortfolioResponseSchema = PortfolioItemSchema;

export type AddPortfolioType = z.infer<typeof AddPortfolioSchema>;
export type AddPortfolioResponseType = z.infer<typeof AddPortfolioResponseSchema>;

export const UpdatePortfolioSchema = z.object({
  title: z
    .string({ message: PortfolioMessage.PORTFOLIO_TITLE_REQUIRED })
    .min(1, PortfolioMessage.PORTFOLIO_TITLE_REQUIRED)
    .max(255),
  description: z.string().nullable().optional(),
  mediaUrls: z.array(z.string()).optional(),
  projectUrl: z.string().nullable().optional(),
});

export const UpdatePortfolioResponseSchema = PortfolioItemSchema;

export type UpdatePortfolioType = z.infer<typeof UpdatePortfolioSchema>;
export type UpdatePortfolioResponseType = z.infer<
  typeof UpdatePortfolioResponseSchema
>;
