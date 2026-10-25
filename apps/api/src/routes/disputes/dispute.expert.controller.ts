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
  AdminDisputeFinalDecisionBodyDTO,
  ClaimDisputeResponseDTO,
  DisputeDetailResponseDTO,
  DisputeListResponseDTO,
  GetDisputeListQueryDTO,
} from './dispute.dto';
import { DisputeService } from './dispute.service';
import type {
  AdminDisputeFinalDecisionBodyType,
  GetDisputeListQueryType,
} from '@shared/types';

@Controller('expert/disputes')
export class DisputeExpertController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @ZodSerializerDto(DisputeListResponseDTO)
  listDisputes(
    @UserActive('userId') expertUserId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: GetDisputeListQueryDTO,
  ) {
    return this.disputeService.expertListDisputes(
      expertUserId,
      roleName,
      query as GetDisputeListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  getDisputeDetail(
    @UserActive('userId') expertUserId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.getDisputeDetail(
      expertUserId,
      roleName,
      disputeId,
    );
  }

  @Post(':id/claim')
  @ZodSerializerDto(ClaimDisputeResponseDTO)
  claimDispute(
    @UserActive('userId') expertUserId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.expertClaimDispute(
      expertUserId,
      roleName,
      disputeId,
    );
  }

  @Post(':id/final-decision')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  expertFinalDecision(
    @UserActive('userId') expertUserId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: AdminDisputeFinalDecisionBodyDTO,
  ) {
    return this.disputeService.expertFinalDecision(
      expertUserId,
      roleName,
      disputeId,
      body as AdminDisputeFinalDecisionBodyType,
    );
  }
}
