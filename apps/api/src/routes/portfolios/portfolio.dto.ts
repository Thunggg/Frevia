import { createZodDto } from 'nestjs-zod';
import { PortfolioItemListResponseSchema } from '@shared/types';

export class PortfolioItemListResponseDto extends createZodDto(
  PortfolioItemListResponseSchema,
) {}
