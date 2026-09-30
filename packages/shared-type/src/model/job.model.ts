import { z } from "zod";

import { BrowseJobMessage } from "../message/browse-job.message";
import { ManageJobMessage } from "../message/manage-job.message";
import { JobSkillSchema } from "./job-skill.model";

const QueryBooleanSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;

  return value;
}, z.boolean());

export const JobStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
]);

export const JobBudgetTypeSchema = z.enum(["FIXED_PRICE"]);

export const JobSchema = z.object({
  id: z.number(),

  slug: z.string(),

  clientId: z.number(),

  title: z.string().max(255),

  description: z.string().nullable(),

  budgetMin: z.coerce.number().nullable(),

  budgetMax: z.coerce.number().nullable(),

  budgetType: JobBudgetTypeSchema,

  deadline: z.date().nullable(),

  status: JobStatusSchema,

  featured: z.boolean(),

  expiryDate: z.date().nullable(),

  createdAt: z.date(),

  updatedAt: z.date(),

  skills: z.array(JobSkillSchema).optional(),
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

    budgetType: JobBudgetTypeSchema,

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
      .array(z.number().int().positive(ManageJobMessage.SKILL_NAME_REQUIRED))
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

export const UpdateJobBodySchema = CreateJobBodySchema;

export const ChangeJobStatusBodySchema = z
  .object({
    status: JobStatusSchema,
  })
  .strict();



export const ViewListJobFilterSchema = z
  .object({
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

    createdAfter: z.coerce.date().optional(),

 
    skill: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((value) => value || undefined),

    featured: QueryBooleanSchema.optional(),


    clientId: z.coerce.number().int().positive().optional(),

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
        message:
          ManageJobMessage.BUDGET_MAX_MUST_BE_GREATER_THAN_BUDGET_MIN,
      });
    }
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

export const UpdateJobResponseSchema = JobSchema;

export const ChangeJobStatusResponseSchema = JobSchema;

export type JobStatusType = z.infer<typeof JobStatusSchema>;

export type JobBudgetType = z.infer<typeof JobBudgetTypeSchema>;

export type JobType = z.infer<typeof JobSchema>;

/** Data before Zod coerces numbers and dates from an HTTP request. */
export type CreateJobBodyInputType = z.input<typeof CreateJobBodySchema>;

/** Validated data consumed by the service and repository layers. */
export type CreateJobBodyType = z.output<typeof CreateJobBodySchema>;

export type UpdateJobBodyInputType = z.input<typeof UpdateJobBodySchema>;

export type UpdateJobBodyType = z.output<typeof UpdateJobBodySchema>;

export type ChangeJobStatusBodyType = z.infer<
  typeof ChangeJobStatusBodySchema
>;

export type ViewListJobFilterType = z.input<
  typeof ViewListJobFilterSchema
>;

export type ViewListJobParsedFilterType = z.output<
  typeof ViewListJobFilterSchema
>;

export type ViewListJobResponseType = z.infer<
  typeof ViewListJobResponseSchema
>;

export type ViewJobDetailResType = z.infer<
  typeof ViewJobDetailResSchema
>;

export type UpdateJobResponseType = z.infer<
  typeof UpdateJobResponseSchema
>;

export type ChangeJobStatusResponseType = z.infer<
  typeof ChangeJobStatusResponseSchema
>;
