import { createZodDto } from 'nestjs-zod';
import {
  AdminClientProfileResponseSchema,
  AdminCreateUserBodySchema,
  AdminCreateUserResponseSchema,
  AdminUpdateClientProfileBodySchema,
  AdminUpdateUserBodySchema,
  AdminUpdateUserResponseSchema,
  AdminUserDetailResponseSchema,
  AdminUserListResponseSchema,
  AdminUserQuerySchema,
} from '@shared/types';

export class AdminUserQueryDto extends createZodDto(AdminUserQuerySchema) {}

export class AdminUserListResponseDto extends createZodDto(
  AdminUserListResponseSchema,
) {}

export class AdminUserDetailResponseDto extends createZodDto(
  AdminUserDetailResponseSchema,
) {}

export class AdminCreateUserBodyDto extends createZodDto(
  AdminCreateUserBodySchema,
) {}

export class AdminCreateUserResponseDto extends createZodDto(
  AdminCreateUserResponseSchema,
) {}

export class AdminUpdateUserBodyDto extends createZodDto(
  AdminUpdateUserBodySchema,
) {}

export class AdminUpdateUserResponseDto extends createZodDto(
  AdminUpdateUserResponseSchema,
) {}

export class AdminUpdateClientProfileBodyDto extends createZodDto(
  AdminUpdateClientProfileBodySchema,
) {}

export class AdminClientProfileResponseDto extends createZodDto(
  AdminClientProfileResponseSchema,
) {}
