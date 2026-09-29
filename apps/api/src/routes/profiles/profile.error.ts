import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ProfileMessage } from '@shared/types';

export const FreelancerProfileNotFoundException = () =>
  new NotFoundException([
    {
      message: ProfileMessage.PROFILE_NOT_FOUND,
      path: 'id',
    },
  ]);

export const ProfileForbiddenException = () =>
  new ForbiddenException([
    {
      message: ProfileMessage.PROFILE_FORBIDDEN,
      path: 'userId',
    },
  ]);

export const FailedToLoadProfileException = () =>
  new InternalServerErrorException([
    {
      message: ProfileMessage.FAILED_TO_LOAD_PROFILE,
      path: 'profile',
    },
  ]);

export const FailedToUpdateProfileException = () =>
  new InternalServerErrorException([
    {
      message: ProfileMessage.FAILED_TO_UPDATE_PROFILE,
      path: 'profile',
    },
  ]);

export const FreelancerSkillsNotFoundException = () =>
  new NotFoundException([
    {
      message: ProfileMessage.SKILLS_NOT_FOUND,
      path: 'skills',
    },
  ]);
