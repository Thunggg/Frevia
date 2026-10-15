import {
  CreateJobAlertBodySchema,
  CreateJobAlertResponseSchema,
  GetJobAlertDetailResponseSchema,
  GetJobAlertsQuerySchema,
  GetJobAlertsResponseSchema,
  UpdateJobAlertBodySchema,
  UpdateJobAlertResponseSchema,
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

export class UpdateJobAlertBodyDto extends createZodDto(
  UpdateJobAlertBodySchema,
) {}

export class UpdateJobAlertResponseDto extends createZodDto(
  UpdateJobAlertResponseSchema,
) {}
