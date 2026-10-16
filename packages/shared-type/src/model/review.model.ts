import { z } from "zod";

const ReviewDateTimeSchema = z.union([z.date(), z.iso.datetime()]);
const RatingSchema = z.coerce.number().min(1).max(5);

export const ReviewBreakdownSchema = z
  .record(z.string().trim().min(1).max(50), RatingSchema)
  .refine((value) => Object.keys(value).length <= 10, {
    message: "A review can contain at most 10 rating criteria.",
  });

export const ReviewUserSchema = z.object({
  id: z.number(),
  email: z.email(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

export const ReviewResponseSchema = z.object({
  id: z.number(),
  reviewId: z.number(),
  userId: z.number(),
  responseText: z.string(),
  createdAt: ReviewDateTimeSchema,
  deletedAt: ReviewDateTimeSchema.nullable(),
  user: ReviewUserSchema,
});

export const ReviewSchema = z.object({
  id: z.number(),
  contractId: z.number(),
  reviewerId: z.number(),
  revieweeId: z.number(),
  overallRating: z.coerce.number(),
  breakdown: ReviewBreakdownSchema.nullable(),
  comment: z.string().nullable(),
  createdAt: ReviewDateTimeSchema,
  updatedAt: ReviewDateTimeSchema,
  deletedAt: ReviewDateTimeSchema.nullable(),
  reviewer: ReviewUserSchema,
  reviewee: ReviewUserSchema,
  response: ReviewResponseSchema.nullable(),
});

export const ReviewListSchema = z.array(ReviewSchema);

export const CreateReviewSchema = z
  .object({
    overallRating: RatingSchema,
    breakdown: ReviewBreakdownSchema.nullable().optional(),
    comment: z.string().trim().max(3000).nullable().optional(),
  })
  .strict();

export const UpdateReviewSchema = CreateReviewSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Provide at least one field to update." },
);

export const CreateReviewResponseSchema = z
  .object({ responseText: z.string().trim().min(1).max(3000) })
  .strict();

export const UpdateReviewResponseSchema = CreateReviewResponseSchema;

export type ReviewType = z.infer<typeof ReviewSchema>;
export type ReviewResponseType = z.infer<typeof ReviewResponseSchema>;
export type CreateReviewType = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewType = z.infer<typeof UpdateReviewSchema>;
export type CreateReviewResponseType = z.infer<
  typeof CreateReviewResponseSchema
>;
export type UpdateReviewResponseType = z.infer<
  typeof UpdateReviewResponseSchema
>;
