import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { JobCategoryMessage } from '@shared/types';

export const JobCategoryNotFoundException = () =>
  new NotFoundException(JobCategoryMessage.JOB_CATEGORY_NOT_FOUND);

export const FailedToLoadJobCategoryListException = () =>
  new InternalServerErrorException(
    JobCategoryMessage.FAILED_TO_LOAD_JOB_CATEGORY_LIST,
  );

export const FailedToLoadJobCategoryDetailException = () =>
  new InternalServerErrorException(
    JobCategoryMessage.FAILED_TO_LOAD_JOB_CATEGORY_DETAIL,
  );
