import {
  PermissionDetailResponseSchema,
  PermissionFilterSchema,
  PermissionListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class PermissionFilterDto extends createZodDto(PermissionFilterSchema) {}

export class PermissionListResponseDto extends createZodDto(
  PermissionListResponseSchema,
) {}

export class PermissionDetailResponseDto extends createZodDto(
  PermissionDetailResponseSchema,
) {}
