import {
  CreateJobAlertBodySchema,
  CreateJobAlertResponseSchema,
  GetJobAlertsQuerySchema,
  GetJobAlertsResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateJobAlertBodyDto extends createZodDto(
  CreateJobAlertBodySchema,
) {}

export class CreateJobAlertResponseDto extends createZodDto(
  CreateJobAlertResponseSchema,
) {}

export class GetJobAlertsQueryDto extends createZodDto(
  GetJobAlertsQuerySchema,
) {}

export class GetJobAlertsResponseDto extends createZodDto(
  GetJobAlertsResponseSchema,
) {}
