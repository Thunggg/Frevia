import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageSavedSearchMessage } from '@shared/types';

export const SavedSearchNotFoundException = () =>
  new NotFoundException([
    { message: ManageSavedSearchMessage.NOT_FOUND, path: 'id' },
  ]);

export const FailedToCreateSavedSearchException = () =>
  new InternalServerErrorException([
    { message: ManageSavedSearchMessage.FAILED_TO_CREATE, path: '' },
  ]);

export const FailedToLoadSavedSearchException = () =>
  new InternalServerErrorException([
    { message: ManageSavedSearchMessage.FAILED_TO_LOAD, path: '' },
  ]);
