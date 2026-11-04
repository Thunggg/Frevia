import { createZodDto } from 'nestjs-zod';

import {
  RecommendationFeedbackBodySchema,
  RecommendationFeedbackResponseSchema,
  RecommendationExplanationSchema,
  RecommendationOutboxProcessResponseSchema,
  RecommendationReindexResponseSchema,
  RecommendedFreelancerResponseSchema,
  RecommendedJobResponseSchema,
  ViewRecommendedFreelancersQuerySchema,
  ViewRecommendedJobsQuerySchema,
} from '@shared/types';

export class ViewRecommendedJobsQueryDto extends createZodDto(
  ViewRecommendedJobsQuerySchema,
) {}

export class ViewRecommendedFreelancersQueryDto extends createZodDto(
  ViewRecommendedFreelancersQuerySchema,
) {}

export class RecommendedJobResponseDto extends createZodDto(
  RecommendedJobResponseSchema,
) {}

export class RecommendedFreelancerResponseDto extends createZodDto(
  RecommendedFreelancerResponseSchema,
) {}

export class RecommendationExplanationDto extends createZodDto(
  RecommendationExplanationSchema,
) {}

export class RecommendationFeedbackBodyDto extends createZodDto(
  RecommendationFeedbackBodySchema,
) {}

export class RecommendationFeedbackResponseDto extends createZodDto(
  RecommendationFeedbackResponseSchema,
) {}

export class RecommendationReindexResponseDto extends createZodDto(
  RecommendationReindexResponseSchema,
) {}

export class RecommendationOutboxProcessResponseDto extends createZodDto(
  RecommendationOutboxProcessResponseSchema,
) {}
