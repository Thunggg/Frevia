import {
  DeleteSharedFileResponseSchema,
  GetSharedFilesResponseSchema,
  UploadSharedFileResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class UploadSharedFileResponseDTO extends createZodDto(
  UploadSharedFileResponseSchema,
) {}
export class GetSharedFilesResponseDTO extends createZodDto(
  GetSharedFilesResponseSchema,
) {}
export class DeleteSharedFileResponseDTO extends createZodDto(
  DeleteSharedFileResponseSchema,
) {}
