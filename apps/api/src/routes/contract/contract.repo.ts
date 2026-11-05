import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  MilestoneStatus,
  NotificationType,
  Prisma,
  ProposalStatus,
} from '@prisma/client';
import {
  CreateContractBodyType,
  GetContractListQueryType,
  UpdateContractBodyType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { createContractSlug } from './contract.slug';
import { HiringType, JobStatus } from '@prisma/client';

export async function activateContractLifecycle(
  tx: Prisma.TransactionClient,
  contractId: number,
) {
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      jobId: true,
      proposalId: true,
      status: true,
    },
  });

  if (!contract) return null;

  const activatedContract = await tx.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.ACTIVE,
    },
  });

  const job = await tx.job.findUnique({
    where: { id: contract.jobId },
    select: {
      id: true,
      hiringType: true,
      positionsFilled: true,
      positionsRequired: true,
    },
  });

  if (job) {
    const now = new Date();
    if (job.hiringType === HiringType.SINGLE) {
      await tx.proposal.updateMany({
        where: {
          jobId: job.id,
          id: { not: contract.proposalId },
          deletedAt: null,
          status: {
            in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
          },
        },
        data: {
          status: ProposalStatus.REJECTED,
          rejectedAt: now,
          expiresAt: null,
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: JobStatus.IN_PROGRESS },
      });
    } else if (job.hiringType === HiringType.MULTIPLE) {
      if (job.positionsFilled >= job.positionsRequired) {
        await tx.proposal.updateMany({
          where: {
            jobId: job.id,
            id: { not: contract.proposalId },
            deletedAt: null,
            status: {
              in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
            },
          },
          data: {
            status: ProposalStatus.EXPIRED,
            expiresAt: null,
          },
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.IN_PROGRESS },
        });
      }
    }
  }

  return activatedContract;
}

