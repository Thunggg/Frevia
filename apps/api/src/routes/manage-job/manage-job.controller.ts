import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  CreateJobBodyDto,
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

    @Query() query: ViewBookmarkedJobQueryDto,
  ) {
    return this.manageJobService.viewBookmarkedJob(userId, roleName, query);
  }

  @Post('jobs/:jobId/bookmark')
  bookmarkJob(
    @UserActive('userId')
    userId: number,
    @UserActive('roleName') roleName: string,

    @Param('jobId', ParseIntPipe)
    jobId: number,
  ) {
    return this.manageJobService.bookmarkJob(userId, roleName, jobId);
  }

  @Delete('bookmarks/:jobId')
  removeBookmark(
    @UserActive('userId')
    userId: number,

    @Param('jobId', ParseIntPipe)
    jobId: number,
  ) {
    return this.manageJobService.removeBookmark(userId, jobId);
  }

  @Post()
  createJob(
    @UserActive('userId')
    userId: number,

    @Body() body: CreateJobBodyDto,
  ) {
    return this.manageJobService.createJob(userId, body);
  }
}
