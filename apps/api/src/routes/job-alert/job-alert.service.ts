import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobAlertBodyType,
  DeleteJobAlertResponseType,
  JobAlertType,
  MAX_JOB_ALERTS_PER_USER,
  MatchingJobItemType,
  RoleName,
  UpdateJobAlertBodyType,
} from '@shared/types';
import {
  FailedToCreateJobAlertException,
  FailedToDeleteJobAlertException,
  FailedToLoadJobAlertException,
  FailedToUpdateJobAlertException,
  JobAlertDuplicateCriteriaException,
  JobAlertLimitExceededException,
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

  private normalizeCriteria(keywords?: string | null, skills?: string[]) {
    const normalizedKeyword = keywords?.trim().toLowerCase() || null;
    const sortedSkills = [...(skills ?? [])]
      .map((s) => s.trim().toLowerCase())
      .sort();
    return { normalizedKeyword, sortedSkills };
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

    // BR-JA01: Giới hạn tối đa 10 Job Alerts / Freelancer
    const currentCount = await this.jobAlertRepository.countByUserId(userId);
    if (currentCount >= MAX_JOB_ALERTS_PER_USER) {
      throw JobAlertLimitExceededException();
    }

    // BR-JA02: Chống trùng lặp tiêu chí
    const { normalizedKeyword, sortedSkills } = this.normalizeCriteria(
      body.keywords,
      body.skills,
    );
    const duplicate = await this.jobAlertRepository.findDuplicate(
      userId,
      normalizedKeyword,
      sortedSkills,
    );
    if (duplicate) {
      throw JobAlertDuplicateCriteriaException();
    }

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

    const existing = await this.jobAlertRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!existing) throw JobAlertNotFoundException();

    // Nếu có cập nhật tiêu chí tìm kiếm, kiểm tra xem có trùng với alert khác không
    if (body.keywords !== undefined || body.skills !== undefined) {
      const targetKeywords =
        body.keywords !== undefined ? body.keywords : existing.keywords;
      const targetSkills =
        body.skills !== undefined ? body.skills : existing.skills;

      const { normalizedKeyword, sortedSkills } = this.normalizeCriteria(
        targetKeywords,
        targetSkills,
      );
      const duplicate = await this.jobAlertRepository.findDuplicate(
        userId,
        normalizedKeyword,
        sortedSkills,
        id,
      );
      if (duplicate) {
        throw JobAlertDuplicateCriteriaException();
      }
    }

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

  async getMatchingJobs(
    userId: number,
    roleName: string,
    id: number,
  ): Promise<MatchingJobItemType[]> {
    this.assertFreelancerRole(roleName);
    const alert = await this.jobAlertRepository.findByIdAndUserId(id, userId);
    if (!alert) {
      throw JobAlertNotFoundException();
    }

    try {
      return await this.jobAlertRepository.findMatchingJobs(
        userId,
        alert.keywords,
        alert.skills,
        5,
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobAlertException();
      }
      throw error;
    }
  }
}
