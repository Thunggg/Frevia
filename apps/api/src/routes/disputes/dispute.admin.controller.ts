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
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  AdminDisputeDecisionBodyDTO,
  AdminDisputeFinalDecisionBodyDTO,
  DisputeDetailResponseDTO,
  DisputeListResponseDTO,
  GetDisputeListQueryDTO,
} from './dispute.dto';
import { DisputeService } from './dispute.service';
import type {
  AdminDisputeDecisionBodyType,
  AdminDisputeFinalDecisionBodyType,
  GetDisputeListQueryType,
} from '@shared/types';

@Controller('admin/disputes')
export class DisputeAdminController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @ZodSerializerDto(DisputeListResponseDTO)
  listDisputes(
    @UserActive('roleName') roleName: string,
    @Query() query: GetDisputeListQueryDTO,
  ) {
    return this.disputeService.adminListDisputes(
      roleName,
      query as GetDisputeListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  getDisputeDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.getDisputeDetail(userId, roleName, disputeId);
  }

  @Post(':id/decision')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  adminMakeDecision(
    @UserActive('userId') adminId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: AdminDisputeDecisionBodyDTO,
  ) {
    return this.disputeService.adminMakeDecision(
      adminId,
      roleName,
      disputeId,
      body as AdminDisputeDecisionBodyType,
    );
  }

  @Post(':id/final-decision')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  adminFinalDecision(
    @UserActive('userId') adminId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: AdminDisputeFinalDecisionBodyDTO,
  ) {
    return this.disputeService.adminFinalDecision(
      adminId,
      roleName,
      disputeId,
      body as AdminDisputeFinalDecisionBodyType,
    );
  }
}
