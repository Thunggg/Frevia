import { z } from "zod";

import {
  JobBudgetTypeSchema,
  JobStatusSchema,
  ViewJobDetailResSchema,
} from "./job.model";

/**
 * Parse query boolean chính xác:
 * "true"  -> true
 * "false" -> false
 */
const QueryBooleanSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;

  return value;
}, z.boolean());

export const JobBookmarkSchema = z.object({
  userId: z.number(),

  jobId: z.number(),

  createdAt: z.date(),
});

export const ViewBookmarkedJobFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(20).default(10),

    search: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((value) => value || undefined),

    status: JobStatusSchema.optional(),

    budgetType: JobBudgetTypeSchema.optional(),

    budgetMin: z.coerce.number().min(0).optional(),

    budgetMax: z.coerce.number().min(0).optional(),

    skill: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((value) => value || undefined),

    featured: QueryBooleanSchema.optional(),

    sortBy: z
      .enum([
        "createdAt",
        "updatedAt",
        "title",
        "budgetMin",
        "budgetMax",
        "deadline",
        "expiryDate",
      ])
      .default("createdAt"),

    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((data, ctx) => {
    if (
      data.budgetMin !== undefined &&
      data.budgetMax !== undefined &&
      data.budgetMin > data.budgetMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMax"],
        message: "Error.BudgetMaxMustBeGreaterThanBudgetMin",
      });
    }
  });

export const ViewBookmarkedJobResponseSchema = z.object({
  data: z.array(ViewJobDetailResSchema),

  pagination: z.object({
    page: z.number().int().min(1),

    limit: z.number().int().min(1),

    total: z.number().int().min(0),

    totalPages: z.number().int().min(0),
  }),
});

export const BookmarkJobBodySchema = JobBookmarkSchema.pick({
  jobId: true,
});

export type JobBookmarkType = z.infer<typeof JobBookmarkSchema>;

export type BookmarkJobBodyType = z.infer<typeof BookmarkJobBodySchema>;

export type ViewBookmarkedJobFilterType = z.input<
  typeof ViewBookmarkedJobFilterSchema
>;

export type ViewBookmarkedJobParsedFilterType = z.output<
  typeof ViewBookmarkedJobFilterSchema
>;

export type ViewBookmarkedJobResponseType = z.infer<
  typeof ViewBookmarkedJobResponseSchema
>;
