import { createZodDto } from 'nestjs-zod';
import {
  CreateForumReportSchema,
  CreateForumReportResponseSchema,
  UpdateReportStatusSchema,
  UpdateReportStatusResponseSchema,
  ForumReportListResponseSchema,
} from '@shared/types';

export class CreateForumReportDto extends createZodDto(
  CreateForumReportSchema,
) {}

export class CreateForumReportResponseDto extends createZodDto(
  CreateForumReportResponseSchema,
) {}

export class UpdateReportStatusDto extends createZodDto(
  UpdateReportStatusSchema,
) {}

export class UpdateReportStatusResponseDto extends createZodDto(
  UpdateReportStatusResponseSchema,
) {}

export class ForumReportListResponseDto extends createZodDto(
  ForumReportListResponseSchema,
) {}
