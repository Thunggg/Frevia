import { Controller, Get, Query } from '@nestjs/common';

import { ViewListJobQueryDto, ViewListJobResponseDto } from './browse-job.dto';
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
}
