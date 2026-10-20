import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { PublicExpertQueryType } from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  PublicExpertDto,
  PublicExpertListDto,
  PublicExpertQueryDto,
} from './expert-profile.dto';
import { PublicExpertsService } from './public-experts.service';

@Controller('experts')
export class PublicExpertsController {
  constructor(private readonly service: PublicExpertsService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(PublicExpertListDto)
  list(@Query() query: PublicExpertQueryDto) {
    return this.service.list(query as PublicExpertQueryType);
  }

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(PublicExpertDto)
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }
}
