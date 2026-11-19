import {
  CreateDisputeBodySchema,
  DisputeDetailSchema,
  DisputeListResponseSchema,
  GetDisputeListQuerySchema,
  GetResolutionReasonsQuerySchema,
  GetResolutionReasonsResponseSchema,
  RespondDisputeBodySchema,
  ReviewDisputeDecisionBodySchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class GetResolutionReasonsQueryDTO extends createZodDto(
  GetResolutionReasonsQuerySchema,
) {}

export class GetResolutionReasonsResponseDTO extends createZodDto(
  GetResolutionReasonsResponseSchema,
) {}

export class CreateDisputeBodyDTO extends createZodDto(
  CreateDisputeBodySchema,
) {}

export class RespondDisputeBodyDTO extends createZodDto(
  RespondDisputeBodySchema,
) {}

export class ReviewDisputeDecisionBodyDTO extends createZodDto(
  ReviewDisputeDecisionBodySchema,
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
