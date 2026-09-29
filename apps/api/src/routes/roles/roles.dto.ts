import {
  CreateRoleBodySchema,
  CreateRoleResponseSchema,
  RoleDetailResponseSchema,
  RoleListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class RoleListResponseDto extends createZodDto(RoleListResponseSchema) {}

export class RoleDetailResponseDto extends createZodDto(
  RoleDetailResponseSchema,
) {}

export class CreateRoleBodyDto extends createZodDto(CreateRoleBodySchema) {}

export class CreateRoleResponseDto extends createZodDto(
  CreateRoleResponseSchema,
) {}
