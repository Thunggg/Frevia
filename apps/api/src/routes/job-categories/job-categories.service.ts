import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  JobCategoryBrowseListResponseType,
  JobCategoryBrowseParsedQueryType,
  ViewJobCategoryDetailResponseType,
} from '@shared/types';

import {
  FailedToLoadJobCategoryDetailException,
  FailedToLoadJobCategoryListException,
} from './job-categories.error';
import { JobCategoriesRepository } from './job-categories.repo';
import { CacheService } from '../../shared/services/cache.service';

// UC-46.06 (View Job Category List) và UC-46.07 (View Job Category Detail)
// dành cho người dùng/Freelancer: chỉ đọc, không cần đăng nhập (BR-CAT-02).
@Injectable()
export class JobCategoriesService {
  constructor(
    private readonly repository: JobCategoriesRepository,
    private readonly cacheService?: CacheService,
  ) {}

  async viewJobCategoryList(
    query: JobCategoryBrowseParsedQueryType,
  ): Promise<JobCategoryBrowseListResponseType> {
    try {
      if (this.cacheService) {
        const cacheKey = `job_categories_list_${JSON.stringify(query)}`;
        return await this.cacheService.wrap(
          cacheKey,
          () => this.repository.listJobCategories(query),
          300,
        );
      }
      return await this.repository.listJobCategories(query);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobCategoryListException();
      }

      throw error;
    }
  }

  async viewJobCategoryDetail(
    slug: string,
    page: number,
    limit: number,
  ): Promise<ViewJobCategoryDetailResponseType> {
    try {
      if (this.cacheService) {
        const cacheKey = `job_category_detail_${slug}_${page}_${limit}`;
        return await this.cacheService.wrap(
          cacheKey,
          () => this.repository.getJobCategoryDetail(slug, page, limit),
          300,
        );
      }
      return await this.repository.getJobCategoryDetail(slug, page, limit);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobCategoryDetailException();
      }

      throw error;
    }
  }
}
