import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
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

@Controller('expert/disputes')
export class DisputeExpertController {
  constructor(private readonly service: DisputeService) {}

  @Get()
  @ZodSerializerDto(DisputeListResponseDTO)
  list(
    @UserActive('userId') userId: number,
    @UserActive('roleName') role: string,
    @Query() query: GetDisputeListQueryDTO,
  ) {
    return this.service.adminListDisputes(role, query, userId);
  }

  @Get(':id')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  detail(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getDisputeDetail(userId, RoleName.EXPERT, id);
  }

  @Post(':id/decision')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  decide(
    @UserActive('userId') userId: number,
    @UserActive('roleName') role: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminDisputeDecisionBodyDTO,
  ) {
    return this.service.adminMakeDecision(userId, role, id, body);
  }

  @Post(':id/final-decision')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  finalize(
    @UserActive('userId') userId: number,
    @UserActive('roleName') role: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminDisputeFinalDecisionBodyDTO,
  ) {
    return this.service.adminFinalDecision(userId, role, id, body);
  }
}
