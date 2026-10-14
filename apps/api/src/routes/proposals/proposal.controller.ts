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
import type {
  ClientJobProposalsResponseType,
  CreateProposalBodyType,
  SaveProposalDraftBodyType,
} from '@shared/types';
import type { MyProposalsQueryType } from '@shared/types';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateProposalBodyDto,
  ClientJobProposalsResponseDto,
  ClientProposalDetailDto,
  ProposalResponseDto,
  MyProposalsQueryDto,
  ProposalDetailResponseDto,
  SaveProposalDraftBodyDto,
} from './proposal.dto';
import { ProposalService } from './proposal.service';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Get('my')
  getMyProposals(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: MyProposalsQueryDto,
  ) {
    return this.proposalService.getMyProposals(
      userId,
      roleName,
      query as MyProposalsQueryType,
    );
  }

  @Get('jobs/:jobId/mine')
  getMyActiveProposalForJob(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.proposalService.getMyActiveProposalForJob(
      userId,
      roleName,
      jobId,
    );
  }

  @Get('jobs/:jobId/submitted')
  @ZodSerializerDto(ClientJobProposalsResponseDto)
  getSubmittedProposalsForClientJob(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('jobId', ParseIntPipe) jobId: number,
  ): Promise<ClientJobProposalsResponseType> {
    return this.proposalService.getSubmittedProposalsForClientJob(
      userId,
      roleName,
      jobId,
    );
  }

  @Get(':id')
  @ZodSerializerDto(ProposalDetailResponseDto)
  getProposalDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.getProposalDetail(userId, roleName, proposalId);
  }

  @Get(':id/client')
  @ZodSerializerDto(ClientProposalDetailDto)
  getProposalDetailForClient(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.getProposalDetailForClient(
      userId,
      roleName,
      proposalId,
    );
  }

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

  @Patch(':id/withdraw')
  @ZodSerializerDto(ProposalResponseDto)
  withdrawProposal(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.withdrawProposal(userId, roleName, proposalId);
  }

  @Patch(':id/reject')
  @ZodSerializerDto(ProposalResponseDto)
  rejectProposal(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.rejectProposal(userId, roleName, proposalId);
  }

  @Patch(':id/accept')
  @ZodSerializerDto(ProposalResponseDto)
  acceptProposal(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) proposalId: number,
  ) {
    return this.proposalService.acceptProposal(userId, roleName, proposalId);
  }
}
