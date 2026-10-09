import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { BrowseJobMessage } from '@shared/types';

export const JobNotFoundException = () =>
  new NotFoundException(BrowseJobMessage.JOB_NOT_FOUND);

export const FailedToLoadJobListException = () =>
  new InternalServerErrorException(BrowseJobMessage.FAILED_TO_LOAD_JOB_LIST);

export const FailedToLoadJobDetailException = () =>
  new InternalServerErrorException(BrowseJobMessage.FAILED_TO_LOAD_JOB_DETAIL);
