import {
  CreateMilestoneBodySchema,
  CreateMilestoneResponseSchema,
  UpdateMilestoneBodySchema,
  UpdateMilestoneResponseSchema,
  DeleteMilestoneResponseSchema,
  GetMilestoneListQuerySchema,
  GetMilestoneListResponseSchema,
  MilestoneSchema,
  ProgressMilestoneResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateMilestoneBodyDTO extends createZodDto(
  CreateMilestoneBodySchema,
) {}
export class CreateMilestoneResponseDTO extends createZodDto(
  CreateMilestoneResponseSchema,
) {}

export class UpdateMilestoneBodyDTO extends createZodDto(
  UpdateMilestoneBodySchema,
) {}
export class UpdateMilestoneResponseDTO extends createZodDto(
  UpdateMilestoneResponseSchema,
) {}

export class DeleteMilestoneResponseDTO extends createZodDto(
  DeleteMilestoneResponseSchema,
) {}

export class GetMilestoneListQueryDTO extends createZodDto(
  GetMilestoneListQuerySchema,
) {}
export class GetMilestoneListResponseDTO extends createZodDto(
  GetMilestoneListResponseSchema,
) {}
export class GetMilestoneDetailResponseDTO extends createZodDto(
  MilestoneSchema,
) {}
export class ProgressMilestoneResponseDTO extends createZodDto(
  ProgressMilestoneResponseSchema,
) {}
