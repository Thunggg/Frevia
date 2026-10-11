import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { PortfolioService } from './portfolio.service';
import {
  PortfolioItemListResponseDto,
  AddPortfolioDto,
  AddPortfolioResponseDto,
  PortfolioItemResponseDto,
  UpdatePortfolioDto,
  UpdatePortfolioResponseDto,
} from './portfolio.dto';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { IsPublic } from '../../shared/decorators/auth.decorator';

@Controller('profiles')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':id/portfolios')
  @IsPublic()
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
  @IsPublic()
  @ZodSerializerDto(PortfolioItemResponseDto)
  async getPortfolioDetail(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.getPortfolioDetail(id);
  }

  @Put('portfolios/:id')
  @ZodSerializerDto(UpdatePortfolioResponseDto)
  async updatePortfolio(
    @UserActive('userId') currentUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePortfolioDto,
  ) {
    return this.portfolioService.updatePortfolio(id, currentUserId, body);
  }

  @Delete('portfolios/:id')
  async deletePortfolio(
    @UserActive('userId') currentUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.portfolioService.deletePortfolio(id, currentUserId);
  }
}
