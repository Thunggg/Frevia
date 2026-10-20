import { createZodDto } from 'nestjs-zod';
import {
  ApproveProfileRevisionSchema,
  MyProfileRevisionSchema,
  ProfileRevisionAdminFilterSchema,
  ProfileRevisionAdminListSchema,
  ProfileRevisionSchema,
  ProfileRevisionSubmissionSchema,
  RejectProfileRevisionSchema,
} from '@shared/types';

export class ProfileRevisionSubmissionDto extends createZodDto(
  ProfileRevisionSubmissionSchema,
) {}
export class MyProfileRevisionDto extends createZodDto(
  MyProfileRevisionSchema,
) {}
export class ProfileRevisionAdminFilterDto extends createZodDto(
  ProfileRevisionAdminFilterSchema,
) {}
export class ProfileRevisionAdminListDto extends createZodDto(
  ProfileRevisionAdminListSchema,
) {}
export class ProfileRevisionDetailDto extends createZodDto(
  ProfileRevisionSchema,
) {}
export class ApproveProfileRevisionDto extends createZodDto(
  ApproveProfileRevisionSchema,
) {}
export class RejectProfileRevisionDto extends createZodDto(
  RejectProfileRevisionSchema,
) {}
