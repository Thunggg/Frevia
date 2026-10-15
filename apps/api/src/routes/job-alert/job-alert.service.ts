import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobAlertBodyType,
  GetJobAlertDetailResponseType,
  GetJobAlertsQueryType,
  GetJobAlertsResponseType,
  JobAlertType,
  RoleName,
  UpdateJobAlertBodyType,
  UpdateJobAlertResponseType,
} from '@shared/types';

import {
  FailedToCreateJobAlertException,
  FailedToDeleteJobAlertException,
  FailedToLoadJobAlertDetailException,
  FailedToLoadJobAlertsException,
  FailedToUpdateJobAlertException,
  JobAlertBudgetRangeInvalidException,
  JobAlertFreelancerOnlyException,
  JobAlertNotFoundException,
  JobAlertSkillNotFoundException,
} from './job-alert.error';
import { JobAlertRepository } from './job-alert.repo';

@Injectable()
export class JobAlertService {
  constructor(private readonly jobAlertRepository: JobAlertRepository) {}

  async getJobAlertDetail(
    userId: number,
    roleName: string,
    id: number,
  ): Promise<GetJobAlertDetailResponseType> {
    this.assertFreelancer(roleName);

    try {
      const jobAlert = await this.jobAlertRepository.findByIdAndUserId(
        id,
        userId,
      );
      if (!jobAlert) {
        throw JobAlertNotFoundException();
      }

      return jobAlert;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobAlertDetailException();
      }
      throw error;
    }
  }

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

  async updateJobAlert(
    userId: number,
    roleName: string,
    id: number,
    body: UpdateJobAlertBodyType,
  ): Promise<UpdateJobAlertResponseType> {
    this.assertFreelancer(roleName);

    try {
      const jobAlert = await this.jobAlertRepository.findByIdAndUserId(
        id,
        userId,
      );
      if (!jobAlert) {
        throw JobAlertNotFoundException();
      }

      const budgetMin =
        body.budgetMin !== undefined ? body.budgetMin : jobAlert.budgetMin;
      const budgetMax =
        body.budgetMax !== undefined ? body.budgetMax : jobAlert.budgetMax;
      if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
        throw JobAlertBudgetRangeInvalidException();
      }

      if (body.skills !== undefined) {
        const uniqueSkillIds = [...new Set(body.skills)];
        if (
          uniqueSkillIds.length > 0 &&
          (await this.jobAlertRepository.countActiveSkills(uniqueSkillIds)) !==
            uniqueSkillIds.length
        ) {
          throw JobAlertSkillNotFoundException();
        }
      }

      return await this.jobAlertRepository.update(id, userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateJobAlertException();
      }
      throw error;
    }
  }

  async deleteJobAlert(
    userId: number,
    roleName: string,
    id: number,
  ): Promise<void> {
    this.assertFreelancer(roleName);

    try {
      const deleted = await this.jobAlertRepository.delete(id, userId);
      if (!deleted) {
        throw JobAlertNotFoundException();
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToDeleteJobAlertException();
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
