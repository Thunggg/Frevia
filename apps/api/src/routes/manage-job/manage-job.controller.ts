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
  ViewJobDetailResponseDto,
} from './manage-job.dto';
import { ManageJobService } from './manage-job.service';
import { UserActive } from '../../shared/decorators/user-active.decorators';

@Controller('manage-jobs')
export class ManageJobController {
  constructor(private readonly manageJobService: ManageJobService) {}

  @Get('skills')
  searchSkills(
    @UserActive('roleName') roleName: string,
    @Query('search') search?: string,
  ) {
    return this.manageJobService.searchSkills(roleName, search);
  }

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

  @Post('jobs/:slug/bookmark')
  bookmarkJob(
    @UserActive('userId')
    userId: number,
    @UserActive('roleName') roleName: string,

    @Param('slug') slug: string,
  ) {
    return this.manageJobService.bookmarkJob(userId, roleName, slug);
  }

  @Get('jobs/:slug/bookmark')
  getBookmarkStatus(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('slug') slug: string,
  ) {
    return this.manageJobService.getBookmarkStatus(userId, roleName, slug);
  }

  @Delete('bookmarks/:slug')
  removeBookmark(
    @UserActive('userId')
    userId: number,

    @Param('slug') slug: string,
  ) {
    return this.manageJobService.removeBookmark(userId, slug);
  }

  @Get(':id')
  @ZodSerializerDto(ViewJobDetailResponseDto)
  viewClientJobDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.manageJobService.viewClientJobDetail(userId, roleName, id);
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
