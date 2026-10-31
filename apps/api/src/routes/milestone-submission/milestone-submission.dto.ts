import {
  ApproveMilestoneResponseSchema,
  GetSubmissionsResponseSchema,
  GetSubmissionResponseSchema,
  RequestChangesBodySchema,
  RequestChangesResponseSchema,
  SubmitMilestoneBodySchema,
  SubmitMilestoneResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class SubmitMilestoneBodyDTO extends createZodDto(
  SubmitMilestoneBodySchema,
) {}
export class SubmitMilestoneResponseDTO extends createZodDto(
  SubmitMilestoneResponseSchema,
) {}

export class GetSubmissionsResponseDTO extends createZodDto(
  GetSubmissionsResponseSchema,
) {}
export class GetSubmissionResponseDTO extends createZodDto(
  GetSubmissionResponseSchema,
) {}

export class RequestChangesBodyDTO extends createZodDto(
  RequestChangesBodySchema,
) {}
export class RequestChangesResponseDTO extends createZodDto(
  RequestChangesResponseSchema,
) {}

export class ApproveMilestoneResponseDTO extends createZodDto(
  ApproveMilestoneResponseSchema,
) {}
