import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageJobAlertMessage } from '@shared/types';

export const JobAlertFreelancerOnlyException = () =>
  new ForbiddenException([
    { message: ManageJobAlertMessage.FREELANCER_ONLY, path: 'roleName' },
  ]);

export const JobAlertSkillNotFoundException = () =>
  new UnprocessableEntityException([
    { message: ManageJobAlertMessage.SKILL_NOT_FOUND, path: 'skills' },
  ]);

export const JobAlertNotFoundException = () =>
  new NotFoundException([
    { message: ManageJobAlertMessage.NOT_FOUND, path: 'id' },
  ]);

export const FailedToCreateJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_CREATE, path: '' },
  ]);

export const FailedToLoadJobAlertsException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_LOAD, path: '' },
  ]);

export const FailedToLoadJobAlertDetailException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_LOAD_DETAIL, path: '' },
  ]);
