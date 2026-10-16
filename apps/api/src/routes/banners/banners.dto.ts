import { createZodDto } from 'nestjs-zod';
import {
  BannerPublicListResponseSchema,
  BannerPublicQuerySchema,
} from '@shared/types';

export class BannerPublicQueryDto extends createZodDto(
  BannerPublicQuerySchema,
) {}

export class BannerPublicListResponseDto extends createZodDto(
  BannerPublicListResponseSchema,
) {}
