import { z } from "zod";

import { JobBudgetTypeSchema, JobStatusSchema } from "./job.model";

// Loại phản hồi người dùng dành cho một kết quả recommendation (plan.cv.md §11.2).
export const RecommendationFeedbackTypeSchema = z.enum([
  "VIEW",
  "SAVE",
  "APPLY",
  "DISMISS",
  "SHORTLIST",
  "HIRE",
]);

// Điểm thành phần của Hybrid Ranking (§7). `keyword` chỉ có khi caller gửi BM25.
export const RecommendationComponentsSchema = z.object({
  semantic: z.number(),
  skills: z.number(),
  experience: z.number(),
  budget: z.number(),
  preferences: z.number(),
  keyword: z.number().nullable(),
});

// ----- Freelancer nhận được khi client xem gợi ý ứng viên cho job của mình -----

export const RecommendedFreelancerSkillSchema = z.object({
  name: z.string(),
  proficiencyLevel: z.number().nullable(),
});

export const RecommendedFreelancerSchema = z.object({
  // `recommendationId` là id bản ghi đã lưu (null khi chưa lưu được).
  recommendationId: z.number().nullable(),
  score: z.number(),
  components: RecommendationComponentsSchema,
  profileId: z.number(),
  userId: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  title: z.string().nullable(),
  skills: z.array(RecommendedFreelancerSkillSchema),
});

export const ViewRecommendedFreelancersQuerySchema = z.object({
  jobId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const RecommendedFreelancerResponseSchema = z.object({
  data: z.array(RecommendedFreelancerSchema),
});

// ----- Job freelancer nhận được -----

export const RecommendedJobSchema = z.object({
  recommendationId: z.number().nullable(),
  score: z.number(),
  components: RecommendationComponentsSchema,
  job: z.object({
    id: z.number(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    budgetMin: z.number().nullable(),
    budgetMax: z.number().nullable(),
    budgetType: JobBudgetTypeSchema,
    status: JobStatusSchema,
    skills: z.array(z.string()),
    createdAt: z.date(),
  }),
});

export const ViewRecommendedJobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const RecommendedJobResponseSchema = z.object({
  data: z.array(RecommendedJobSchema),
});

// ----- Explanation (§8) -----

export const RecommendationExplainClaimSchema = z.object({
  statement: z.string(),
  verdict: z.enum(["hit", "missing", "unknown"]),
  evidence: z.string().nullable(),
  source: z.enum(["job", "cv"]).nullable(),
  confidence: z.number().nullable(),
});

export const RecommendationExplanationSchema = z.object({
  ready: z.boolean(),
  summary: z.string().nullable(),
  claims: z.array(RecommendationExplainClaimSchema),
  fallbackReason: z.string().nullable(),
  model: z.string(),
  durationMs: z.number(),
});

// ----- Feedback (§11.2) -----

export const RecommendationFeedbackBodySchema = z
  .object({
    type: RecommendationFeedbackTypeSchema,
  })
  .strict();

export const RecommendationFeedbackResponseSchema = z.object({
  id: z.number(),
  recommendationId: z.number(),
  type: RecommendationFeedbackTypeSchema,
  createdAt: z.date(),
});

// ----- Reindex (§16 vận hành): nạp lại toàn bộ CV/job đang mở vào Chroma -----

export const RecommendationReindexResponseSchema = z.object({
  indexed: z.number(),
});

// ----- Outbox (§6.3): xử lý sự kiện đồng bộ index đang chờ -----

export const RecommendationOutboxProcessResponseSchema = z.object({
  processed: z.number(),
  failed: z.number(),
});

export type RecommendationFeedbackType = z.infer<
  typeof RecommendationFeedbackTypeSchema
>;

export type RecommendationComponentsType = z.infer<
  typeof RecommendationComponentsSchema
>;

export type RecommendedFreelancerType = z.infer<
  typeof RecommendedFreelancerSchema
>;

export type RecommendedFreelancerResponseType = z.infer<
  typeof RecommendedFreelancerResponseSchema
>;

export type RecommendedJobType = z.infer<typeof RecommendedJobSchema>;

export type RecommendedJobResponseType = z.infer<
  typeof RecommendedJobResponseSchema
>;

export type ViewRecommendedFreelancersQueryType = z.output<
  typeof ViewRecommendedFreelancersQuerySchema
>;

export type ViewRecommendedJobsQueryType = z.output<
  typeof ViewRecommendedJobsQuerySchema
>;

export type RecommendationExplanationType = z.infer<
  typeof RecommendationExplanationSchema
>;

export type RecommendationFeedbackBodyType = z.infer<
  typeof RecommendationFeedbackBodySchema
>;

export type RecommendationFeedbackResponseType = z.infer<
  typeof RecommendationFeedbackResponseSchema
>;

export type RecommendationReindexResponseType = z.infer<
  typeof RecommendationReindexResponseSchema
>;

export type RecommendationOutboxProcessResponseType = z.infer<
  typeof RecommendationOutboxProcessResponseSchema
>;
