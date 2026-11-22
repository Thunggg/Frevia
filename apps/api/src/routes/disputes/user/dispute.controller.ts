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
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import {
  CreateDisputeBodyDTO,
  DisputeDetailResponseDTO,
  DisputeListResponseDTO,
  GetDisputeListQueryDTO,
  RespondDisputeBodyDTO,
} from './dispute.dto';
import { DisputeService } from './dispute.service';
import type {
  CreateDisputeBodyType,
  GetDisputeListQueryType,
  RespondDisputeBodyType,
} from '@shared/types';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @ZodSerializerDto(DisputeListResponseDTO)
  listMyDisputes(
    @UserActive('userId') userId: number,
    @Query() query: GetDisputeListQueryDTO,
  ) {
    return this.disputeService.listMyDisputes(
      userId,
      query as GetDisputeListQueryType,
    );
  }

  @Post()
  @ZodSerializerDto(DisputeDetailResponseDTO)
  createDispute(
    @UserActive('userId') userId: number,
    @Body() body: CreateDisputeBodyDTO,
  ) {
    return this.disputeService.createDispute(
      userId,
      body as CreateDisputeBodyType,
    );
  }

  @Patch(':id/respond')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  respondToDispute(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: RespondDisputeBodyDTO,
  ) {
    return this.disputeService.respondToDispute(
      userId,
      disputeId,
      body as RespondDisputeBodyType,
    );
  }

  @Patch(':id/withdraw')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  withdrawDispute(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.withdrawDispute(userId, disputeId);
  }

  @Post(':id/escalate')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  escalateDispute(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.escalateDispute(userId, disputeId);
  }

  @Get('milestone/:milestoneId')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  getDisputeByMilestoneId(
    @UserActive('userId') userId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.disputeService.getDisputeByMilestoneId(userId, milestoneId);
  }

  @Get(':id')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  getDisputeDetail(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.getDisputeDetail(userId, disputeId);
  }
}
