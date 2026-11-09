import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ManageContractMessage } from '@shared/types';

export const ProposalNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.PROPOSAL_NOT_FOUND, path: 'proposalId' },
  ]);

export const ProposalNotHiredException = () =>
  new UnprocessableEntityException([
    {
      message: ManageContractMessage.PROPOSAL_NOT_HIRED,
      path: 'proposalId',
    },
  ]);

export const ProposalNotActionableException = () =>
  new UnprocessableEntityException([
    {
      message: 'Proposal is not in an actionable status for contract creation',
      path: 'proposalId',
    },
  ]);

export const ProposalJobPositionsFilledException = () =>
  new UnprocessableEntityException([
    {
      message: 'All positions for this job have already been filled',
      path: 'proposalId',
    },
  ]);

export const MilestoneAmountMismatchException = () =>
  new UnprocessableEntityException([
    {
      message: 'Total milestone amounts must equal the contract total budget',
      path: 'milestones',
    },
  ]);

export const ContractAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManageContractMessage.CONTRACT_ALREADY_EXISTS_FOR_JOB,
      path: 'proposalId',
    },
  ]);

export const ContractNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.CONTRACT_NOT_FOUND, path: 'id' },
  ]);

export const ContractJobNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.JOB_NOT_FOUND, path: 'proposalId' },
  ]);

export const ContractForbiddenException = () =>
  new ForbiddenException([
    { message: ManageContractMessage.FORBIDDEN, path: 'id' },
  ]);

export const ContractNotPendingSignException = () =>
  new UnprocessableEntityException([
    { message: ManageContractMessage.CONTRACT_NOT_PENDING_SIGN, path: 'id' },
  ]);

export const ContractAwaitingPaymentException = () =>
  new UnprocessableEntityException([
    {
      message:
        'Contract is awaiting initial payment. Client must fund Milestone 1 and 3% platform fee before signing.',
      path: 'id',
    },
  ]);

export const ContractNotActionableForRejectionException = () =>
  new UnprocessableEntityException([
    {
      message:
        'Contract can only be rejected while awaiting payment or pending signature.',
      path: 'id',
    },
  ]);

export const ContractDisputedException = () =>
  new UnprocessableEntityException([
    { message: ManageContractMessage.CONTRACT_DISPUTED, path: 'id' },
  ]);

export const ContractAlreadyCancelledException = () =>
  new UnprocessableEntityException([
    { message: ManageContractMessage.CONTRACT_ALREADY_CANCELLED, path: 'id' },
  ]);
export const ContractAlreadyCompletedException = () =>
  new UnprocessableEntityException([
    { message: ManageContractMessage.CONTRACT_ALREADY_COMPLETED, path: 'id' },
  ]);
export const ContractNotActiveException = () =>
  new UnprocessableEntityException([
    { message: ManageContractMessage.CONTRACT_NOT_ACTIVE, path: 'id' },
  ]);
export const AlreadySignedException = () =>
  new ConflictException([
    { message: ManageContractMessage.ALREADY_SIGNED, path: 'id' },
  ]);

export const FailedToCreateContractException = () =>
  new InternalServerErrorException([
    { message: ManageContractMessage.FAILED_TO_CREATE_CONTRACT, path: '' },
  ]);

export const FailedToUpdateContractException = () =>
  new InternalServerErrorException([
    { message: ManageContractMessage.FAILED_TO_UPDATE_CONTRACT, path: '' },
  ]);

export const FailedToLoadContractException = () =>
  new InternalServerErrorException([
    { message: ManageContractMessage.FAILED_TO_LOAD_CONTRACT, path: '' },
  ]);
