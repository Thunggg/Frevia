import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { ClientJobProposalsQueryType } from '@shared/types';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  ClientJobProposalsPageDto,
  ClientJobProposalsQueryDto,
} from './proposal.dto';
import { ProposalService } from './proposal.service';

@Controller('jobs')
export class ClientJobProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Get(':jobId/proposals')
  @ZodSerializerDto(ClientJobProposalsPageDto)
  getSubmittedProposals(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Query() query: ClientJobProposalsQueryDto,
  ) {
    return this.proposalService.getSubmittedProposalsPageForClientJob(
      userId,
      roleName,
      jobId,
      query as ClientJobProposalsQueryType,
    );
  }
}
