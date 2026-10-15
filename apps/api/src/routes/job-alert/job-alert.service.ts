import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { CreateJobAlertBodyType, JobAlertType, RoleName } from '@shared/types';

import {
  FailedToCreateJobAlertException,
  JobAlertFreelancerOnlyException,
  JobAlertSkillNotFoundException,
} from './job-alert.error';
import { JobAlertRepository } from './job-alert.repo';

@Injectable()
export class JobAlertService {
  constructor(private readonly jobAlertRepository: JobAlertRepository) {}

  async createJobAlert(
    userId: number,
    roleName: string,
    body: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    if (roleName !== RoleName.FREELANCER) {
      throw JobAlertFreelancerOnlyException();
    }

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
}
