import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageDisputeMessage } from '@shared/types';

export const ExpertDisputeNotFoundException = () =>
  new NotFoundException([
    { message: ManageDisputeMessage.DISPUTE_NOT_FOUND, path: 'id' },
  ]);

export const ExpertDisputeForbiddenException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.FORBIDDEN, path: 'id' },
  ]);

export const ExpertDisputeInvalidSplitAmountException = () =>
  new BadRequestException([
    {
      message: ManageDisputeMessage.INVALID_SPLIT_AMOUNT,
      path: 'freelancerAmount',
    },
  ]);

export const ExpertDisputeDecisionNotPendingException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.DECISION_NOT_PENDING, path: 'status' },
  ]);

export const ExpertDisputeAlreadyFinalizedException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.ALREADY_FINALIZED, path: 'status' },
  ]);

export const FailedToLoadExpertDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_LOAD_DISPUTE, path: '' },
  ]);

export const FailedToMakeExpertDisputeDecisionException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_MAKE_DECISION, path: '' },
  ]);

export const FailedToFinalizeExpertDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_FINALIZE_DISPUTE, path: '' },
  ]);
