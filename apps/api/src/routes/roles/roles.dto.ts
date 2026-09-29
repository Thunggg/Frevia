import { RoleListResponseSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class RoleListResponseDto extends createZodDto(RoleListResponseSchema) {}
