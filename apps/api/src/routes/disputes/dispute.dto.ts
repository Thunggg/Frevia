import {
  AdminDisputeFinalDecisionBodySchema,
  ClaimDisputeResponseSchema,
  CreateDisputeBodySchema,
  DisputeDetailSchema,
  DisputeListResponseSchema,
  GetDisputeListQuerySchema,
  ReviewDisputeDecisionBodySchema,
  SubmitDisputeResponseBodySchema,
  CounterOfferBodySchema,
  AssignExpertBodySchema,
  MatchingExpertsResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateDisputeBodyDTO extends createZodDto(
  CreateDisputeBodySchema,
) {}

export class SubmitDisputeResponseBodyDTO extends createZodDto(
  SubmitDisputeResponseBodySchema,
) {}

export class CounterOfferBodyDTO extends createZodDto(CounterOfferBodySchema) {}

export class AssignExpertBodyDTO extends createZodDto(AssignExpertBodySchema) {}

export class MatchingExpertsResponseDTO extends createZodDto(
  MatchingExpertsResponseSchema,
) {}

export class ReviewDisputeDecisionBodyDTO extends createZodDto(
  ReviewDisputeDecisionBodySchema,
) {}

export class AdminDisputeFinalDecisionBodyDTO extends createZodDto(
  AdminDisputeFinalDecisionBodySchema,
) {}

export class GetDisputeListQueryDTO extends createZodDto(
  GetDisputeListQuerySchema,
) {}

export class DisputeDetailResponseDTO extends createZodDto(
  DisputeDetailSchema,
) {}

export class DisputeListResponseDTO extends createZodDto(
  DisputeListResponseSchema,
) {}

export class ClaimDisputeResponseDTO extends createZodDto(
  ClaimDisputeResponseSchema,
) {}
