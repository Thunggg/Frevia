import {
  PermissionDetailResponseSchema,
  PermissionListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class PermissionListResponseDto extends createZodDto(
  PermissionListResponseSchema,
) {}

export class PermissionDetailResponseDto extends createZodDto(
  PermissionDetailResponseSchema,
) {}
