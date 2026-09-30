import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  ChangeJobStatusBodyDto,
  ChangeJobStatusResponseDto,
  CreateJobBodyDto,
  UpdateJobBodyDto,
  UpdateJobResponseDto,
  ViewBookmarkedJobQueryDto,
  ViewBookmarkedJobResponseDto,
  ViewClientJobQueryDto,
  ViewClientJobResponseDto,
} from './manage-job.dto';
import { ManageJobService } from './manage-job.service';
import { UserActive } from '../../shared/decorators/user-active.decorators';

@Controller('manage-jobs')
export class ManageJobController {
  constructor(private readonly manageJobService: ManageJobService) {}

  @Get()
  @ZodSerializerDto(ViewClientJobResponseDto)
  viewClientJobs(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: ViewClientJobQueryDto,
  ) {
    return this.manageJobService.viewClientJobs(userId, roleName, query);
  }

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

  @Get('jobs/:jobId/bookmark')
  getBookmarkStatus(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.manageJobService.getBookmarkStatus(userId, roleName, jobId);
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

  @Patch(':id')
  @ZodSerializerDto(UpdateJobResponseDto)
  updateJob(
    @Param('id', ParseIntPipe)
    id: number,

    @UserActive('userId')
    userId: number,

    @Body()
    body: UpdateJobBodyDto,
  ) {
    return this.manageJobService.updateJob(userId, id, body);
  }

  @Delete(':id')
  deleteJob(
    @Param('id', ParseIntPipe)
    id: number,

    @UserActive('userId')
    userId: number,
  ) {
    return this.manageJobService.deleteJob(userId, id);
  }

  @Patch(':id/status')
  @ZodSerializerDto(ChangeJobStatusResponseDto)
  changeJobStatus(
    @Param('id', ParseIntPipe)
    id: number,

    @UserActive('userId')
    userId: number,

    @Body()
    body: ChangeJobStatusBodyDto,
  ) {
    return this.manageJobService.changeJobStatus(userId, id, body);
  }
}
