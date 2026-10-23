import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { JobCategoryAdminQueryType } from '@shared/types';
import {
  CreateJobCategoryBodyDto,
  JobCategoryAdminDeleteResponseDto,
  JobCategoryAdminDetailResponseDto,
  JobCategoryAdminListResponseDto,
  JobCategoryAdminQueryDto,
  UpdateJobCategoryBodyDto,
} from './job-categories-admin.dto';
import { JobCategoriesAdminService } from './job-categories-admin.service';

// Trang Admin quản lý danh mục công việc (Job Category — UC-46.01 → UC-46.05):
// danh sách + chi tiết + tạo mới + cập nhật + xoá (soft delete) + khôi phục.
// Bảo mật: PermissionGuard tự chặn theo method+path; mặc định chỉ Admin có quyền.
@Controller('admin/job-categories')
export class JobCategoriesAdminController {
  constructor(private readonly service: JobCategoriesAdminService) {}

  @Get()
  @ZodSerializerDto(JobCategoryAdminListResponseDto)
  listJobCategories(@Query() query: JobCategoryAdminQueryDto) {
    return this.service.listJobCategories(query as JobCategoryAdminQueryType);
  }

  @Post()
  @ZodSerializerDto(JobCategoryAdminDetailResponseDto)
  createJobCategory(@Body() body: CreateJobCategoryBodyDto) {
    return this.service.createJobCategory(body);
  }

  @Patch(':id')
  @ZodSerializerDto(JobCategoryAdminDetailResponseDto)
  updateJobCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateJobCategoryBodyDto,
  ) {
    return this.service.updateJobCategory(id, body);
  }

  @Patch(':id/restore')
  @ZodSerializerDto(JobCategoryAdminDetailResponseDto)
  restoreJobCategory(@Param('id', ParseIntPipe) id: number) {
    return this.service.restoreJobCategory(id);
  }

  @Delete(':id')
  @ZodSerializerDto(JobCategoryAdminDeleteResponseDto)
  deleteJobCategory(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteJobCategory(id);
  }

  @Get(':id')
  @ZodSerializerDto(JobCategoryAdminDetailResponseDto)
  getJobCategoryDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getJobCategoryDetail(id);
  }
}
