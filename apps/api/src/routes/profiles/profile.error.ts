import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
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
    { message: ProfileMessage.SKILL_DELETE_FORBIDDEN, path: 'userId' },
  ]);

export const CvFileRequiredException = () =>
  new BadRequestException([
    { message: 'Please select a CV file.', path: 'file' },
  ]);

export const CvFileTypeException = () =>
  new BadRequestException([
    { message: 'Only PDF CV files are accepted.', path: 'file' },
  ]);

export const CvFileTooLargeException = () =>
  new BadRequestException([
    { message: 'The CV must be 10 MB or smaller.', path: 'file' },
  ]);

export const CvFileInvalidException = () =>
  new BadRequestException([
    { message: 'The selected file is not a valid PDF.', path: 'file' },
  ]);

export const CvNotFoundException = () =>
  new NotFoundException([{ message: 'CV not found.', path: 'cv' }]);

export const CvAiUnavailableException = () =>
  new ServiceUnavailableException([
    {
      message:
        'The AI CV analysis service is unavailable. Please try again later.',
      path: 'cv',
    },
  ]);

export const CvAnalysisNotFoundException = () =>
  new NotFoundException([
    { message: ProfileMessage.CV_ANALYSIS_NOT_FOUND, path: 'analysisId' },
  ]);

export const CvAnalysisNotPendingException = () =>
  new BadRequestException([
    { message: ProfileMessage.CV_ANALYSIS_NOT_PENDING, path: 'analysisId' },
  ]);

export const CvAnalysisStaleException = () =>
  new BadRequestException([
    { message: ProfileMessage.CV_ANALYSIS_STALE, path: 'analysisId' },
  ]);
