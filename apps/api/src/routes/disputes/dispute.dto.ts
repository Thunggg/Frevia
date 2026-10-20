import {
  AdminDisputeDecisionBodySchema,
  AdminDisputeFinalDecisionBodySchema,
  CreateDisputeBodySchema,
  DisputeDetailSchema,
  DisputeListResponseSchema,
  GetDisputeListQuerySchema,
  PayDisputeFeeBodySchema,
  ReviewDisputeDecisionBodySchema,
  SubmitDisputeResponseBodySchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateDisputeBodyDTO extends createZodDto(
  CreateDisputeBodySchema,
) {}

export class PayDisputeFeeBodyDTO extends createZodDto(
  PayDisputeFeeBodySchema,
) {}

export class SubmitDisputeResponseBodyDTO extends createZodDto(
  SubmitDisputeResponseBodySchema,
) {}

export class ReviewDisputeDecisionBodyDTO extends createZodDto(
  ReviewDisputeDecisionBodySchema,
) {}

export class AdminDisputeDecisionBodyDTO extends createZodDto(
  AdminDisputeDecisionBodySchema,
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
