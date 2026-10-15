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
import type {
  CreateJobAlertBodyType,
  GetJobAlertsQueryType,
  UpdateJobAlertBodyType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateJobAlertBodyDto,
  CreateJobAlertResponseDto,
  GetJobAlertDetailResponseDto,
  GetJobAlertsQueryDto,
  GetJobAlertsResponseDto,
  UpdateJobAlertBodyDto,
  UpdateJobAlertResponseDto,
} from './job-alert.dto';
import { JobAlertService } from './job-alert.service';

@Controller('job-alerts')
export class JobAlertController {
  constructor(private readonly jobAlertService: JobAlertService) {}

  @Get()
  @ZodSerializerDto(GetJobAlertsResponseDto)
  getJobAlerts(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: GetJobAlertsQueryDto,
  ) {
    return this.jobAlertService.getJobAlerts(
      userId,
      roleName,
      query as GetJobAlertsQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(GetJobAlertDetailResponseDto)
  getJobAlertDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobAlertService.getJobAlertDetail(userId, roleName, id);
  }

  @Post()
  @ZodSerializerDto(CreateJobAlertResponseDto)
  createJobAlert(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Body() body: CreateJobAlertBodyDto,
  ) {
    return this.jobAlertService.createJobAlert(
      userId,
      roleName,
      body as CreateJobAlertBodyType,
    );
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateJobAlertResponseDto)
  updateJobAlert(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateJobAlertBodyDto,
  ) {
    return this.jobAlertService.updateJobAlert(
      userId,
      roleName,
      id,
      body as UpdateJobAlertBodyType,
    );
  }

  @Delete(':id')
  deleteJobAlert(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobAlertService.deleteJobAlert(userId, roleName, id);
  }
}
