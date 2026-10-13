import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageProposalMessage } from '@shared/types';

export const ProposalFreelancerOnlyException = () =>
  new ForbiddenException([
    { message: ManageProposalMessage.FREELANCER_ONLY, path: '' },
  ]);

export const ProposalClientOnlyException = () =>
  new ForbiddenException([
    { message: ManageProposalMessage.CLIENT_ONLY, path: '' },
  ]);

export const ProposalJobNotFoundException = () =>
  new NotFoundException([
    { message: ManageProposalMessage.JOB_NOT_FOUND, path: 'jobId' },
  ]);

export const ProposalJobUnavailableException = () =>
  new UnprocessableEntityException([
    { message: ManageProposalMessage.JOB_UNAVAILABLE, path: 'jobId' },
  ]);

export const ProposalJobExpiredException = () =>
  new UnprocessableEntityException([
    { message: ManageProposalMessage.JOB_EXPIRED, path: 'jobId' },
  ]);

export const CannotProposeOwnJobException = () =>
  new ForbiddenException([
    { message: ManageProposalMessage.CANNOT_PROPOSE_OWN_JOB, path: 'jobId' },
  ]);

export const ActiveProposalExistsException = () =>
  new ConflictException([
    { message: ManageProposalMessage.ACTIVE_PROPOSAL_EXISTS, path: 'jobId' },
  ]);

export const ProposalNotFoundException = () =>
  new NotFoundException([
    { message: ManageProposalMessage.PROPOSAL_NOT_FOUND, path: 'id' },
  ]);

export const ProposalForbiddenException = () =>
  new ForbiddenException([
    { message: ManageProposalMessage.FORBIDDEN, path: 'id' },
  ]);

export const ProposalNotDraftException = () =>
  new UnprocessableEntityException([
    { message: ManageProposalMessage.PROPOSAL_NOT_DRAFT, path: 'id' },
  ]);

export const ProposalNotPendingException = () =>
  new UnprocessableEntityException([
    { message: ManageProposalMessage.PROPOSAL_NOT_PENDING, path: 'id' },
  ]);

export const ProposalIncompleteException = () =>
  new UnprocessableEntityException([
    { message: ManageProposalMessage.PROPOSAL_INCOMPLETE, path: '' },
  ]);

export const FailedToCreateProposalException = () =>
  new InternalServerErrorException([
    { message: ManageProposalMessage.FAILED_TO_CREATE, path: '' },
  ]);

export const FailedToUpdateProposalException = () =>
  new InternalServerErrorException([
    { message: ManageProposalMessage.FAILED_TO_UPDATE, path: '' },
  ]);

export const FailedToLoadProposalException = () =>
  new InternalServerErrorException([
    { message: ManageProposalMessage.FAILED_TO_LOAD, path: '' },
  ]);
