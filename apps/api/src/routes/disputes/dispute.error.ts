import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageDisputeMessage } from '@shared/types';

export const DisputeNotFoundException = () =>
  new NotFoundException([
    { message: ManageDisputeMessage.DISPUTE_NOT_FOUND, path: 'id' },
  ]);

export const DisputeMilestoneNotFoundException = () =>
  new NotFoundException([
    { message: ManageDisputeMessage.MILESTONE_NOT_FOUND, path: 'milestoneId' },
  ]);

export const DisputeNotContractParticipantException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.NOT_CONTRACT_PARTICIPANT, path: 'userId' },
  ]);

export const DisputeForbiddenException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.FORBIDDEN, path: 'id' },
  ]);

export const MilestoneAlreadyDisputedException = () =>
  new UnprocessableEntityException([
    {
      message: ManageDisputeMessage.MILESTONE_ALREADY_DISPUTED,
      path: 'milestoneId',
    },
  ]);

export const MilestoneCannotBeDisputedException = () =>
  new UnprocessableEntityException([
    {
      message: ManageDisputeMessage.MILESTONE_CANNOT_BE_DISPUTED,
      path: 'milestoneId',
    },
  ]);

export const DisputeFeeNotFoundException = () =>
  new NotFoundException([
    { message: ManageDisputeMessage.FEE_NOT_FOUND, path: 'disputeId' },
  ]);

export const DisputeFeeAlreadyPaidException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.FEE_ALREADY_PAID, path: 'disputeId' },
  ]);

export const DisputeResponseAlreadySubmittedException = () =>
  new UnprocessableEntityException([
    {
      message: ManageDisputeMessage.RESPONSE_ALREADY_SUBMITTED,
      path: 'disputeId',
    },
  ]);

export const DisputeResponseNotAllowedException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.RESPONSE_NOT_ALLOWED, path: 'status' },
  ]);

export const DisputeEvidenceLimitExceededException = () =>
  new BadRequestException([
    {
      message: ManageDisputeMessage.EVIDENCE_LIMIT_EXCEEDED,
      path: 'evidenceFiles',
    },
  ]);

export const DisputeInvalidSplitAmountException = () =>
  new BadRequestException([
    {
      message: ManageDisputeMessage.INVALID_SPLIT_AMOUNT,
      path: 'freelancerAmount',
    },
  ]);

export const DisputeDecisionNotPendingException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.DECISION_NOT_PENDING, path: 'status' },
  ]);

export const DisputeReviewAlreadySubmittedException = () =>
  new UnprocessableEntityException([
    {
      message: ManageDisputeMessage.REVIEW_ALREADY_SUBMITTED,
      path: 'disputeId',
    },
  ]);

export const DisputeReviewReasonRequiredException = () =>
  new BadRequestException([
    { message: ManageDisputeMessage.REVIEW_REASON_REQUIRED, path: 'reason' },
  ]);

export const DisputeAlreadyFinalizedException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.ALREADY_FINALIZED, path: 'status' },
  ]);

export const FailedToCreateDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_CREATE_DISPUTE, path: '' },
  ]);

export const FailedToPayDisputeFeeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_PAY_FEE, path: '' },
  ]);

export const FailedToSubmitDisputeResponseException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_SUBMIT_RESPONSE, path: '' },
  ]);

export const FailedToLoadDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_LOAD_DISPUTE, path: '' },
  ]);

export const FailedToMakeDisputeDecisionException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_MAKE_DECISION, path: '' },
  ]);

export const FailedToSubmitDisputeReviewException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_SUBMIT_REVIEW, path: '' },
  ]);

export const FailedToFinalizeDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_FINALIZE_DISPUTE, path: '' },
  ]);