const contractDetailSelect = {
  id: true,
  slug: true,
  jobId: true,
  proposalId: true,
  clientId: true,
  freelancerId: true,
  terms: true,
  totalAmount: true,
  status: true,
  platformFee: true,
  platformFeeStatus: true,
  platformFeePaidAt: true,
  clientFeeStatus: true,
  clientFeePaidAt: true,
  freelancerFeeStatus: true,
  freelancerFeePaidAt: true,
  signedByClient: true,
  signedByFreelancer: true,
  createdAt: true,
  signedAt: true,
  completedAt: true,
  expiresAt: true,
  deletedAt: true,
  client: {
    select: {
      id: true,
      email: true,
      profile: {
        select: { displayName: true, avatarUrl: true },
      },
    },
  },
  freelancer: {
    select: {
      id: true,
      email: true,
      profile: {
        select: { displayName: true, avatarUrl: true },
      },
    },
  },
  job: {
    select: { id: true, title: true, slug: true },
  },
} satisfies Prisma.ContractSelect;

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProposalWithJob(proposalId: number) {
    return this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        status: true,
        freelancerId: true,
        job: {
          select: {
            id: true,
            clientId: true,
            title: true,
            hiringType: true,
            positionsFilled: true,
            positionsRequired: true,
          },
        },
      },
    });
  }

  async findContractByProposalId(proposalId: number) {
    return this.prisma.contract.findUnique({
      where: { proposalId },
      select: { id: true },
    });
  }

  async findContractById(contractId: number) {
    return this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        slug: true,
        jobId: true,
        clientId: true,
        freelancerId: true,
        status: true,
        totalAmount: true,
        platformFee: true,
        platformFeeStatus: true,
        clientFeeStatus: true,
        freelancerFeeStatus: true,
        signedByClient: true,
        signedByFreelancer: true,
      },
    });
  }

  async findContractBySlug(slug: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { slug, deletedAt: null },
      select: contractDetailSelect,
    });

    if (!contract) return null;

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async createContract(
    data: CreateContractBodyType,
    clientId: number,
    freelancerId: number,
    jobId: number,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true },
    });
    const slug = createContractSlug(job?.title);
    const platformFee = Math.round(Number(data.totalAmount) * 0.01 * 100) / 100;
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo hợp đồng
      const contract = await tx.contract.create({
        data: {
          slug,
          jobId,
          proposalId: data.proposalId,
          clientId,
          freelancerId,
          totalAmount: data.totalAmount,
          platformFee,
          terms: data.terms ?? null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          status: ContractStatus.PENDING_SIGN,
        },
      });

      // 2. Tạo milestones
      const milestonesData =
        data.milestones && data.milestones.length > 0
          ? data.milestones.map((m) => ({
              contractId: contract.id,
              title: m.title,
              description: m.description ?? null,
              amount: m.amount,
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: MilestoneStatus.PENDING,
            }))
          : [
              {
                contractId: contract.id,
                title: `${job?.title ?? 'Contract'} - Milestone 1`,
                description: 'Initial milestone for contract',
                amount: data.totalAmount,
                dueDate: data.expiresAt ? new Date(data.expiresAt) : null,
                status: MilestoneStatus.PENDING,
              },
            ];

      await tx.milestone.createMany({
        data: milestonesData,
      });

      // 3. Chuyển trạng thái proposal được chọn sang HIRED
      await tx.proposal.update({
        where: { id: data.proposalId },
        data: {
          status: ProposalStatus.HIRED,
          acceptedAt: now,
          expiresAt: null,
        },
      });

      // 4. Tăng positionsFilled cho Job
      await tx.job.update({
        where: { id: jobId },
        data: {
          positionsFilled: { increment: 1 },
        },
      });

      // 5. Gửi thông báo cho freelancer
      await tx.notification.create({
        data: {
          userId: freelancerId,
          type: NotificationType.PROPOSAL_ACCEPTED,
          title: 'Your proposal was accepted',
          message: `You have been hired for ${job?.title ?? 'a job'}. Review and sign the contract to begin work.`,
          data: {
            href: `/freelancer/contracts/${contract.slug}`,
            contractId: contract.id,
            contractSlug: contract.slug,
            proposalId: data.proposalId,
            jobId,
            jobTitle: job?.title ?? '',
          },
        },
      });

      return {
        ...contract,
        totalAmount: Number(contract.totalAmount),
        platformFee:
          contract.platformFee != null ? Number(contract.platformFee) : 0,
      };
    });
  }

  async updateContract(contractId: number, data: UpdateContractBodyType) {
    const contract = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        ...(data.totalAmount !== undefined && {
          totalAmount: data.totalAmount,
          platformFee: Math.round(Number(data.totalAmount) * 0.01 * 100) / 100,
        }),
        ...(data.terms !== undefined && { terms: data.terms }),
        ...(data.expiresAt !== undefined && {
          expiresAt: new Date(data.expiresAt),
        }),
        signedByClient: false,
        signedByFreelancer: false,
      },
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async signContract(contractId: number, role: 'client' | 'freelancer') {
    const isClientSigning = role === 'client';

    const contract = await this.prisma.$transaction(async (tx) => {
      const signedContract = await tx.contract.update({
        where: { id: contractId },
        data: isClientSigning
          ? { signedByClient: true }
          : { signedByFreelancer: true },
      });

      if (signedContract.signedByClient && signedContract.signedByFreelancer) {
        const bothFeesPaid =
          signedContract.clientFeeStatus === 'PAID' &&
          signedContract.freelancerFeeStatus === 'PAID';

        const updated = await tx.contract.update({
          where: { id: contractId },
          data: {
            signedAt: new Date(),
          },
        });

        if (bothFeesPaid) {
          const activated = await activateContractLifecycle(tx, contractId);
          return activated ?? updated;
        }

        return updated;
      }

      return signedContract;
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async completeContract(contractId: number, jobId: number) {
    const contract = await this.prisma.$transaction(async (tx) => {
      const completedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      await tx.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });
      return completedContract;
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async cancelContract(contractId: number) {
    const contract = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.CANCELLED,
        deletedAt: new Date(),
      },
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async getContractList(
    query: GetContractListQueryType,
    filter: { userId?: number; role?: 'client' | 'freelancer' },
  ) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const { status, proposalId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {
      deletedAt: null,
      ...(status && { status: status as ContractStatus }),
      ...(proposalId && { proposalId }),
      ...(filter.userId &&
        filter.role === 'client' && { clientId: filter.userId }),
      ...(filter.userId &&
        filter.role === 'freelancer' && { freelancerId: filter.userId }),
    };

    const [contracts, totalItems] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        where,
        select: contractDetailSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts.map((c) => ({
        ...c,
        totalAmount: Number(c.totalAmount),
        platformFee: c.platformFee != null ? Number(c.platformFee) : 0,
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }

  async getContractDetail(contractId: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      select: contractDetailSelect,
    });

    if (!contract) return null;

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }
}
