import { Injectable } from '@nestjs/common';
import { ContractStatus, Prisma } from '@prisma/client';
import { CreateContractBodyType, GetContractListQueryType, UpdateContractBodyType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const contractDetailSelect = {
    id: true,
    jobId: true,
    proposalId: true,
    clientId: true,
    freelancerId: true,
    terms: true,
    totalAmount: true,
    status: true,
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
    constructor(private readonly prisma: PrismaService) { }

    async findProposalWithJob(proposalId: number) {
        return this.prisma.proposal.findUnique({
            where: { id: proposalId },
            select: {
                id: true,
                status: true,
                freelancerId: true,
                job: {
                    select: { id: true, clientId: true },
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
                clientId: true,
                freelancerId: true,
                status: true,
                signedByClient: true,
                signedByFreelancer: true,
            },
        });
    }

    async createContract(
        data: CreateContractBodyType,
        clientId: number,
        freelancerId: number,
        jobId: number,
    ) {
        const contract = await this.prisma.contract.create({
            data: {
                jobId,
                proposalId: data.proposalId,
                clientId,
                freelancerId,
                totalAmount: data.totalAmount,
                terms: data.terms ?? null,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            },
        });

        return {
            ...contract,
            totalAmount: Number(contract.totalAmount),
        };
    }

    async updateContract(contractId: number, data: UpdateContractBodyType) {
        const contract = await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
                ...(data.terms !== undefined && { terms: data.terms }),
                ...(data.expiresAt !== undefined && { expiresAt: new Date(data.expiresAt) }),
                signedByClient: false,
                signedByFreelancer: false,
            },
        });

        return {
            ...contract,
            totalAmount: Number(contract.totalAmount),
        };
    }


    async signContract(contractId: number, role: 'client' | 'freelancer', alreadySigned: boolean) {
        const isClientSigning = role === 'client';

        const contract = await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                ...(isClientSigning
                    ? { signedByClient: true }
                    : { signedByFreelancer: true }
                ),
                ...(alreadySigned && {
                    status: ContractStatus.ACTIVE,
                    signedAt: new Date(),
                }),
            },
        });

        return {
            ...contract,
            totalAmount: Number(contract.totalAmount),
        };
    }

    async completeContract(contractId: number) {
        const contract = await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.COMPLETED,
                completedAt: new Date(),
            },
        });

        return {
            ...contract,
            totalAmount: Number(contract.totalAmount),
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
        };
    }

    async getContractList(
        query: GetContractListQueryType,
        filter: { userId?: number; role?: 'client' | 'freelancer' },
    ) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ContractWhereInput = {
            deletedAt: null,
            ...(status && { status: status as ContractStatus }),
            ...(filter.userId && filter.role === 'client' && { clientId: filter.userId }),
            ...(filter.userId && filter.role === 'freelancer' && { freelancerId: filter.userId }),
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
            data: contracts.map((c) => ({ ...c, totalAmount: Number(c.totalAmount) })),
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
        };
    }
}