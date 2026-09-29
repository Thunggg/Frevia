import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';

import type {
  BookmarkJobBodyType,
  ViewBookmarkedJobFilterType,
} from '@shared/types';

import {
  BookmarkJobBodyDto,
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
    @UserActive('roleName') roleName: string,

    @Query(new ZodValidationPipe(ViewBookmarkedJobQueryDto))
    query: ViewBookmarkedJobFilterType,
  ) {
    return this.manageJobService.viewBookmarkedJob(userId, roleName, query);
  }

  @Post('bookmarks')
  bookmarkJob(
    @UserActive('userId')
    userId: number,
    @UserActive('roleName') roleName: string,

    @Body(new ZodValidationPipe(BookmarkJobBodyDto))
    body: BookmarkJobBodyType,
  ) {
    return this.manageJobService.bookmarkJob(userId, roleName, body);
  }
}
