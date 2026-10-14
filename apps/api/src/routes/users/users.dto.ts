import { createZodDto } from 'nestjs-zod';
import {
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
