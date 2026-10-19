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
  CreateDisputeBodyDTO,
  DisputeDetailResponseDTO,
  DisputeListResponseDTO,
  GetDisputeListQueryDTO,
  PayDisputeFeeBodyDTO,
  ReviewDisputeDecisionBodyDTO,
  SubmitDisputeResponseBodyDTO,
} from './dispute.dto';
import { DisputeService } from './dispute.service';
import type {
  CreateDisputeBodyType,
  GetDisputeListQueryType,
  PayDisputeFeeBodyType,
  ReviewDisputeDecisionBodyType,
  SubmitDisputeResponseBodyType,
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

  @Post(':id/fee')
  payFee(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: PayDisputeFeeBodyDTO,
  ) {
    return this.disputeService.payFee(
      userId,
      disputeId,
      body as PayDisputeFeeBodyType,
    );
  }

  @Post(':id/response')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  submitResponse(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: SubmitDisputeResponseBodyDTO,
  ) {
    return this.disputeService.submitResponse(
      userId,
      disputeId,
      body as SubmitDisputeResponseBodyType,
    );
  }

  @Get('milestone/:milestoneId')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  getDisputeByMilestoneId(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.disputeService.getDisputeByMilestoneId(
      userId,
      roleName,
      milestoneId,
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

  @Post(':id/review')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  submitDecisionReview(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: ReviewDisputeDecisionBodyDTO,
  ) {
    return this.disputeService.submitDecisionReview(
      userId,
      disputeId,
      body as ReviewDisputeDecisionBodyType,
    );
  }
}
