import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class SharedFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    contractId: number;
    uploaderId: number;
    fileUrl: string;
    publicId: string;
    fileName?: string;
  }) {
    return this.prisma.sharedFile.create({
      data: {
        contractId: data.contractId,
        uploaderId: data.uploaderId,
        fileUrl: data.fileUrl,
        publicId: data.publicId,
        fileName: data.fileName,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.sharedFile.findUnique({
      where: {
        id,
      },
    });
  }

  async findByContractId(contractId: number) {
    return this.prisma.sharedFile.findMany({
      where: {
        contractId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async softDelete(id: number) {
    return this.prisma.sharedFile.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
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
}
