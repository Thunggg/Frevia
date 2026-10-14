import { createZodDto } from 'nestjs-zod';
import {
  AdminCreateUserBodySchema,
  AdminCreateUserResponseSchema,
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
