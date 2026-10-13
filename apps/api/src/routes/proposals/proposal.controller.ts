import { Body, Controller, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { CreateProposalBodyType, SaveProposalDraftBodyType } from '@shared/types';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateProposalBodyDto,
  ProposalResponseDto,
  SaveProposalDraftBodyDto,
} from './proposal.dto';
import { ProposalService } from './proposal.service';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post('jobs/:jobId')
  @ZodSerializerDto(ProposalResponseDto)
  createProposal(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() body: CreateProposalBodyDto,
  ) {
    return this.proposalService.createProposal(
      userId,
      roleName,
      jobId,
      body as CreateProposalBodyType,
    );
  }

  @Post('jobs/:jobId/drafts')
  @ZodSerializerDto(ProposalResponseDto)
  saveDraft(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() body: SaveProposalDraftBodyDto,
  ) {
    return this.proposalService.saveDraft(
      userId,
      roleName,
      jobId,
      body as SaveProposalDraftBodyType,
    );
  }

  @Patch(':id/draft')
  @ZodSerializerDto(ProposalResponseDto)
  updateDraft(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
    @Body() body: SaveProposalDraftBodyDto,
  ) {
    return this.proposalService.updateDraft(
      userId,
      roleName,
      proposalId,
      body as SaveProposalDraftBodyType,
    );
  }

  @Patch(':id/submit')
  @ZodSerializerDto(ProposalResponseDto)
  submitDraft(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.submitDraft(userId, roleName, proposalId);
  }
}
