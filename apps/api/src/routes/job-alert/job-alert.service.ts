import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobAlertBodyType,
  DeleteJobAlertResponseType,
  JobAlertType,
  RoleName,
  UpdateJobAlertBodyType,
} from '@shared/types';
import {
  FailedToCreateJobAlertException,
  FailedToDeleteJobAlertException,
  FailedToLoadJobAlertException,
  FailedToUpdateJobAlertException,
  JobAlertNotFoundException,
  JobAlertOnlyForFreelancerException,
} from './job-alert.error';
import { JobAlertRepository } from './job-alert.repo';

@Injectable()
export class JobAlertService {
  constructor(private readonly jobAlertRepository: JobAlertRepository) {}

  private assertFreelancerRole(roleName: string): void {
    if (roleName !== RoleName.FREELANCER) {
      throw JobAlertOnlyForFreelancerException();
    }
  }

  async getJobAlerts(
    userId: number,
    roleName: string,
  ): Promise<JobAlertType[]> {
    this.assertFreelancerRole(roleName);
    try {
      return await this.jobAlertRepository.findAllByUserId(userId);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobAlertException();
      }
      throw error;
    }
  }

  async getJobAlertDetail(
    userId: number,
    roleName: string,
    id: number,
  ): Promise<JobAlertType> {
    this.assertFreelancerRole(roleName);
    try {
      const jobAlert = await this.jobAlertRepository.findByIdAndUserId(
        id,
        userId,
      );
      if (!jobAlert) throw JobAlertNotFoundException();
      return jobAlert;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobAlertException();
      }
      throw error;
    }
  }

  async createJobAlert(
    userId: number,
    roleName: string,
    body: CreateJobAlertBodyType,
  ): Promise<JobAlertType> {
    this.assertFreelancerRole(roleName);
    try {
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
  ): Promise<JobAlertType> {
    this.assertFreelancerRole(roleName);
    try {
      const jobAlert = await this.jobAlertRepository.update(id, userId, body);
      if (!jobAlert) throw JobAlertNotFoundException();
      return jobAlert;
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
  ): Promise<DeleteJobAlertResponseType> {
    this.assertFreelancerRole(roleName);
    try {
      const deleted = await this.jobAlertRepository.delete(id, userId);
      if (!deleted) throw JobAlertNotFoundException();
      return { success: true };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToDeleteJobAlertException();
      }
      throw error;
    }
  }
}
