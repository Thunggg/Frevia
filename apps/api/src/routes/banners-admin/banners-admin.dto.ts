import { createZodDto } from 'nestjs-zod';
import {
  BannerAdminDeleteResponseSchema,
  BannerAdminDetailResponseSchema,
  BannerAdminListResponseSchema,
  BannerAdminQuerySchema,
  BannerCreateBodySchema,
  BannerUpdateBodySchema,
} from '@shared/types';

export class BannerAdminQueryDto extends createZodDto(BannerAdminQuerySchema) {}

export class BannerAdminListResponseDto extends createZodDto(
  BannerAdminListResponseSchema,
) {}

export class BannerAdminDetailResponseDto extends createZodDto(
  BannerAdminDetailResponseSchema,
) {}

export class BannerAdminDeleteResponseDto extends createZodDto(
  BannerAdminDeleteResponseSchema,
) {}

export class CreateBannerBodyDto extends createZodDto(BannerCreateBodySchema) {}

export class UpdateBannerBodyDto extends createZodDto(BannerUpdateBodySchema) {}
