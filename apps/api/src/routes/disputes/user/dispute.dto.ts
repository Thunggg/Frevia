import {
  CreateDisputeBodySchema,
  DisputeDetailSchema,
  DisputeFileSchema,
  DisputeListResponseSchema,
  GetDisputeListQuerySchema,
  RespondDisputeBodySchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class UploadDisputeFileResponseDTO extends createZodDto(
  DisputeFileSchema,
) {}

export class CreateDisputeBodyDTO extends createZodDto(
  CreateDisputeBodySchema,
) {}

export class RespondDisputeBodyDTO extends createZodDto(
  RespondDisputeBodySchema,
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
