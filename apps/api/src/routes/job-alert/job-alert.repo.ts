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
  name: true,
  keywords: true,
  skills: true,
  frequency: true,
  channels: true,
  isActive: true,
  lastSentAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.JobAlertSelect;

@Injectable()
export class JobAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByUserId(userId: number): Promise<number> {
    return this.prisma.jobAlert.count({
      where: { userId },
    });
  }

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

  async findDuplicate(
    userId: number,
    normalizedKeyword: string | null,
    sortedSkills: string[],
    excludeId?: number,
  ): Promise<JobAlertType | null> {
    const alerts = await this.prisma.jobAlert.findMany({
      where: {
        userId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: jobAlertSelect,
    });

    const targetSkillsStr = sortedSkills.join(',');
    const found = alerts.find((alert) => {
      const alertKeyword = alert.keywords?.trim().toLowerCase() || null;
      const alertSkillsStr = [...alert.skills].sort().join(',');
      return (
        alertKeyword === normalizedKeyword && alertSkillsStr === targetSkillsStr
      );
    });

    return (found as JobAlertType) || null;
  }

  async create(
    userId: number,
    data: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    return this.prisma.jobAlert.create({
      data: {
        userId,
        name: data.name ?? null,
        keywords: data.keywords ?? null,
        skills: data.skills ?? [],
        frequency: data.frequency,
        channels: data.channels,
        isActive: true,
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
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.keywords !== undefined) {
      updateData.keywords = data.keywords;
    }
    if (data.skills !== undefined) {
      updateData.skills = data.skills;
    }
    if (data.frequency !== undefined) {
      updateData.frequency = data.frequency;
    }
    if (data.channels !== undefined) {
      updateData.channels = data.channels;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
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
