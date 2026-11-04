import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageJobAlertMessage } from '@shared/types';

export const JobAlertNotFoundException = () =>
  new NotFoundException([
    { message: ManageJobAlertMessage.NOT_FOUND, path: 'id' },
  ]);

export const JobAlertOnlyForFreelancerException = () =>
  new ForbiddenException([
    { message: ManageJobAlertMessage.ONLY_FOR_FREELANCER, path: 'roleName' },
  ]);

export const FailedToCreateJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_CREATE, path: '' },
  ]);

export const FailedToLoadJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_LOAD, path: '' },
  ]);

export const FailedToUpdateJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_UPDATE, path: '' },
  ]);

export const FailedToDeleteJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_DELETE, path: '' },
  ]);
