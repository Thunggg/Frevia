import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  JobStatus,
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
import { activateContractLifecycle } from '../../shared/helper/contract-activation.helper';
import { createContractSlug } from '../../shared/helper/contract.slug';

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
  clientPlatformFee: true,
  platformFee: true,
  platformFeeStatus: true,
  platformFeePaidAt: true,
  clientFeeStatus: true,
  clientFeePaidAt: true,
  freelancerFeeStatus: true,
  freelancerFeePaidAt: true,
  signedByClient: true,
  signedByFreelancer: true,
  clientSignedAt: true,
  freelancerSignedAt: true,
  rejectedAt: true,
  rejectReason: true,
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
  milestones: {
    select: {
      id: true,
      contractId: true,
      title: true,
      description: true,
      amount: true,
      status: true,
      paymentStatus: true,
      dueDate: true,
      completedAt: true,
    },
    orderBy: { id: 'asc' },
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
        proposalId: true,
        clientId: true,
        freelancerId: true,
        status: true,
        totalAmount: true,
        platformFee: true,
        clientPlatformFee: true,
        platformFeeStatus: true,
        platformFeePaidAt: true,
        clientFeeStatus: true,
        clientFeePaidAt: true,
        freelancerFeeStatus: true,
        freelancerFeePaidAt: true,
        signedByClient: true,
        signedByFreelancer: true,
        clientSignedAt: true,
        freelancerSignedAt: true,
        expiresAt: true,
        rejectedAt: true,
        rejectReason: true,
      },
    });
  }

  async findContractMilestoneDueDates(contractId: number) {
    return this.prisma.milestone.findMany({
      where: { contractId, deletedAt: null },
      select: { id: true, title: true, dueDate: true },
    });
  }

  async findContractBySlug(slug: string) {
    const cleanSlug = slug.replace(/^#/, '').trim();
    const strippedId = cleanSlug.replace(/^(CON|CTR|contract)-/i, '');
    const parsedId = Number(strippedId) || Number(cleanSlug);

    const contract = await this.prisma.contract.findFirst({
      where: {
        OR: [
          { slug },
          { slug: cleanSlug },
          ...(Number.isInteger(parsedId) && parsedId > 0
            ? [{ id: parsedId }]
            : []),
        ],
        deletedAt: null,
      },
      select: contractDetailSelect,
    });

    if (!contract) return null;

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      clientPlatformFee:
        contract.clientPlatformFee != null
          ? Number(contract.clientPlatformFee)
          : 0,
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
      milestones: contract.milestones?.map((m) => ({
        ...m,
        amount: Number(m.amount),
      })),
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
    const total = Number(data.totalAmount);
    const clientPlatformFee = Math.round(total * 0.03 * 100) / 100;
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
          clientPlatformFee,
          platformFee: clientPlatformFee,
          terms: data.terms ?? null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          status: ContractStatus.AWAITING_PAYMENT,
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
          message: `You have been offered a contract for ${job?.title ?? 'a job'}. Once the initial deposit is funded by the client, you will be invited to sign.`,
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
        clientPlatformFee: Number(contract.clientPlatformFee),
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
    const now = new Date();

    const contract = await this.prisma.$transaction(async (tx) => {
      const signedContract = await tx.contract.update({
        where: { id: contractId },
        data: isClientSigning
          ? { signedByClient: true, clientSignedAt: now }
          : { signedByFreelancer: true, freelancerSignedAt: now },
      });

      if (signedContract.signedByClient && signedContract.signedByFreelancer) {
        const updated = await tx.contract.update({
          where: { id: contractId },
          data: {
            signedAt: now,
            status: ContractStatus.ACTIVE,
          },
        });

        const activated = await activateContractLifecycle(tx, contractId);
        return activated ?? updated;
      }

      return signedContract;
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      clientPlatformFee:
        contract.clientPlatformFee != null
          ? Number(contract.clientPlatformFee)
          : 0,
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
    };
  }

  async rejectContract(contractId: number, reason?: string) {
    const now = new Date();
    const contract = await this.prisma.$transaction(async (tx) => {
      const rejectedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.REJECTED,
          rejectedAt: now,
          rejectReason: reason ?? null,
        },
      });

      await tx.proposal.update({
        where: { id: rejectedContract.proposalId },
        data: {
          status: ProposalStatus.REJECTED,
        },
      });

      await tx.job.update({
        where: { id: rejectedContract.jobId },
        data: {
          positionsFilled: { decrement: 1 },
        },
      });

      await tx.notification.create({
        data: {
          userId: rejectedContract.clientId,
          type: NotificationType.JOB_ALERT,
          title: 'Contract offer declined',
          message: `The freelancer declined the contract offer for contract #${rejectedContract.id}.${reason ? ` Reason: ${reason}` : ''} Any escrow deposit will be refunded automatically.`,
          data: {
            href: `/client/contracts/${rejectedContract.slug}`,
            contractId: rejectedContract.id,
            contractSlug: rejectedContract.slug,
          },
        },
      });

      return rejectedContract;
    });

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      clientPlatformFee:
        contract.clientPlatformFee != null
          ? Number(contract.clientPlatformFee)
          : 0,
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
        data: { status: JobStatus.COMPLETED },
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
        clientPlatformFee:
          c.clientPlatformFee != null ? Number(c.clientPlatformFee) : 0,
        platformFee: c.platformFee != null ? Number(c.platformFee) : 0,
        milestones: c.milestones?.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }

  async getContractDetail(contractId: number) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, deletedAt: null },
      select: contractDetailSelect,
    });

    if (!contract) return null;

    return {
      ...contract,
      totalAmount: Number(contract.totalAmount),
      clientPlatformFee:
        contract.clientPlatformFee != null
          ? Number(contract.clientPlatformFee)
          : 0,
      platformFee:
        contract.platformFee != null ? Number(contract.platformFee) : 0,
      milestones: contract.milestones?.map((m) => ({
        ...m,
        amount: Number(m.amount),
      })),
    };
  }
}
