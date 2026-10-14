import { createZodDto } from 'nestjs-zod';
import {
  SkillAdminDetailResponseSchema,
  SkillAdminListResponseSchema,
  SkillAdminQuerySchema,
} from '@shared/types';

export class SkillAdminQueryDto extends createZodDto(SkillAdminQuerySchema) {}

export class SkillAdminListResponseDto extends createZodDto(
  SkillAdminListResponseSchema,
) {}

export class SkillAdminDetailResponseDto extends createZodDto(
  SkillAdminDetailResponseSchema,
) {}
