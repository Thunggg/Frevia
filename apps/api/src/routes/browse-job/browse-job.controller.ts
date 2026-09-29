import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import {
  ViewJobDetailResponseDto,
  ViewListJobQueryDto,
  ViewListJobResponseDto,
} from './browse-job.dto';
import { BrowseJobService } from './browse-job.service';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import type { ViewListJobFilterType } from '@shared/types';

@Controller('jobs')
export class BrowseJobController {
  constructor(private readonly browseJobService: BrowseJobService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(ViewListJobResponseDto)
  viewListJob(
    @Query(new ZodValidationPipe(ViewListJobQueryDto))
    query: ViewListJobFilterType,
  ) {
    return this.browseJobService.viewListJob(query);
  }

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(ViewJobDetailResponseDto)
  viewJobDetail(@Param('id', ParseIntPipe) id: number) {
    return this.browseJobService.viewJobDetail(id);
  }
}
