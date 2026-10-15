import {
  CreateJobAlertBodySchema,
  CreateJobAlertResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateJobAlertBodyDto extends createZodDto(
  CreateJobAlertBodySchema,
) {}

export class CreateJobAlertResponseDto extends createZodDto(
  CreateJobAlertResponseSchema,
) {}
