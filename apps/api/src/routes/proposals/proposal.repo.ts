import { Injectable } from '@nestjs/common';
import { Prisma, ProposalStatus } from '@prisma/client';
import {
  CreateProposalBodyType,
  ProposalType,
  SaveProposalDraftBodyType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';

const proposalSelect = {
  id: true,
  jobId: true,
  freelancerId: true,
  coverLetter: true,
  bidAmount: true,
  deliveryDays: true,
  status: true,
  createdAt: true,
  submittedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  withdrawnAt: true,
  updatedAt: true,
} satisfies Prisma.ProposalSelect;

@Injectable()
export class ProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findJobForProposal(jobId: number) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        clientId: true,
        status: true,
        expiryDate: true,
        deletedAt: true,
        client: { select: { isBanned: true, deletedAt: true } },
      },
    });
  }

  async findActiveProposal(
    jobId: number,
    freelancerId: number,
    ignoredProposalId?: number,
  ) {
    return this.prisma.proposal.findFirst({
      where: {
        jobId,
        freelancerId,
        deletedAt: null,
        status: { in: [ProposalStatus.DRAFT, ProposalStatus.PENDING, ProposalStatus.ACCEPTED] },
        ...(ignoredProposalId && { id: { not: ignoredProposalId } }),
      },
      select: { id: true },
    });
  }

  async findProposal(proposalId: number) {
    return this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { ...proposalSelect, deletedAt: true },
    });
  }

  async createDraft(
    jobId: number,
    freelancerId: number,
    data: SaveProposalDraftBodyType,
  ): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.create({
      data: { jobId, freelancerId, ...data, status: ProposalStatus.DRAFT },
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  async createPending(
    jobId: number,
    freelancerId: number,
    data: CreateProposalBodyType,
  ): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.create({
      data: {
        jobId,
        freelancerId,
        ...data,
        status: ProposalStatus.PENDING,
        submittedAt: new Date(),
      },
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  async updateDraft(
    proposalId: number,
    data: SaveProposalDraftBodyType,
  ): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.update({
      where: { id: proposalId },
      data,
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  async submitDraft(proposalId: number): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.PENDING, submittedAt: new Date() },
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  private normalize(proposal: Prisma.ProposalGetPayload<{ select: typeof proposalSelect }>): ProposalType {
    return { ...proposal, bidAmount: proposal.bidAmount === null ? null : Number(proposal.bidAmount) };
  }
}
