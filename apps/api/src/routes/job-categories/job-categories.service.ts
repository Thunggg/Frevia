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

// UC-46.06 (View Job Category List) và UC-46.07 (View Job Category Detail)
// dành cho người dùng/Freelancer: chỉ đọc, không cần đăng nhập (BR-CAT-02).
@Injectable()
export class JobCategoriesService {
  constructor(private readonly repository: JobCategoriesRepository) {}

  async viewJobCategoryList(
    query: JobCategoryBrowseParsedQueryType,
  ): Promise<JobCategoryBrowseListResponseType> {
    try {
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
      return await this.repository.getJobCategoryDetail(slug, page, limit);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobCategoryDetailException();
      }

      throw error;
    }
  }
}
