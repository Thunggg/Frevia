import {
  CreateJobAlertBodySchema,
  CreateJobAlertResponseSchema,
  DeleteJobAlertResponseSchema,
  GetJobAlertDetailResponseSchema,
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

export class GetJobAlertsResponseDto extends createZodDto(
  GetJobAlertsResponseSchema,
) {}

export class GetJobAlertDetailResponseDto extends createZodDto(
  GetJobAlertDetailResponseSchema,
) {}

export class UpdateJobAlertBodyDto extends createZodDto(
  UpdateJobAlertBodySchema,
) {}

export class UpdateJobAlertResponseDto extends createZodDto(
  UpdateJobAlertResponseSchema,
) {}

export class DeleteJobAlertResponseDto extends createZodDto(
  DeleteJobAlertResponseSchema,
) {}
