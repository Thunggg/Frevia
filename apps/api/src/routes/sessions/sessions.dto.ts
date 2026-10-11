import {
  SessionDetailResponseSchema,
  SessionFilterSchema,
  SessionListResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class SessionFilterDto extends createZodDto(SessionFilterSchema) {}

export class SessionListResponseDto extends createZodDto(
  SessionListResponseSchema,
) {}

export class SessionDetailResponseDto extends createZodDto(
  SessionDetailResponseSchema,
) {}
