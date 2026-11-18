import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import {
  ExpertDisputeDecisionBodyDTO,
  ExpertDisputeDetailResponseDTO,
  ExpertDisputeFinalDecisionBodyDTO,
  ExpertDisputeListResponseDTO,
  GetExpertDisputeListQueryDTO,
} from './disputes-expert.dto';
import { DisputesExpertService } from './disputes-expert.service';
import type {
  AdminDisputeDecisionBodyType,
  AdminDisputeFinalDecisionBodyType,
  GetDisputeListQueryType,
} from '@shared/types';

@Controller('expert/disputes')
export class DisputesExpertController {
  constructor(private readonly expertDisputeService: DisputesExpertService) { }

  @Get()
  @ZodSerializerDto(ExpertDisputeListResponseDTO)
  listDisputes(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: GetExpertDisputeListQueryDTO,
  ) {
    return this.expertDisputeService.listDisputes(
      userId,
      roleName,
      query as GetDisputeListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(ExpertDisputeDetailResponseDTO)
  getDisputeDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.expertDisputeService.getDisputeDetail(
      userId,
      roleName,
      disputeId,
    );
  }

  @Post(':id/decision')
  @ZodSerializerDto(ExpertDisputeDetailResponseDTO)
  makeDecision(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: ExpertDisputeDecisionBodyDTO,
  ) {
    return this.expertDisputeService.makeDecision(
      userId,
      roleName,
      disputeId,
      body as AdminDisputeDecisionBodyType,
    );
  }

  @Post(':id/final-decision')
  @ZodSerializerDto(ExpertDisputeDetailResponseDTO)
  makeFinalDecision(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: ExpertDisputeFinalDecisionBodyDTO,
  ) {
    return this.expertDisputeService.makeFinalDecision(
      userId,
      roleName,
      disputeId,
      body as AdminDisputeFinalDecisionBodyType,
    );
  }
}
