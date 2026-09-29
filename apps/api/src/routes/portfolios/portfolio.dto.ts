import { createZodDto } from 'nestjs-zod';
import {
  PortfolioItemListResponseSchema,
  AddPortfolioSchema,
  AddPortfolioResponseSchema,
} from '@shared/types';

export class PortfolioItemListResponseDto extends createZodDto(
  PortfolioItemListResponseSchema,
) {}

export class AddPortfolioDto extends createZodDto(AddPortfolioSchema) {}

export class AddPortfolioResponseDto extends createZodDto(
  AddPortfolioResponseSchema,
) {}
