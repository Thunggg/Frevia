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

export const JobNotFoundException = () =>
  new NotFoundException(ManageJobMessage.JOB_NOT_FOUND);

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

export const FailedToChangeJobStatusException = () =>
  new InternalServerErrorException({
    message: ManageJobMessage.FAILED_TO_CHANGE_JOB_STATUS,
  });
