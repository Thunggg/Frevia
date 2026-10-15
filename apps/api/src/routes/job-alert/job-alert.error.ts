import {
  ForbiddenException,
  InternalServerErrorException,
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

export const FailedToCreateJobAlertException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_CREATE, path: '' },
  ]);

export const FailedToLoadJobAlertsException = () =>
  new InternalServerErrorException([
    { message: ManageJobAlertMessage.FAILED_TO_LOAD, path: '' },
  ]);
