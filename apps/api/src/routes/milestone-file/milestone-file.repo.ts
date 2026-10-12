import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

const milestoneFileSelect = {
    id: true,
    milestoneId: true,
    uploaderId: true,
    fileUrl: true,
    publicId: true,
    fileName: true,
    createdAt: true,
    deletedAt: true,
} satisfies Prisma.MilestoneFileSelect;

@Injectable()
export class MilestoneFileRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findContractById(contractId: number) {
        return this.prisma.contract.findUnique({
            where: { id: contractId, deletedAt: null },
            select: {
                id: true,
                clientId: true,
                freelancerId: true,
                status: true,
            },
        });
    }

    async findMilestoneById(milestoneId: number) {
        return this.prisma.milestone.findFirst({
            where: { id: milestoneId, deletedAt: null },
            select: {
                id: true,
                contractId: true,
            },
        });
    }

    async findFileById(fileId: number) {
        return this.prisma.milestoneFile.findUnique({
            where: { id: fileId },
            select: milestoneFileSelect,
        });
    }

    async getMilestoneFiles(milestoneId: number) {
        return this.prisma.milestoneFile.findMany({
            where: { milestoneId, deletedAt: null },
            select: milestoneFileSelect,
            orderBy: { createdAt: 'desc' },
        });
    }

    async createMilestoneFile(data: {
        milestoneId: number;
        uploaderId: number;
        fileUrl: string;
        publicId: string;
        fileName?: string;
    }) {
        return this.prisma.milestoneFile.create({
            data: {
                milestoneId: data.milestoneId,
                uploaderId: data.uploaderId,
                fileUrl: data.fileUrl,
                publicId: data.publicId,
                fileName: data.fileName,
            },
            select: milestoneFileSelect,
        });
    }

    async softDeleteFile(fileId: number) {
        return this.prisma.milestoneFile.update({
            where: { id: fileId },
            data: { deletedAt: new Date() },
            select: milestoneFileSelect,
        });
    }
}
