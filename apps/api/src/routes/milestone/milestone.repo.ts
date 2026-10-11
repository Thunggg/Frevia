import { Injectable } from '@nestjs/common';
import { MilestoneStatus, Prisma } from '@prisma/client';
import {
    CreateMilestoneBodyType,
    GetMilestoneListQueryType,
    UpdateMilestoneBodyType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const milestoneSelect = {
    id: true,
    contractId: true,
    title: true,
    description: true,
    amount: true,
    status: true,
    paymentStatus: true,
    dueDate: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
} satisfies Prisma.MilestoneSelect;

@Injectable()
export class MilestoneRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findContractById(contractId: number) {
        return this.prisma.contract.findUnique({
            where: { id: contractId, deletedAt: null },
            select: {
                id: true,
                clientId: true,
                freelancerId: true,
                status: true,
                totalAmount: true,
            },
        });
    }

    async getTotalMilestoneAmount(contractId: number, excludeMilestoneId?: number) {
        const result = await this.prisma.milestone.aggregate({
            where: {
                contractId,
                deletedAt: null,
                ...(excludeMilestoneId !== undefined && { id: { not: excludeMilestoneId } }),
            },
            _sum: { amount: true },
        });
        return Number(result._sum.amount ?? 0);
    }

    async findMilestoneById(milestoneId: number) {
        return this.prisma.milestone.findFirst({
            where: { id: milestoneId, deletedAt: null },
            select: milestoneSelect,
        });
    }

    async findInProgressMilestone(contractId: number) {
        return await this.prisma.milestone.findFirst({
            where: {
                contractId,
                status: MilestoneStatus.IN_PROGRESS,
            },
            select: {
                id: true,
            },
        });
    }

    async getMilestoneList(contractId: number, query: GetMilestoneListQueryType) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.MilestoneWhereInput = {
            contractId,
            deletedAt: null,
            ...(status && { status: status as MilestoneStatus }),
        };

        const [milestones, totalItems] = await this.prisma.$transaction([
            this.prisma.milestone.findMany({
                where,
                select: milestoneSelect,
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.milestone.count({ where }),
        ]);

        return {
            data: milestones.map((m) => ({ ...m, amount: Number(m.amount) })),
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            page,
            limit,
        };
    }

    async getMilestoneDetail(milestoneId: number) {
        const milestone = await this.prisma.milestone.findFirst({
            where: { id: milestoneId, deletedAt: null },
            select: milestoneSelect,
        });

        if (!milestone) return null;

        return { ...milestone, amount: Number(milestone.amount) };
    }

    async createMilestone(contractId: number, data: CreateMilestoneBodyType) {

        const milestone = await this.prisma.milestone.create({
            data: {
                contractId,
                title: data.title,
                description: data.description ?? null,
                amount: data.amount,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
        });

        return { ...milestone, amount: Number(milestone.amount) };
    }

    async updateMilestone(milestoneId: number, data: UpdateMilestoneBodyType) {

        const milestone = await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
            },
        });

        return { ...milestone, amount: Number(milestone.amount) };
    }

    async deleteMilestone(milestoneId: number) {
        const milestone = await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: { deletedAt: new Date() },
        });

        return { ...milestone, amount: Number(milestone.amount) };
    }

    async progressMilestone(milestoneId: number) {
        const milestone = await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: {
                status: MilestoneStatus.IN_PROGRESS,
            },
        });

        return { ...milestone, amount: Number(milestone.amount) };
    }
}
