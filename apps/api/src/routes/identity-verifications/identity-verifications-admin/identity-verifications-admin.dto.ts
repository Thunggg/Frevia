import { createZodDto } from 'nestjs-zod';
import {
  ApproveIdentityVerificationBodySchema,
  IdentityVerificationAdminActionResponseSchema,
  IdentityVerificationAdminDetailSchema,
  IdentityVerificationAdminFilterSchema,
  IdentityVerificationAdminListResponseSchema,
  RejectIdentityVerificationBodySchema,
} from '@shared/types';

export class IdentityVerificationAdminFilterDto extends createZodDto(
  IdentityVerificationAdminFilterSchema,
) {}
export class IdentityVerificationAdminListResponseDto extends createZodDto(
  IdentityVerificationAdminListResponseSchema,
) {}
export class IdentityVerificationAdminDetailResponseDto extends createZodDto(
  IdentityVerificationAdminDetailSchema,
) {}
export class ApproveIdentityVerificationBodyDto extends createZodDto(
  ApproveIdentityVerificationBodySchema,
) {}
export class RejectIdentityVerificationBodyDto extends createZodDto(
  RejectIdentityVerificationBodySchema,
) {}
export class IdentityVerificationAdminActionResponseDto extends createZodDto(
  IdentityVerificationAdminActionResponseSchema,
) {}
