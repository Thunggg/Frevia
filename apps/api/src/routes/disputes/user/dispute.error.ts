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

export const DisputeInvalidDueDateException = (
  message = 'A valid future due date is required for deadline extension.',
) =>
  new BadRequestException([
    {
      message,
      path: 'proposedDueDate',
    },
  ]);

export const DisputeDeclineReasonRequiredException = () =>
  new BadRequestException([
    {
      message:
        'Please provide a reason (at least 5 characters) when declining.',
      path: 'reason',
    },
  ]);

export const DisputeWithdrawNotAllowedException = () =>
  new UnprocessableEntityException([
    {
      message:
        'Only the requester can withdraw a resolution ticket before it is escalated or finalized.',
      path: 'status',
    },
  ]);

export const DisputeEscalateNotAllowedException = () =>
  new UnprocessableEntityException([
    {
      message:
        'You can only escalate to an Expert after the counterparty declines or the 48-hour response deadline has passed.',
      path: 'status',
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

export const FailedToCreateDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_CREATE_DISPUTE, path: '' },
  ]);

export const FailedToSubmitDisputeResponseException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_SUBMIT_RESPONSE, path: '' },
  ]);

export const FailedToWithdrawDisputeException = () =>
  new InternalServerErrorException([
    { message: 'Failed to withdraw resolution request.', path: '' },
  ]);

export const FailedToEscalateDisputeException = () =>
  new InternalServerErrorException([
    { message: 'Failed to escalate dispute to expert.', path: '' },
  ]);

export const FailedToLoadDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_LOAD_DISPUTE, path: '' },
  ]);

export const FailedToSubmitDisputeReviewException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_SUBMIT_REVIEW, path: '' },
  ]);
