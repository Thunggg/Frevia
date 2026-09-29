import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageContractMessage } from '@shared/types';

export const ContractAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManageContractMessage.CONTRACT_ALREADY_EXISTS_FOR_JOB,
      path: 'jobId',
    },
  ]);

export const ContractNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.CONTRACT_NOT_FOUND, path: 'id' },
  ]);

export const ContractJobNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.JOB_NOT_FOUND, path: 'jobId' },
  ]);

export const ContractClientNotFoundException = () =>
  new NotFoundException([
    { message: ManageContractMessage.CLIENT_NOT_FOUND, path: 'clientId' },
  ]);

export const ContractFreelancerNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageContractMessage.FREELANCER_NOT_FOUND,
      path: 'freelancerId',
    },
  ]);

export const ContractForbiddenException = () =>
  new ForbiddenException([
    { message: ManageContractMessage.FORBIDDEN, path: 'clientId' },
  ]);

export const FailedToCreateContractException = () =>
  new InternalServerErrorException([
    { message: ManageContractMessage.FAILED_TO_CREATE_CONTRACT, path: '' },
  ]);

export const FailedToLoadContractException = () =>
  new InternalServerErrorException([
    { message: ManageContractMessage.FAILED_TO_LOAD_CONTRACT, path: '' },
  ]);
