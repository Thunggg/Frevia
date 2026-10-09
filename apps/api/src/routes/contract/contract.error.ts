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

export const ProposalNotPendingException = () =>
    new UnprocessableEntityException([
        { message: ManageContractMessage.PROPOSAL_NOT_PENDING, path: 'proposalId' },
    ]);

export const ContractAlreadyExistsException = () =>
    new ConflictException([
        { message: ManageContractMessage.CONTRACT_ALREADY_EXISTS_FOR_JOB, path: 'proposalId' },
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