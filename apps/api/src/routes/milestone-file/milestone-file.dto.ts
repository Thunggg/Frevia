import {
  DeleteMilestoneFileResponseSchema,
  GetMilestoneFilesResponseSchema,
  UploadMilestoneFileResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class UploadMilestoneFileResponseDTO extends createZodDto(
  UploadMilestoneFileResponseSchema,
) {}
export class GetMilestoneFilesResponseDTO extends createZodDto(
  GetMilestoneFilesResponseSchema,
) {}
export class DeleteMilestoneFileResponseDTO extends createZodDto(
  DeleteMilestoneFileResponseSchema,
) {}
