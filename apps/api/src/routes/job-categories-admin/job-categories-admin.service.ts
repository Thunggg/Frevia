import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  AdminCreateJobCategoryBodyType,
  AdminUpdateJobCategoryBodyType,
  JobCategoryAdminDeleteResponseType,
  JobCategoryAdminDetailResponseType,
  JobCategoryAdminListResponseType,
  JobCategoryAdminQueryType,
} from '@shared/types';
import {
  FailedToCreateJobCategoryException,
  FailedToDeleteJobCategoryException,
  FailedToLoadJobCategoryDetailException,
  FailedToLoadJobCategoryListException,
  FailedToRestoreJobCategoryException,
  FailedToUpdateJobCategoryException,
  JobCategoryAdminNotFoundException,
  JobCategoryNameAlreadyExistsException,
} from './job-categories-admin.error';
import { JobCategoriesAdminRepository } from './job-categories-admin.repo';
import { CacheService } from '../../shared/services/cache.service';

@Injectable()
export class JobCategoriesAdminService {
  constructor(
    private readonly repository: JobCategoriesAdminRepository,
    private readonly cacheService?: CacheService,
  ) {}

  // Danh sách danh mục công việc (UC-46.01)
  async listJobCategories(
    query: JobCategoryAdminQueryType,
  ): Promise<JobCategoryAdminListResponseType> {
    try {
      return await this.repository.listJobCategories(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadJobCategoryListException();
    }
  }

  // Chi tiết danh mục + công việc liên quan (UC-46.02)
  async getJobCategoryDetail(
    id: number,
  ): Promise<JobCategoryAdminDetailResponseType> {
    try {
      const jobCategory = await this.repository.getJobCategoryDetail(id);
      if (!jobCategory) {
        throw JobCategoryAdminNotFoundException();
      }
      return jobCategory;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadJobCategoryDetailException();
    }
  }

  // Tạo danh mục mới (UC-46.03)
  async createJobCategory(
    body: AdminCreateJobCategoryBodyType,
  ): Promise<JobCategoryAdminDetailResponseType> {
    try {
      const result = await this.repository.createJobCategory(body);
      this.cacheService?.delByPrefix('job_categor');
      return result;
    } catch (error) {
      // Chống race condition khi 2 request tạo cùng lúc (vi phạm partial unique index)
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw JobCategoryNameAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateJobCategoryException();
    }
  }

  // Cập nhật thông tin + trạng thái danh mục (UC-46.04)
  async updateJobCategory(
    id: number,
    body: AdminUpdateJobCategoryBodyType,
  ): Promise<JobCategoryAdminDetailResponseType> {
    try {
      const result = await this.repository.updateJobCategory(id, body);
      this.cacheService?.delByPrefix('job_categor');
      return result;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw JobCategoryNameAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateJobCategoryException();
    }
  }

  // Xoá danh mục (soft delete) sau khi kiểm tra công việc liên quan (UC-46.05)
  async deleteJobCategory(
    id: number,
  ): Promise<JobCategoryAdminDeleteResponseType> {
    try {
      const result = await this.repository.deleteJobCategory(id);
      this.cacheService?.delByPrefix('job_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteJobCategoryException();
    }
  }

  // Khôi phục danh mục đã xoá (UC-46.06)
  async restoreJobCategory(
    id: number,
  ): Promise<JobCategoryAdminDetailResponseType> {
    try {
      const result = await this.repository.restoreJobCategory(id);
      this.cacheService?.delByPrefix('job_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToRestoreJobCategoryException();
    }
  }
}
