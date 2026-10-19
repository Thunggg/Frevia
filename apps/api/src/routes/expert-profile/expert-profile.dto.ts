import {
  AdminUpdateExpertProfileSchema,
  ExpertProfileSchema,
  ExpertProfileUpdateResponseSchema,
  PublicExpertListSchema,
  PublicExpertQuerySchema,
  PublicExpertSchema,
  UpdateExpertProfileSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class ExpertProfileDto extends createZodDto(ExpertProfileSchema) {}
export class UpdateExpertProfileDto extends createZodDto(
  UpdateExpertProfileSchema,
) {}
export class AdminUpdateExpertProfileDto extends createZodDto(
  AdminUpdateExpertProfileSchema,
) {}
export class ExpertProfileUpdateResponseDto extends createZodDto(
  ExpertProfileUpdateResponseSchema,
) {}
export class PublicExpertQueryDto extends createZodDto(
  PublicExpertQuerySchema,
) {}
export class PublicExpertListDto extends createZodDto(PublicExpertListSchema) {}
export class PublicExpertDto extends createZodDto(PublicExpertSchema) {}
