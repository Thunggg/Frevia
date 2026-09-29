import { z } from "zod";

import { JobSchema } from "./job.model";

export const JobBookmarkSchema = z.object({
  userId: z.number(),

  jobId: z.number(),

  createdAt: z.date(),
});

export const ViewBookmarkedJobFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).default(10),
});

export const ViewBookmarkedJobResponseSchema = z.object({
  data: z.array(JobSchema),

  pagination: z.object({
    page: z.number().int().min(1),

    limit: z.number().int().min(1),

    total: z.number().int().min(0),

    totalPages: z.number().int().min(0),
  }),
});

export type JobBookmarkType = z.infer<typeof JobBookmarkSchema>;

export type ViewBookmarkedJobFilterType = z.infer<
  typeof ViewBookmarkedJobFilterSchema
>;

export type ViewBookmarkedJobResponseType = z.infer<
  typeof ViewBookmarkedJobResponseSchema
>;
