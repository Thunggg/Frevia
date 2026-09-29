import {
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

export const FailedToLoadProfileException = () =>
  new InternalServerErrorException([
    {
      message: ProfileMessage.FAILED_TO_LOAD_PROFILE,
      path: 'profile',
    },
  ]);
