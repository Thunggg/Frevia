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

export const DisputeAlreadyFinalizedException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.ALREADY_FINALIZED, path: 'status' },
  ]);

export const FailedToCreateDisputeException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_CREATE_DISPUTE, path: '' },
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

export const ExpertNotActiveException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.EXPERT_NOT_ACTIVE, path: 'userId' },
  ]);

export const ExpertStripeNotReadyException = () =>
  new BadRequestException([
    {
      message: ManageDisputeMessage.EXPERT_STRIPE_NOT_READY,
      path: 'stripeAccountId',
    },
  ]);

export const DisputeFeesNotPaidException = () =>
  new UnprocessableEntityException([
    { message: ManageDisputeMessage.DISPUTE_FEES_NOT_PAID, path: 'fees' },
  ]);

export const DisputeAlreadyClaimedException = () =>
  new UnprocessableEntityException([
    {
      message: ManageDisputeMessage.DISPUTE_ALREADY_CLAIMED,
      path: 'decisionById',
    },
  ]);

export const NotAssignedExpertException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.NOT_ASSIGNED_EXPERT, path: 'userId' },
  ]);

export const CannotArbitrateOwnContractException = () =>
  new ForbiddenException([
    {
      message: ManageDisputeMessage.CANNOT_ARBITRATE_OWN_CONTRACT,
      path: 'userId',
    },
  ]);

export const ExpertNotFoundException = () =>
  new NotFoundException([
    { message: ManageDisputeMessage.EXPERT_NOT_FOUND, path: 'expertId' },
  ]);

export const NegotiationPeriodExpiredException = () =>
  new BadRequestException([
    {
      message: ManageDisputeMessage.NEGOTIATION_PERIOD_EXPIRED,
      path: 'responseDeadline',
    },
  ]);

export const AdminCannotDecideException = () =>
  new ForbiddenException([
    { message: ManageDisputeMessage.ADMIN_CANNOT_DECIDE, path: 'roleName' },
  ]);

export const FailedToAssignExpertException = () =>
  new InternalServerErrorException([
    { message: ManageDisputeMessage.FAILED_TO_ASSIGN_EXPERT, path: '' },
  ]);

export const OfferNotAllowedException = () =>
  new BadRequestException([
    { message: ManageDisputeMessage.OFFER_NOT_ALLOWED, path: 'status' },
  ]);
