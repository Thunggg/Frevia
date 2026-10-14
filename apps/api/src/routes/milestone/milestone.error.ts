import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageMilestoneMessage } from '@shared/types';

export const MilestoneNotFoundException = () =>
  new NotFoundException([
    { message: ManageMilestoneMessage.MILESTONE_NOT_FOUND, path: 'id' },
  ]);

export const MilestoneContractNotFoundException = () =>
  new NotFoundException([
    { message: ManageMilestoneMessage.CONTRACT_NOT_FOUND, path: 'contractId' },
  ]);

export const MilestoneForbiddenException = () =>
  new ForbiddenException([
    { message: ManageMilestoneMessage.FORBIDDEN, path: 'id' },
  ]);

export const MilestoneContractNotActiveException = () =>
  new UnprocessableEntityException([
    { message: ManageMilestoneMessage.CONTRACT_NOT_ACTIVE, path: 'contractId' },
  ]);

export const MilestoneAmountExceedsContractException = () =>
  new UnprocessableEntityException([
    {
      message: ManageMilestoneMessage.MILESTONE_AMOUNT_EXCEEDS_CONTRACT,
      path: 'amount',
    },
  ]);

export const MilestoneCannotBeEditedException = () =>
  new UnprocessableEntityException([
    { message: ManageMilestoneMessage.MILESTONE_CANNOT_BE_EDITED, path: 'id' },
  ]);

export const MilestoneCannotBeDeletedException = () =>
  new UnprocessableEntityException([
    { message: ManageMilestoneMessage.MILESTONE_CANNOT_BE_DELETED, path: 'id' },
  ]);

export const FailedToCreateMilestoneException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneMessage.FAILED_TO_CREATE_MILESTONE, path: '' },
  ]);

export const FailedToUpdateMilestoneException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneMessage.FAILED_TO_UPDATE_MILESTONE, path: '' },
  ]);

export const FailedToDeleteMilestoneException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneMessage.FAILED_TO_DELETE_MILESTONE, path: '' },
  ]);

export const FailedToLoadMilestoneException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneMessage.FAILED_TO_LOAD_MILESTONE, path: '' },
  ]);

export const FailedToProgressMilestoneException = () =>
  new InternalServerErrorException([
    { message: ManageMilestoneMessage.FAILED_TO_PROGRESS_MILESTONE, path: '' },
  ]);

export const MilestonePaymentStatusException = () =>
  new UnprocessableEntityException([
    { message: ManageMilestoneMessage.MILESTONE_NOT_FUNDED, path: 'id' },
  ]);

export const MilestoneAlreadyInProgressException = () =>
  new UnprocessableEntityException([
    {
      message: ManageMilestoneMessage.MILESTONE_ALREADY_IN_PROGRESS,
      path: 'id',
    },
  ]);
