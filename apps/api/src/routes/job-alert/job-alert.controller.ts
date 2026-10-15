import { Body, Controller, Post } from '@nestjs/common';
import type { CreateJobAlertBodyType } from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateJobAlertBodyDto,
  CreateJobAlertResponseDto,
} from './job-alert.dto';
import { JobAlertService } from './job-alert.service';

@Controller('job-alerts')
export class JobAlertController {
  constructor(private readonly jobAlertService: JobAlertService) {}

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
