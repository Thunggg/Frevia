import { Injectable } from '@nestjs/common';
import { CreateContractBodyType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) { }


  async findJobById(jobId: number) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
  }


  async findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
  }


  async findContractByJobId(jobId: number) {
    return this.prisma.contract.findUnique({
      where: { jobId },
      select: { id: true },
    });
  }

  async createContract(data: CreateContractBodyType) {
    const {
      jobId,
      clientId,
      freelancerId,
      totalAmount,
      depositPercent,
      terms,
      escrowContractAddress,
      expiresAt,
    } = data;

    return this.prisma.contract.create({
      data: {
        jobId,
        clientId,
        freelancerId,
        totalAmount,
        depositPercent: depositPercent ?? 0,
        terms: terms ?? null,
        escrowContractAddress: escrowContractAddress ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        // status, paymentStatus, signedByClient, signedByFreelancer đều có default trong schema
      },
    });
  }
}
