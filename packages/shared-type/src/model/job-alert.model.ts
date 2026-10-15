import { z } from "zod";

import { ManageJobAlertMessage } from "../message/manage-job-alert.message";
import { JobBudgetTypeSchema } from "./job.model";

export const JobAlertFrequencySchema = z.enum(["INSTANT", "DAILY", "WEEKLY"], {
  error: ManageJobAlertMessage.FREQUENCY_INVALID,
});

export const JobAlertChannelSchema = z.enum(["IN_APP", "EMAIL"], {
  error: ManageJobAlertMessage.CHANNEL_INVALID,
});

export const JobAlertSkillSchema = z.object({
  jobAlertId: z.number().int().positive(),
  skillId: z.number().int().positive(),
  skill: z.object({
    name: z.string().max(100),
  }),
});

export const JobAlertSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  name: z.string().max(100),
  keywords: z.string().max(255).nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  budgetType: JobBudgetTypeSchema.nullable(),
  frequency: JobAlertFrequencySchema,
  channels: z.array(JobAlertChannelSchema),
  isActive: z.boolean(),
  lastTriggeredAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  skills: z.array(JobAlertSkillSchema),
});

export const CreateJobAlertBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, ManageJobAlertMessage.NAME_REQUIRED)
      .max(100, ManageJobAlertMessage.NAME_TOO_LONG),
    keywords: z
      .string()
      .trim()
      .max(255, ManageJobAlertMessage.KEYWORDS_TOO_LONG)
      .nullable()
      .optional(),
    budgetMin: z.coerce
      .number({ error: ManageJobAlertMessage.BUDGET_MIN_INVALID })
      .min(0, ManageJobAlertMessage.BUDGET_MIN_INVALID)
      .nullable()
      .optional(),
    budgetMax: z.coerce
      .number({ error: ManageJobAlertMessage.BUDGET_MAX_INVALID })
      .min(0, ManageJobAlertMessage.BUDGET_MAX_INVALID)
      .nullable()
      .optional(),
    budgetType: JobBudgetTypeSchema.nullable().optional(),
    frequency: JobAlertFrequencySchema.default("INSTANT"),
    channels: z
      .array(JobAlertChannelSchema)
      .min(1, ManageJobAlertMessage.CHANNELS_REQUIRED),
    skills: z
      .array(
        z
          .number()
          .int(ManageJobAlertMessage.SKILL_INVALID)
          .positive(ManageJobAlertMessage.SKILL_INVALID),
      )
      .default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMin > data.budgetMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMax"],
        message: ManageJobAlertMessage.BUDGET_RANGE_INVALID,
      });
    }
  });

export const CreateJobAlertResponseSchema = JobAlertSchema;

export const GetJobAlertsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int(ManageJobAlertMessage.INVALID_PAGE)
    .min(1, ManageJobAlertMessage.INVALID_PAGE)
    .default(1),
  limit: z.coerce
    .number()
    .int(ManageJobAlertMessage.INVALID_LIMIT)
    .min(1, ManageJobAlertMessage.INVALID_LIMIT)
    .max(20, ManageJobAlertMessage.INVALID_LIMIT)
    .default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GetJobAlertsResponseSchema = z.object({
  data: z.array(JobAlertSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type JobAlertType = z.infer<typeof JobAlertSchema>;
export type CreateJobAlertBodyInputType = z.input<
  typeof CreateJobAlertBodySchema
>;
export type CreateJobAlertBodyType = z.output<typeof CreateJobAlertBodySchema>;
export type GetJobAlertsQueryType = z.output<typeof GetJobAlertsQuerySchema>;
export type GetJobAlertsResponseType = z.infer<
  typeof GetJobAlertsResponseSchema
>;
