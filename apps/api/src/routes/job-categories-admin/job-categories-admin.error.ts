import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageJobCategoryAdminMessage } from '@shared/types';

// ====== Exception cho trang Admin quản lý danh mục công việc (Job Category — UC-46) ======

// Danh mục không tồn tại
export const JobCategoryAdminNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageJobCategoryAdminMessage.JOB_CATEGORY_NOT_FOUND,
      path: 'jobCategoryId',
    },
  ]);

export const FailedToLoadJobCategoryListException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_LOAD_JOB_CATEGORY_LIST,
      path: 'jobCategories',
    },
  ]);

export const FailedToLoadJobCategoryDetailException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_LOAD_JOB_CATEGORY_DETAIL,
      path: 'jobCategoryId',
    },
  ]);

// Tên danh mục đã tồn tại (so sánh không phân biệt hoa thường, chỉ tính danh mục chưa xoá)
export const JobCategoryNameAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManageJobCategoryAdminMessage.JOB_CATEGORY_NAME_ALREADY_EXISTS,
      path: 'name',
    },
  ]);

// Không thể xoá: danh mục vẫn còn công việc đang hoạt động (UC-46.05)
export const JobCategoryHasJobsException = () =>
  new ConflictException([
    {
      message: ManageJobCategoryAdminMessage.JOB_CATEGORY_HAS_JOBS,
      path: 'jobCategoryId',
    },
  ]);

export const FailedToCreateJobCategoryException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_CREATE_JOB_CATEGORY,
      path: 'jobCategory',
    },
  ]);

export const FailedToUpdateJobCategoryException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_UPDATE_JOB_CATEGORY,
      path: 'jobCategory',
    },
  ]);

export const FailedToDeleteJobCategoryException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_DELETE_JOB_CATEGORY,
      path: 'jobCategoryId',
    },
  ]);

export const FailedToRestoreJobCategoryException = () =>
  new InternalServerErrorException([
    {
      message: ManageJobCategoryAdminMessage.FAILED_TO_RESTORE_JOB_CATEGORY,
      path: 'jobCategoryId',
    },
  ]);
