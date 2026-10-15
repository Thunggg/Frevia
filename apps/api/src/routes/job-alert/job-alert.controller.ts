import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type {
  CreateJobAlertBodyType,
  GetJobAlertsQueryType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateJobAlertBodyDto,
  CreateJobAlertResponseDto,
  GetJobAlertDetailResponseDto,
  GetJobAlertsQueryDto,
  GetJobAlertsResponseDto,
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
}
