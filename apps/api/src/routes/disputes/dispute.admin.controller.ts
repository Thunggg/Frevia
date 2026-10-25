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
  AssignExpertBodyDTO,
  DisputeDetailResponseDTO,
  DisputeListResponseDTO,
  GetDisputeListQueryDTO,
  MatchingExpertsResponseDTO,
} from './dispute.dto';
import { DisputeService } from './dispute.service';
import type {
  AssignExpertBodyType,
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

  /**
   * Lấy danh sách các Expert phù hợp với Category / Skills của Job trong vụ kiện.
   */
  @Get(':id/matching-experts')
  @ZodSerializerDto(MatchingExpertsResponseDTO)
  getMatchingExperts(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
  ) {
    return this.disputeService.adminGetMatchingExperts(roleName, disputeId);
  }

  /**
   * Admin phân công Expert vào xử lý vụ tranh chấp (khi 2 bên đã nộp đủ phí).
   */
  @Post(':id/assign-expert')
  @ZodSerializerDto(DisputeDetailResponseDTO)
  assignExpert(
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() body: AssignExpertBodyDTO,
  ) {
    return this.disputeService.adminAssignExpert(
      roleName,
      disputeId,
      (body as AssignExpertBodyType).expertId,
    );
  }

  /**
   * Admin không tự ra phán quyết - Phán quyết thuộc về Expert được cử.
   */
  @Post(':id/decision')
  adminMakeDecision() {
    return this.disputeService.adminMakeDecision();
  }

  @Post(':id/final-decision')
  adminFinalDecision() {
    return this.disputeService.adminFinalDecision();
  }
}
