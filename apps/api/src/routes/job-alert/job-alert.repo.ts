import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateJobAlertBodyType, JobAlertType } from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';

const jobAlertSelect = {
  id: true,
  userId: true,
  name: true,
  keywords: true,
  budgetMin: true,
  budgetMax: true,
  budgetType: true,
  frequency: true,
  channels: true,
  isActive: true,
  lastTriggeredAt: true,
  createdAt: true,
  updatedAt: true,
  skills: {
    select: {
      jobAlertId: true,
      skillId: true,
      skill: { select: { name: true } },
    },
  },
} satisfies Prisma.JobAlertSelect;

@Injectable()
export class JobAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countActiveSkills(skillIds: number[]): Promise<number> {
    return this.prisma.skill.count({
      where: {
        id: { in: skillIds },
        deletedAt: null,
      },
    });
  }

  async create(
    userId: number,
    data: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    const skillIds = [...new Set(data.skills)];
    const jobAlert = await this.prisma.jobAlert.create({
      data: {
        userId,
        name: data.name,
        keywords: data.keywords,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        budgetType: data.budgetType,
        frequency: data.frequency,
        channels: data.channels,
        skills: {
          create: skillIds.map((skillId) => ({ skillId })),
        },
      },
      select: jobAlertSelect,
    });

    return {
      ...jobAlert,
      budgetMin:
        jobAlert.budgetMin === null ? null : Number(jobAlert.budgetMin),
      budgetMax:
        jobAlert.budgetMax === null ? null : Number(jobAlert.budgetMax),
    };
  }
}
