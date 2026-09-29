import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { PortfolioService } from './portfolio.service';
import { PortfolioItemListResponseDto } from './portfolio.dto';

@Controller('profiles')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':id/portfolios')
  @ZodSerializerDto(PortfolioItemListResponseDto)
  async getPortfolios(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.getPortfolios(id);
  }
}
