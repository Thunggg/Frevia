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
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateMilestoneBodyDTO,
  CreateMilestoneResponseDTO,
  DeleteMilestoneResponseDTO,
  GetMilestoneDetailResponseDTO,
  GetMilestoneListQueryDTO,
  GetMilestoneListResponseDTO,
  ProgressMilestoneResponseDTO,
  UpdateMilestoneBodyDTO,
  UpdateMilestoneResponseDTO,
} from './milestone.dto';
import { MilestoneService } from './milestone.service';
import type {
  CreateMilestoneBodyType,
  GetMilestoneListQueryType,
  UpdateMilestoneBodyType,
} from '@shared/types';

@Controller('contracts/:contractId/milestones')
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}
  @Get()
  @ZodSerializerDto(GetMilestoneListResponseDTO)
  getMilestoneList(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Query() query: GetMilestoneListQueryDTO,
  ) {
    return this.milestoneService.getMilestoneList(
      userId,
      roleName,
      contractId,
      query as GetMilestoneListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(GetMilestoneDetailResponseDTO)
  getMilestoneDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('id', ParseIntPipe) milestoneId: number,
  ) {
    return this.milestoneService.getMilestoneDetail(
      userId,
      roleName,
      contractId,
      milestoneId,
    );
  }

  @Post()
  @ZodSerializerDto(CreateMilestoneResponseDTO)
  createMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() body: CreateMilestoneBodyDTO,
  ) {
    return this.milestoneService.createMilestone(
      userId,
      contractId,
      body as CreateMilestoneBodyType,
    );
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateMilestoneResponseDTO)
  updateMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('id', ParseIntPipe) milestoneId: number,
    @Body() body: UpdateMilestoneBodyDTO,
  ) {
    return this.milestoneService.updateMilestone(
      userId,
      contractId,
      milestoneId,
      body as UpdateMilestoneBodyType,
    );
  }

  @Patch(':id/progress')
  @ZodSerializerDto(ProgressMilestoneResponseDTO)
  progressMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('id', ParseIntPipe) milestoneId: number,
  ) {
    return this.milestoneService.progressMilestone(
      userId,
      contractId,
      milestoneId,
    );
  }

  @Delete(':id')
  @ZodSerializerDto(DeleteMilestoneResponseDTO)
  deleteMilestone(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('id', ParseIntPipe) milestoneId: number,
  ) {
    return this.milestoneService.deleteMilestone(
      userId,
      contractId,
      milestoneId,
    );
  }
}
