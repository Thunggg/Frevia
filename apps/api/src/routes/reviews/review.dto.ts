import {
  CreateReviewResponseSchema,
  CreateReviewSchema,
  ReviewListSchema,
  ReviewResponseSchema,
  ReviewSchema,
  UpdateReviewResponseSchema,
  UpdateReviewSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}
export class UpdateReviewDto extends createZodDto(UpdateReviewSchema) {}
export class ReviewDto extends createZodDto(ReviewSchema) {}
export class ReviewListDto extends createZodDto(ReviewListSchema) {}
export class CreateReviewResponseDto extends createZodDto(
  CreateReviewResponseSchema,
) {}
export class UpdateReviewResponseDto extends createZodDto(
  UpdateReviewResponseSchema,
) {}
export class ReviewResponseDto extends createZodDto(ReviewResponseSchema) {}
