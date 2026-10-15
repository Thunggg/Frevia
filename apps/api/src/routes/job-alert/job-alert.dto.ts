import {
  CreateJobAlertBodySchema,
  CreateJobAlertResponseSchema,
  GetJobAlertDetailResponseSchema,
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

export class GetJobAlertDetailResponseDto extends createZodDto(
  GetJobAlertDetailResponseSchema,
) {}

export class GetJobAlertsQueryDto extends createZodDto(
  GetJobAlertsQuerySchema,
) {}

export class GetJobAlertsResponseDto extends createZodDto(
  GetJobAlertsResponseSchema,
) {}
