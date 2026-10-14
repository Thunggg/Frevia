import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageMilestoneFileMessage } from '@shared/types';

export const MilestoneFileNotFoundException = () =>
  new NotFoundException([
    { message: ManageMilestoneFileMessage.FILE_NOT_FOUND, path: 'fileId' },
  ]);

export const MilestoneFileMilestoneNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageMilestoneFileMessage.MILESTONE_NOT_FOUND,
      path: 'milestoneId',
    },
  ]);

export const MilestoneFileContractNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageMilestoneFileMessage.CONTRACT_NOT_FOUND,
      path: 'contractId',
    },
  ]);

export const MilestoneFileForbiddenException = () =>
  new ForbiddenException([
    { message: ManageMilestoneFileMessage.FORBIDDEN, path: 'fileId' },
  ]);

export const MilestoneFileRequiredException = () =>
  new UnprocessableEntityException([
    { message: ManageMilestoneFileMessage.FILE_REQUIRED, path: 'file' },
  ]);

export const FailedToUploadMilestoneFileException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneFileMessage.FAILED_TO_UPLOAD, path: '' },
  ]);

export const FailedToLoadMilestoneFilesException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneFileMessage.FAILED_TO_LOAD, path: '' },
  ]);

export const FailedToDeleteMilestoneFileException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneFileMessage.FAILED_TO_DELETE, path: '' },
  ]);
