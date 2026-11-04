import { z } from 'zod';
import { ManageJobAlertMessage } from '../message/job-alert.message';

export const JobAlertSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  keywords: z.string().nullable().optional(),
  skills: z.array(z.string()),
  createdAt: z.date(),
});

export const CreateJobAlertBodySchema = z
  .object({
    keywords: z.string().trim().max(200).nullable().optional(),
    skills: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  })
  .strict()
  .refine(
    (data) => {
      const hasKeywords = Boolean(data.keywords && data.keywords.trim().length > 0);
      const hasSkills = Boolean(data.skills && data.skills.length > 0);
      return hasKeywords || hasSkills;
    },
    {
      message: ManageJobAlertMessage.KEYWORD_OR_SKILL_REQUIRED,
      path: ['keywords'],
    },
  );

export const UpdateJobAlertBodySchema = z
  .object({
    keywords: z.string().trim().max(200).nullable().optional(),
    skills: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.keywords === undefined && data.skills === undefined) {
        return true;
      }
      const hasKeywords = Boolean(data.keywords && data.keywords.trim().length > 0);
      const hasSkills = Boolean(data.skills && data.skills.length > 0);
      return hasKeywords || hasSkills;
    },
    {
      message: ManageJobAlertMessage.KEYWORD_OR_SKILL_REQUIRED,
      path: ['keywords'],
    },
  );

export const GetJobAlertsResponseSchema = z.array(JobAlertSchema);
export const GetJobAlertDetailResponseSchema = JobAlertSchema;
export const CreateJobAlertResponseSchema = JobAlertSchema;
export const UpdateJobAlertResponseSchema = JobAlertSchema;
export const DeleteJobAlertResponseSchema = z.object({
  success: z.boolean(),
});

export type JobAlertType = z.infer<typeof JobAlertSchema>;
export type CreateJobAlertBodyType = z.infer<typeof CreateJobAlertBodySchema>;
export type UpdateJobAlertBodyType = z.infer<typeof UpdateJobAlertBodySchema>;
export type DeleteJobAlertResponseType = z.infer<
  typeof DeleteJobAlertResponseSchema
>;
