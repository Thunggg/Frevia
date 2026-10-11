import { createZodDto } from 'nestjs-zod';
import {
  PortfolioItemListResponseSchema,
  AddPortfolioSchema,
  AddPortfolioResponseSchema,
  PortfolioItemSchema,
  UpdatePortfolioSchema,
  UpdatePortfolioResponseSchema,
} from '@shared/types';

export class PortfolioItemListResponseDto extends createZodDto(
  PortfolioItemListResponseSchema,
) {}

export class AddPortfolioDto extends createZodDto(AddPortfolioSchema) {}

export class AddPortfolioResponseDto extends createZodDto(
  AddPortfolioResponseSchema,
) {}

export class PortfolioItemResponseDto extends createZodDto(
  PortfolioItemSchema,
) {}

export class UpdatePortfolioDto extends createZodDto(UpdatePortfolioSchema) {}

export class UpdatePortfolioResponseDto extends createZodDto(
  UpdatePortfolioResponseSchema,
) {}
