import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProfileMessage } from '@shared/types';

export const FreelancerProfileNotFoundException = () =>
  new NotFoundException([
    { message: ProfileMessage.PROFILE_NOT_FOUND, path: 'id' },
  ]);

export const FreelancerSkillNotFoundException = () =>
  new NotFoundException([
    { message: ProfileMessage.SKILL_NOT_FOUND, path: 'skillId' },
  ]);

export const FreelancerSkillDuplicateException = () =>
  new BadRequestException([
    { message: ProfileMessage.DUPLICATE_SKILL, path: 'skillName' },
  ]);

export const ProfileForbiddenException = () =>
  new ForbiddenException([
    { message: ProfileMessage.PROFILE_FORBIDDEN, path: 'userId' },
  ]);

export const SkillForbiddenException = () =>
  new ForbiddenException([
    { message: 'You can only delete your own skills.', path: 'userId' },
  ]);

export const CvFileRequiredException = () =>
  new BadRequestException([
    { message: 'Please select a CV file.', path: 'file' },
  ]);

export const CvFileInvalidException = () =>
  new BadRequestException([
    { message: 'Only PDF CV files up to 10 MB are accepted.', path: 'file' },
  ]);

export const CvNotFoundException = () =>
  new NotFoundException([{ message: 'CV not found.', path: 'cv' }]);
