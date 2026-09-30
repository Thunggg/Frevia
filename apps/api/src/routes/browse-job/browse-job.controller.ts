import { Controller, Get, Param, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  ViewJobDetailResponseDto,
  ViewListJobQueryDto,
  ViewListJobResponseDto,
} from './browse-job.dto';
import { BrowseJobService } from './browse-job.service';

@Controller('jobs')
export class BrowseJobController {
  constructor(private readonly browseJobService: BrowseJobService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(ViewListJobResponseDto)
  viewListJob(@Query() query: ViewListJobQueryDto) {
    return this.browseJobService.viewListJob(query);
  }

  @Get(':slug')
  @IsPublic()
  @ZodSerializerDto(ViewJobDetailResponseDto)
  viewJobDetail(@Param('slug') slug: string) {
    return this.browseJobService.viewJobDetail(slug);
  }
}
