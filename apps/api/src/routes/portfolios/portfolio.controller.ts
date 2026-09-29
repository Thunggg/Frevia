import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { PortfolioService } from './portfolio.service';
import {
  PortfolioItemListResponseDto,
  AddPortfolioDto,
  AddPortfolioResponseDto,
  PortfolioItemResponseDto,
} from './portfolio.dto';
import { UserActive } from '../../shared/decorators/user-active.decorators';

@Controller('profiles')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':id/portfolios')
  @ZodSerializerDto(PortfolioItemListResponseDto)
  async getPortfolios(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.getPortfolios(id);
  }

  @Post(':id/portfolios')
  @ZodSerializerDto(AddPortfolioResponseDto)
  async addPortfolio(
    @UserActive('userId') currentUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddPortfolioDto,
  ) {
    return this.portfolioService.addPortfolio(id, currentUserId, body);
  }

  @Get('portfolios/:id')
  @ZodSerializerDto(PortfolioItemResponseDto)
  async getPortfolioDetail(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.getPortfolioDetail(id);
  }
}
