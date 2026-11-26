import {
  AdminDisputeDecisionBodySchema,
  DisputeDetailSchema,
  DisputeListResponseSchema,
  GetDisputeListQuerySchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class ExpertDisputeDecisionBodyDTO extends createZodDto(
  AdminDisputeDecisionBodySchema,
) {}

export class GetExpertDisputeListQueryDTO extends createZodDto(
  GetDisputeListQuerySchema,
) {}

export class ExpertDisputeDetailResponseDTO extends createZodDto(
  DisputeDetailSchema,
) {}

export class ExpertDisputeListResponseDTO extends createZodDto(
  DisputeListResponseSchema,
) {}
