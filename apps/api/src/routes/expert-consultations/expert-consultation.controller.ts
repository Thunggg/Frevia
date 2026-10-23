import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type {
  CompleteExpertConsultationType,
  CreateExpertConsultationType,
  ExpertConsultationListQueryType,
  RejectExpertConsultationType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CompleteExpertConsultationDto,
  CreateExpertConsultationDto,
  ExpertConsultationDto,
  ExpertConsultationListDto,
  ExpertConsultationListQueryDto,
  RejectExpertConsultationDto,
} from './expert-consultation.dto';
import { ExpertConsultationService } from './expert-consultation.service';

@Controller('expert-consultations')
export class ExpertConsultationController {
  constructor(private readonly service: ExpertConsultationService) {}

  @Post()
  @ZodSerializerDto(ExpertConsultationDto)
  create(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Body() body: CreateExpertConsultationDto,
  ) {
    return this.service.create(
      userId,
      roleName,
      body as CreateExpertConsultationType,
    );
  }

  @Get('mine')
  @ZodSerializerDto(ExpertConsultationListDto)
  listMine(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: ExpertConsultationListQueryDto,
  ) {
    return this.service.listMine(
      userId,
      roleName,
      query as ExpertConsultationListQueryType,
    );
  }

  @Get('assigned')
  @ZodSerializerDto(ExpertConsultationListDto)
  listAssigned(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: ExpertConsultationListQueryDto,
  ) {
    return this.service.listAssigned(
      userId,
      roleName,
      query as ExpertConsultationListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(ExpertConsultationDto)
  detail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.detail(userId, roleName, id);
  }

  @Patch(':id/accept')
  @ZodSerializerDto(ExpertConsultationDto)
  accept(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.accept(userId, roleName, id);
  }

  @Patch(':id/reject')
  @ZodSerializerDto(ExpertConsultationDto)
  reject(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RejectExpertConsultationDto,
  ) {
    return this.service.reject(
      userId,
      roleName,
      id,
      body as RejectExpertConsultationType,
    );
  }

  @Patch(':id/start')
  @ZodSerializerDto(ExpertConsultationDto)
  start(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.start(userId, roleName, id);
  }

  @Patch(':id/complete')
  @ZodSerializerDto(ExpertConsultationDto)
  complete(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CompleteExpertConsultationDto,
  ) {
    return this.service.complete(
      userId,
      roleName,
      id,
      body as CompleteExpertConsultationType,
    );
  }

  @Patch(':id/cancel')
  @ZodSerializerDto(ExpertConsultationDto)
  cancel(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.cancel(userId, roleName, id);
  }
}
