import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";
import { ReportStatus } from "../constants/report-status.constant";

export const ForumReportSchema = z.object({
  id: z.number(),
  reporterId: z.number(),
  postId: z.number().nullable(),
  commentId: z.number().nullable(),
  reason: z.string(),
  status: z.enum(ReportStatus),
  adminId: z.number().nullable(),
  createdAt: z.date(),
});

export const CreateForumReportSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const CreateForumReportResponseSchema = ForumReportSchema;

export const UpdateReportStatusSchema = z.object({
  status: z.enum([
    ReportStatus.PENDING,
    ReportStatus.REVIEWED,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
  ]),
});

export const UpdateReportStatusResponseSchema = ForumReportSchema;

export const ForumReportListResponseSchema = z.object({
  reports: z.array(
    ForumReportSchema.extend({
      reporter: z.object({
        id: z.number(),
        profile: z
          .object({
            displayName: z.string().nullable(),
            avatarUrl: z.string().nullable(),
          })
          .nullable(),
      }),
      post: z
        .object({
          id: z.number(),
          title: z.string(),
          categoryId: z.number().nullable(),
        })
        .nullable(),
      comment: z
        .object({
          id: z.number(),
          content: z.string(),
        })
        .nullable(),
    }),
  ),
  pagination: PaginationSchema,
});

export type ForumReportType = z.infer<typeof ForumReportSchema>;
export type CreateForumReportType = z.infer<typeof CreateForumReportSchema>;
export type CreateForumReportResponseType = z.infer<
  typeof CreateForumReportResponseSchema
>;
export type UpdateReportStatusType = z.infer<typeof UpdateReportStatusSchema>;
export type UpdateReportStatusResponseType = z.infer<
  typeof UpdateReportStatusResponseSchema
>;
export type ForumReportListResponseType = z.infer<
  typeof ForumReportListResponseSchema
>;
