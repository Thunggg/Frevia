import { z } from 'zod';

import { BrowseJobMessage } from '../message/browse-job.message';

export const JobSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  title: z.string().max(255),
  description: z.string().nullable(),
  budgetMin: z.coerce.number().nullable(),
  budgetMax: z.coerce.number().nullable(),
  budgetType: z.enum(['FIXED_PRICE']),
  deadline: z.date().nullable(),
  status: z.enum([
    'DRAFT',
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CLOSED',
    'CANCELLED',
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


export type JobType = z.infer<typeof JobSchema>;

export type ViewListJobFilterType = z.infer<
  typeof ViewListJobFilterSchema
>;

export type ViewListJobResponseType = z.infer<
  typeof ViewListJobResponseSchema
>;