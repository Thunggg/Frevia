import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ManageJobMessage } from '@shared/types';

export const BookmarkNotFoundException = () =>
  new NotFoundException(ManageJobMessage.BOOKMARK_NOT_FOUND);

export const JobAlreadyBookmarkedException = () =>
  new BadRequestException(ManageJobMessage.JOB_ALREADY_BOOKMARKED);

export const BookmarkJobOnlyForFreelancerException = () =>
  new ForbiddenException([
    {
      message: ManageJobMessage.BOOKMARK_JOB_ONLY_FOR_FREELANCER,
      path: 'roleName',
    },
  ]);

export const JobOnlyForClientException = () =>
  new ForbiddenException([
    {
      message: ManageJobMessage.JOB_ONLY_FOR_CLIENT,
      path: 'roleName',
    },
  ]);

export const JobNotFoundException = () =>
  new NotFoundException(ManageJobMessage.JOB_NOT_FOUND);

// Danh mục công việc gửi lên không tồn tại / đã bị vô hiệu hoá (UC-46: chỉ danh mục ACTIVE dùng được).
export const JobCategoriesNotFoundException = () =>
  new BadRequestException(ManageJobMessage.JOB_CATEGORIES_NOT_FOUND);

// Không thể giảm số vị trí cần tuyển xuống dưới số vị trí đã tuyển.
export const PositionsRequiredBelowFilledException = () =>
  new BadRequestException([
    {
      message: ManageJobMessage.POSITIONS_REQUIRED_BELOW_FILLED,
      path: 'positionsRequired',
    },
  ]);

export const FailedToLoadBookmarkedJobsException = () =>
  new InternalServerErrorException(
    ManageJobMessage.FAILED_TO_LOAD_BOOKMARKED_JOBS,
  );

export const FailedToBookmarkJobException = () =>
  new InternalServerErrorException(ManageJobMessage.FAILED_TO_BOOKMARK_JOB);

export const FailedToRemoveBookmarkException = () =>
  new InternalServerErrorException(ManageJobMessage.FAILED_TO_REMOVE_BOOKMARK);

export const FailedToCreateJobException = () =>
  new InternalServerErrorException(ManageJobMessage.FAILED_TO_CREATE_JOB);

export const FailedToUpdateJobException = () =>
  new InternalServerErrorException(ManageJobMessage.FAILED_TO_UPDATE_JOB);

export const FailedToDeleteJobException = () =>
  new InternalServerErrorException({
    message: ManageJobMessage.FAILED_TO_DELETE_JOB,
  });

export const JobCannotBePublishedException = () =>
  new BadRequestException(ManageJobMessage.JOB_CANNOT_BE_PUBLISHED);

export const FailedToPublishJobException = () =>
  new InternalServerErrorException({
    message: ManageJobMessage.FAILED_TO_PUBLISH_JOB,
  });

export const JobCannotBeClosedException = () =>
  new BadRequestException(ManageJobMessage.JOB_CANNOT_BE_CLOSED);

export const FailedToCloseJobException = () =>
  new InternalServerErrorException({
    message: ManageJobMessage.FAILED_TO_CLOSE_JOB,
  });

export const JobCannotBeReopenedException = () =>
  new BadRequestException(ManageJobMessage.JOB_CANNOT_BE_REOPENED);

export const FailedToReopenJobException = () =>
  new InternalServerErrorException({
    message: ManageJobMessage.FAILED_TO_REOPEN_JOB,
  });
