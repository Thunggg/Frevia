import { z } from "zod";
import { PortfolioMessage } from "../message/portfolio.message";

const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
const TechnologiesSchema = z
  .array(z.string().trim().min(1).max(100))
  .max(20, PortfolioMessage.PORTFOLIO_TECHNOLOGY_LIMIT);

export const PortfolioItemSchema = z.object({
  id: z.number(),
  freelancerProfileId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  technologies: TechnologiesSchema,
  projectUrl: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.nullable(),
});

export const PortfolioItemListResponseSchema = z.array(PortfolioItemSchema);

export type PortfolioItemType = z.infer<typeof PortfolioItemSchema>;
export type PortfolioItemListResponseType = z.infer<
  typeof PortfolioItemListResponseSchema
>;

export const AddPortfolioSchema = z
  .object({
    title: z
      .string({ message: PortfolioMessage.PORTFOLIO_TITLE_REQUIRED })
      .trim()
      .min(1, PortfolioMessage.PORTFOLIO_TITLE_REQUIRED)
      .max(255, PortfolioMessage.PORTFOLIO_TITLE_TOO_LONG),
    description: z
      .string()
      .trim()
      .max(5000, PortfolioMessage.PORTFOLIO_DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),
    technologies: TechnologiesSchema.optional(),
    projectUrl: z
      .url(PortfolioMessage.PORTFOLIO_INVALID_URL)
      .nullable()
      .optional(),
  })
  .strict();

export const AddPortfolioResponseSchema = PortfolioItemSchema;

export type AddPortfolioType = z.infer<typeof AddPortfolioSchema>;
export type AddPortfolioResponseType = z.infer<
  typeof AddPortfolioResponseSchema
>;

export const UpdatePortfolioSchema = z
  .object({
    title: z
      .string({ message: PortfolioMessage.PORTFOLIO_TITLE_REQUIRED })
      .trim()
      .min(1, PortfolioMessage.PORTFOLIO_TITLE_REQUIRED)
      .max(255, PortfolioMessage.PORTFOLIO_TITLE_TOO_LONG),
    description: z
      .string()
      .trim()
      .max(5000, PortfolioMessage.PORTFOLIO_DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),
    technologies: TechnologiesSchema.optional(),
    projectUrl: z
      .url(PortfolioMessage.PORTFOLIO_INVALID_URL)
      .nullable()
      .optional(),
  })
  .strict();

export const UpdatePortfolioResponseSchema = PortfolioItemSchema;

export type UpdatePortfolioType = z.infer<typeof UpdatePortfolioSchema>;
export type UpdatePortfolioResponseType = z.infer<
  typeof UpdatePortfolioResponseSchema
>;
