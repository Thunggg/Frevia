import { Injectable } from '@nestjs/common';
import { CreateContractBodyType, UpdateContractTermsBodyType } from '@shared/types';
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

  async findContractById(id: number) {
    return this.prisma.contract.findUnique({
      where: { id, deletedAt: null },
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
      },
    });
  }

  async updateContractTerms(
    id: number,
    data: UpdateContractTermsBodyType,
    resetFreelancerSignature: boolean,
  ) {
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(data.terms !== undefined && { terms: data.terms }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.depositPercent !== undefined && { depositPercent: data.depositPercent }),
        ...(data.escrowContractAddress !== undefined && {
          escrowContractAddress: data.escrowContractAddress,
        }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
        ...(resetFreelancerSignature && { signedByFreelancer: false }),
      },
    });
  }

  async completeContract(id: number) {
    return this.prisma.contract.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async signContractAsClient(id: number) {
    return this.prisma.contract.update({
      where: { id },
      data: { signedByClient: true },
    });
  }

  async signContractAsFreelancer(id: number) {
    return this.prisma.contract.update({
      where: { id },
      data: { signedByFreelancer: true },
    });
  }

  async activateContract(id: number) {
    return this.prisma.contract.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        signedAt: new Date(),
      },
    });
  }
}
