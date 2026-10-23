import {
  CompleteExpertConsultationSchema,
  CreateExpertConsultationSchema,
  ExpertConsultationListQuerySchema,
  ExpertConsultationListSchema,
  ExpertConsultationSchema,
  RejectExpertConsultationSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateExpertConsultationDto extends createZodDto(
  CreateExpertConsultationSchema,
) {}
export class RejectExpertConsultationDto extends createZodDto(
  RejectExpertConsultationSchema,
) {}
export class CompleteExpertConsultationDto extends createZodDto(
  CompleteExpertConsultationSchema,
) {}
export class ExpertConsultationListQueryDto extends createZodDto(
  ExpertConsultationListQuerySchema,
) {}
export class ExpertConsultationDto extends createZodDto(
  ExpertConsultationSchema,
) {}
export class ExpertConsultationListDto extends createZodDto(
  ExpertConsultationListSchema,
) {}
