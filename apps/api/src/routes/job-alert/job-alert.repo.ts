import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateJobAlertBodyType,
  JobAlertType,
  UpdateJobAlertBodyType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const jobAlertSelect = {
  id: true,
  userId: true,
  keywords: true,
  skills: true,
  createdAt: true,
} satisfies Prisma.JobAlertSelect;

@Injectable()
export class JobAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: number): Promise<JobAlertType[]> {
    return this.prisma.jobAlert.findMany({
      where: { userId },
      select: jobAlertSelect,
      orderBy: { createdAt: 'desc' },
    }) as Promise<JobAlertType[]>;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<JobAlertType | null> {
    return this.prisma.jobAlert.findFirst({
      where: { id, userId },
      select: jobAlertSelect,
    }) as Promise<JobAlertType | null>;
  }

  async create(
    userId: number,
    data: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    return this.prisma.jobAlert.create({
      data: {
        userId,
        keywords: data.keywords ?? null,
        skills: data.skills ?? [],
      },
      select: jobAlertSelect,
    }) as Promise<JobAlertType>;
  }

  async update(
    id: number,
    userId: number,
    data: UpdateJobAlertBodyType,
  ): Promise<JobAlertType | null> {
    const updateData: Prisma.JobAlertUpdateManyMutationInput = {};
    if (data.keywords !== undefined) {
      updateData.keywords = data.keywords;
    }
    if (data.skills !== undefined) {
      updateData.skills = data.skills;
    }

    const result = await this.prisma.jobAlert.updateMany({
      where: { id, userId },
      data: updateData,
    });

    if (!result.count) return null;
    return this.findByIdAndUserId(id, userId);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.prisma.jobAlert.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}
