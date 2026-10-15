import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobAlertBodyType,
  GetJobAlertsQueryType,
  GetJobAlertsResponseType,
  JobAlertType,
  RoleName,
} from '@shared/types';

import {
  FailedToCreateJobAlertException,
  FailedToLoadJobAlertsException,
  JobAlertFreelancerOnlyException,
  JobAlertSkillNotFoundException,
} from './job-alert.error';
import { JobAlertRepository } from './job-alert.repo';

@Injectable()
export class JobAlertService {
  constructor(private readonly jobAlertRepository: JobAlertRepository) {}

  async getJobAlerts(
    userId: number,
    roleName: string,
    query: GetJobAlertsQueryType,
  ): Promise<GetJobAlertsResponseType> {
    this.assertFreelancer(roleName);

    try {
      const { jobAlerts, total } =
        await this.jobAlertRepository.findAllByUserId(userId, query);

      return {
        data: jobAlerts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobAlertsException();
      }
      throw error;
    }
  }

  async createJobAlert(
    userId: number,
    roleName: string,
    body: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    this.assertFreelancer(roleName);

    try {
      const uniqueSkillIds = [...new Set(body.skills)];
      if (
        uniqueSkillIds.length > 0 &&
        (await this.jobAlertRepository.countActiveSkills(uniqueSkillIds)) !==
          uniqueSkillIds.length
      ) {
        throw JobAlertSkillNotFoundException();
      }

      return await this.jobAlertRepository.create(userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateJobAlertException();
      }
      throw error;
    }
  }

  private assertFreelancer(roleName: string): void {
    if (roleName !== RoleName.FREELANCER) {
      throw JobAlertFreelancerOnlyException();
    }
  }
}
