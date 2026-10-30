import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { RecommendationMessage } from '@shared/types';

export const JobForRecommendationNotFoundException = () =>
  new NotFoundException(RecommendationMessage.JOB_NOT_FOUND);

export const FreelancerProfileNotFoundException = () =>
  new NotFoundException(RecommendationMessage.FREELANCER_PROFILE_NOT_FOUND);

// Chỉ freelancer xem được gợi ý job, chỉ client xem được gợi ý ứng viên.
export const RecommendationRoleNotAllowedException = () =>
  new ForbiddenException([
    {
      message: RecommendationMessage.ROLE_NOT_ALLOWED,
      path: 'roleName',
    },
  ]);

export const AiServiceUnavailableException = () =>
  new ServiceUnavailableException(RecommendationMessage.AI_SERVICE_UNAVAILABLE);

export const FailedToLoadRecommendationsException = () =>
  new InternalServerErrorException(
    RecommendationMessage.FAILED_TO_LOAD_RECOMMENDATIONS,
  );

export const RecommendationNotFoundException = () =>
  new NotFoundException(RecommendationMessage.RECOMMENDATION_NOT_FOUND);

export const RecommendationForbiddenException = () =>
  new ForbiddenException(RecommendationMessage.RECOMMENDATION_FORBIDDEN);

export const FailedToLoadExplanationException = () =>
  new InternalServerErrorException(
    RecommendationMessage.FAILED_TO_LOAD_EXPLANATION,
  );

export const FailedToSubmitFeedbackException = () =>
  new InternalServerErrorException(
    RecommendationMessage.FAILED_TO_SUBMIT_FEEDBACK,
  );

export const RecommendationReindexForbiddenException = () =>
  new ForbiddenException(RecommendationMessage.REINDEX_FORBIDDEN);

export const FailedToReindexException = () =>
  new ServiceUnavailableException(RecommendationMessage.FAILED_TO_REINDEX);

export const RecommendationOutboxForbiddenException = () =>
  new ForbiddenException(RecommendationMessage.OUTBOX_PROCESS_FORBIDDEN);

export const FailedToProcessOutboxException = () =>
  new InternalServerErrorException(
    RecommendationMessage.FAILED_TO_PROCESS_OUTBOX,
  );
