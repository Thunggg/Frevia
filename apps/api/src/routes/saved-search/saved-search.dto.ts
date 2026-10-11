import {
  CreateSavedSearchBodySchema,
  CreateSavedSearchResponseSchema,
  GetSavedSearchDetailResponseSchema,
  GetSavedSearchesResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateSavedSearchBodyDto extends createZodDto(
  CreateSavedSearchBodySchema,
) {}

export class CreateSavedSearchResponseDto extends createZodDto(
  CreateSavedSearchResponseSchema,
) {}

export class GetSavedSearchesResponseDto extends createZodDto(
  GetSavedSearchesResponseSchema,
) {}

export class GetSavedSearchDetailResponseDto extends createZodDto(
  GetSavedSearchDetailResponseSchema,
) {}
