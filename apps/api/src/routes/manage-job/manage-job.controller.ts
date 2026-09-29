import { Controller, Get, Query } from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';

import type { ViewBookmarkedJobFilterType } from '@shared/types';

import {
  ViewBookmarkedJobQueryDto,
  ViewBookmarkedJobResponseDto,
} from './manage-job.dto';
import { ManageJobService } from './manage-job.service';
import { UserActive } from '../../shared/decorators/user-active.decorators';

@Controller('manage-jobs')
export class ManageJobController {
  constructor(private readonly manageJobService: ManageJobService) {}

  @Get('bookmarks')
  @ZodSerializerDto(ViewBookmarkedJobResponseDto)
  viewBookmarkedJob(
    @UserActive('userId') userId: number,

    @Query(new ZodValidationPipe(ViewBookmarkedJobQueryDto))
    query: ViewBookmarkedJobFilterType,
  ) {
    return this.manageJobService.viewBookmarkedJob(userId, query);
  }
}
