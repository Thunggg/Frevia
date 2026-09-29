import {
  CreateRoleBodySchema,
  CreateRoleResponseSchema,
  RoleDetailResponseSchema,
  RoleListResponseSchema,
  UpdateRoleBodySchema,
  UpdateRoleResponseSchema,
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

export class UpdateRoleBodyDto extends createZodDto(UpdateRoleBodySchema) {}

export class UpdateRoleResponseDto extends createZodDto(
  UpdateRoleResponseSchema,
) {}
