import { z } from "zod";

import { BrowseJobMessage } from "../message/browse-job.message";
import { JobSkillSchema } from "./job-skill.model";
import { ManageJobMessage } from "../message/manage-job.message";

export const JobSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  title: z.string().max(255),
  description: z.string().nullable(),
  budgetMin: z.coerce.number().nullable(),
  budgetMax: z.coerce.number().nullable(),
  budgetType: z.enum(["FIXED_PRICE"]),
  deadline: z.date().nullable(),
  status: z.enum([
    "DRAFT",
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
    "CANCELLED",
  ]),
  featured: z.boolean(),
  expiryDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ViewListJobFilterSchema = z.object({
  page: z.coerce
    .number()
    .int(BrowseJobMessage.INVALID_PAGE)
    .min(1, BrowseJobMessage.INVALID_PAGE)
    .default(1),

  limit: z.coerce
    .number()
    .int(BrowseJobMessage.INVALID_LIMIT)
    .min(1, BrowseJobMessage.INVALID_LIMIT)
    .max(20, BrowseJobMessage.INVALID_LIMIT)
    .default(10),
});

export const JobPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const ViewListJobResponseSchema = z.object({
  data: z.array(JobSchema),
  pagination: JobPaginationSchema,
});

export const ViewJobDetailResSchema = JobSchema.extend({
  skills: z.array(JobSkillSchema),
});

export const CreateJobBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .nonempty(ManageJobMessage.TITLE_REQUIRED)
      .min(10, ManageJobMessage.TITLE_TOO_SHORT)
      .max(255, ManageJobMessage.TITLE_TOO_LONG),

    description: z
      .string()
      .trim()
      .max(5000, ManageJobMessage.DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),

    budgetMin: z.coerce
      .number({
        error: ManageJobMessage.BUDGET_MIN_INVALID,
      })
      .min(0, ManageJobMessage.BUDGET_MIN_INVALID)
      .nullable()
      .optional(),

    budgetMax: z.coerce
      .number({
        error: ManageJobMessage.BUDGET_MAX_INVALID,
      })
      .min(0, ManageJobMessage.BUDGET_MAX_INVALID)
      .nullable()
      .optional(),

    budgetType: z.enum(["FIXED_PRICE"], {
      error: ManageJobMessage.BUDGET_TYPE_INVALID,
    }),

    deadline: z.coerce
      .date({
        error: ManageJobMessage.DEADLINE_INVALID,
      })
      .nullable()
      .optional(),

    expiryDate: z.coerce
      .date({
        error: ManageJobMessage.EXPIRY_DATE_INVALID,
      })
      .nullable()
      .optional(),

    skills: z
      .array(
        z
          .string()
          .trim()
          .min(1, ManageJobMessage.SKILL_NAME_REQUIRED)
          .max(100, ManageJobMessage.SKILL_NAME_TOO_LONG),
      )
      .min(1, ManageJobMessage.SKILLS_REQUIRED),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.budgetMin !== null &&
      data.budgetMax !== null &&
      data.budgetMin !== undefined &&
      data.budgetMax !== undefined &&
      data.budgetMin > data.budgetMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMax"],
        message: ManageJobMessage.BUDGET_MAX_MUST_BE_GREATER_THAN_BUDGET_MIN,
      });
    }

    if (data.deadline && data.expiryDate && data.expiryDate > data.deadline) {
      ctx.addIssue({
        code: "custom",
        path: ["expiryDate"],
        message: ManageJobMessage.EXPIRY_DATE_MUST_BE_BEFORE_DEADLINE,
      });
    }
  });

export type CreateJobBodyType = z.infer<typeof CreateJobBodySchema>;
export type ViewJobDetailResType = z.infer<typeof ViewJobDetailResSchema>;

export type JobType = z.infer<typeof JobSchema>;

export type ViewListJobFilterType = z.infer<typeof ViewListJobFilterSchema>;

export type ViewListJobResponseType = z.infer<typeof ViewListJobResponseSchema>;
