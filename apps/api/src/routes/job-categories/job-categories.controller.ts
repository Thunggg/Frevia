import { Controller, Get, Param, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';

import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  JobCategoryBrowseListResponseDto,
  JobCategoryBrowseQueryDto,
  JobCategoryDetailQueryDto,
  JobCategoryDetailResponseDto,
} from './job-categories.dto';
import { JobCategoriesService } from './job-categories.service';

// UC-46.06 + UC-46.07 — Người dùng xem danh mục công việc khi tìm kiếm/lọc job.
// Dữ liệu công khai (BR-CAT-02) nên không yêu cầu đăng nhập.
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly service: JobCategoriesService) {}

  @Get()
  @IsPublic()
  @ZodSerializerDto(JobCategoryBrowseListResponseDto)
  viewJobCategoryList(@Query() query: JobCategoryBrowseQueryDto) {
    return this.service.viewJobCategoryList(query);
  }

  @Get(':slug')
  @IsPublic()
  @ZodSerializerDto(JobCategoryDetailResponseDto)
  viewJobCategoryDetail(
    @Param('slug') slug: string,
    @Query() query: JobCategoryDetailQueryDto,
  ) {
    return this.service.viewJobCategoryDetail(slug, query.page, query.limit);
  }
}
