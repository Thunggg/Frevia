import { Injectable } from '@nestjs/common';
import { Prisma, ProposalStatus } from '@prisma/client';
import {
  CreateProposalBodyType,
  ClientJobProposalsResponseType,
  ClientJobProposalsPageType,
  ClientJobProposalsQueryType,
  MyProposalsQueryType,
  MyProposalsResponseType,
  ProposalDetailType,
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

const proposalDetailSelect = {
  ...proposalSelect,
  job: {
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      budgetMin: true,
      budgetMax: true,
      budgetType: true,
      deadline: true,
      expiryDate: true,
      status: true,
      client: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  },
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
        deadline: true,
        expiryDate: true,
        deletedAt: true,
        client: { select: { isBanned: true, deletedAt: true } },
      },
    });
  }

  async findJobForClientProposals(jobId: number) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, clientId: true, deletedAt: true },
    });
  }

  async findSubmittedProposalsForClientJob(
    jobId: number,
  ): Promise<ClientJobProposalsResponseType> {
    const proposals = await this.prisma.proposal.findMany({
      where: {
        jobId,
        deletedAt: null,
        submittedAt: { not: null },
        status: { not: ProposalStatus.DRAFT },
      },
      select: {
        ...proposalSelect,
        freelancer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                freelancerProfile: {
                  select: { title: true, idVerified: true },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return proposals.map((proposal) => ({
      ...this.normalize(proposal),
      freelancer: proposal.freelancer,
    }));
  }

  async findSubmittedProposalsPageForClientJob(
    jobId: number,
    query: ClientJobProposalsQueryType,
  ): Promise<ClientJobProposalsPageType> {
    const { page, limit, status } = query;
    const where: Prisma.ProposalWhereInput = {
      jobId,
      deletedAt: null,
      submittedAt: { not: null },
      status: status ?? { not: ProposalStatus.DRAFT },
    };
    const [proposals, totalItems] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        select: {
          ...proposalSelect,
          freelancer: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  freelancerProfile: {
                    select: { title: true, idVerified: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      data: proposals.map((proposal) => ({
        ...this.normalize(proposal),
        freelancer: proposal.freelancer,
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
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
        status: {
          in: [
            ProposalStatus.DRAFT,
            ProposalStatus.PENDING,
            ProposalStatus.ACCEPTED,
          ],
        },
        ...(ignoredProposalId && { id: { not: ignoredProposalId } }),
      },
      select: { id: true },
    });
  }

  async findMyActiveProposal(jobId: number, freelancerId: number) {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        jobId,
        freelancerId,
        deletedAt: null,
        status: {
          in: [
            ProposalStatus.DRAFT,
            ProposalStatus.PENDING,
            ProposalStatus.ACCEPTED,
            ProposalStatus.REJECTED,
          ],
        },
      },
      select: proposalSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return proposal ? this.normalize(proposal) : null;
  }

  async findProposal(proposalId: number) {
    return this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { ...proposalSelect, deletedAt: true },
    });
  }

  async findProposalForClientDecision(proposalId: number) {
    return this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        job: { select: { id: true, clientId: true, deletedAt: true } },
      },
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

  async withdrawProposal(proposalId: number): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  async rejectProposal(proposalId: number): Promise<ProposalType> {
    const proposal = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.REJECTED, rejectedAt: new Date() },
      select: proposalSelect,
    });
    return this.normalize(proposal);
  }

  async getMyProposals(
    freelancerId: number,
    query: MyProposalsQueryType,
  ): Promise<MyProposalsResponseType> {
    const { page, limit, jobId, status } = query;
    const where: Prisma.ProposalWhereInput = {
      freelancerId,
      deletedAt: null,
      ...(jobId && { jobId }),
      ...(status && { status }),
    };
    // Keep these reads separate instead of relying on Prisma's nested relation
    // query strategy. The PostgreSQL adapter can fail on the deep
    // Proposal -> Job -> Client -> Profile selection used by this list.
    const [proposals, totalItems] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        select: proposalSelect,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.proposal.count({ where }),
    ]);

    if (proposals.length === 0) {
      return {
        data: [],
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        page,
        limit,
      };
    }

    const jobs = await this.prisma.job.findMany({
      where: { id: { in: proposals.map((proposal) => proposal.jobId) } },
      select: {
        id: true,
        clientId: true,
        slug: true,
        title: true,
        description: true,
        budgetMin: true,
        budgetMax: true,
        budgetType: true,
        deadline: true,
        expiryDate: true,
        status: true,
      },
    });
    const clients = await this.prisma.user.findMany({
      where: { id: { in: jobs.map((job) => job.clientId) } },
      select: {
        id: true,
        email: true,
        profile: { select: { displayName: true, avatarUrl: true } },
      },
    });
    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const clientsById = new Map(clients.map((client) => [client.id, client]));

    return {
      data: proposals.flatMap((proposal) => {
        const job = jobsById.get(proposal.jobId);
        const client = job ? clientsById.get(job.clientId) : undefined;
        if (!job || !client) return [];

        return [
          {
            ...this.normalize(proposal),
            job: {
              ...job,
              budgetMin: job.budgetMin === null ? null : Number(job.budgetMin),
              budgetMax: job.budgetMax === null ? null : Number(job.budgetMax),
            },
            client,
          },
        ];
      }),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }

  async getProposalDetail(
    proposalId: number,
  ): Promise<ProposalDetailType | null> {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, deletedAt: null },
      select: proposalDetailSelect,
    });
    return proposal ? this.normalizeDetail(proposal) : null;
  }

  private normalize(
    proposal: Prisma.ProposalGetPayload<{ select: typeof proposalSelect }>,
  ): ProposalType {
    return {
      ...proposal,
      bidAmount:
        proposal.bidAmount === null ? null : Number(proposal.bidAmount),
    };
  }

  private normalizeDetail(
    proposal: Prisma.ProposalGetPayload<{
      select: typeof proposalDetailSelect;
    }>,
  ): ProposalDetailType {
    return {
      ...this.normalize(proposal),
      job: {
        ...proposal.job,
        budgetMin:
          proposal.job.budgetMin === null
            ? null
            : Number(proposal.job.budgetMin),
        budgetMax:
          proposal.job.budgetMax === null
            ? null
            : Number(proposal.job.budgetMax),
      },
      client: proposal.job.client,
    };
  }
}
