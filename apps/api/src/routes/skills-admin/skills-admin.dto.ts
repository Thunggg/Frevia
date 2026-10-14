import { createZodDto } from 'nestjs-zod';
import {
  AdminCreateSkillBodySchema,
  AdminUpdateSkillBodySchema,
  SkillAdminDeleteResponseSchema,
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

export class SkillAdminDeleteResponseDto extends createZodDto(
  SkillAdminDeleteResponseSchema,
) {}

export class CreateSkillBodyDto extends createZodDto(
  AdminCreateSkillBodySchema,
) {}

export class UpdateSkillBodyDto extends createZodDto(
  AdminUpdateSkillBodySchema,
) {}
