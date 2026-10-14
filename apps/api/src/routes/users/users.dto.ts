import { createZodDto } from 'nestjs-zod';
import {
  AdminClientProfileResponseSchema,
  AdminCreatePortfolioItemBodySchema,
  AdminCreateUserBodySchema,
  AdminCreateUserResponseSchema,
  AdminReplaceFreelancerSkillsBodySchema,
  AdminSkillCatalogListSchema,
  AdminUpdateClientProfileBodySchema,
  AdminUpdateFreelancerProfileBodySchema,
  AdminUpdatePortfolioItemBodySchema,
  AdminUpdateUserBodySchema,
  AdminUpdateUserResponseSchema,
  AdminUserDetailResponseSchema,
  AdminUserListResponseSchema,
  AdminUserQuerySchema,
} from '@shared/types';

// ====== Query & response đọc danh sách / chi tiết user (trang Admin User Management) ======
export class AdminUserQueryDto extends createZodDto(AdminUserQuerySchema) {}

export class AdminUserListResponseDto extends createZodDto(
  AdminUserListResponseSchema,
) {}

export class AdminUserDetailResponseDto extends createZodDto(
  AdminUserDetailResponseSchema,
) {}

// ====== Admin tạo user mới ======
export class AdminCreateUserBodyDto extends createZodDto(
  AdminCreateUserBodySchema,
) {}

export class AdminCreateUserResponseDto extends createZodDto(
  AdminCreateUserResponseSchema,
) {}

// ====== Admin sửa thông tin chung account (email / tên / ban) ======
export class AdminUpdateUserBodyDto extends createZodDto(
  AdminUpdateUserBodySchema,
) {}

export class AdminUpdateUserResponseDto extends createZodDto(
  AdminUpdateUserResponseSchema,
) {}

// ====== Admin sửa hồ sơ Client (công ty) ======
export class AdminUpdateClientProfileBodyDto extends createZodDto(
  AdminUpdateClientProfileBodySchema,
) {}

export class AdminClientProfileResponseDto extends createZodDto(
  AdminClientProfileResponseSchema,
) {}

// ====== Admin sửa hồ sơ Freelancer (intro / skills / portfolio) ======
export class AdminUpdateFreelancerProfileBodyDto extends createZodDto(
  AdminUpdateFreelancerProfileBodySchema,
) {}

export class AdminReplaceFreelancerSkillsBodyDto extends createZodDto(
  AdminReplaceFreelancerSkillsBodySchema,
) {}

export class AdminCreatePortfolioItemBodyDto extends createZodDto(
  AdminCreatePortfolioItemBodySchema,
) {}

export class AdminUpdatePortfolioItemBodyDto extends createZodDto(
  AdminUpdatePortfolioItemBodySchema,
) {}

// ====== Catalog skill (danh sách Skill active trong DB để chọn) ======
export class AdminSkillCatalogListDto extends createZodDto(
  AdminSkillCatalogListSchema,
) {}
