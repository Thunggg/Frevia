import { createZodDto } from 'nestjs-zod';
import {
  AdminUserListResponseSchema,
  AdminUserQuerySchema,
} from '@shared/types';

export class AdminUserQueryDto extends createZodDto(AdminUserQuerySchema) {}

export class AdminUserListResponseDto extends createZodDto(
  AdminUserListResponseSchema,
) {}
