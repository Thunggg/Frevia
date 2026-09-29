import { HttpException, Injectable } from '@nestjs/common';
import { CreateContractBodyType, UpdateContractTermsBodyType } from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ContractRepository } from './contract.repo';
import {
  AlreadySignedException,
  ContractAlreadyExistsException,
  ContractClientNotFoundException,
  ContractForbiddenException,
  ContractFreelancerNotFoundException,
  ContractJobNotFoundException,
  ContractNotActiveException,
  ContractNotInPendingSignException,
  ContractNotFoundException,
  FailedToCreateContractException,
  FailedToUpdateContractException,
  TermsLockedException,
} from './contract.error';

@Injectable()
export class ContractService {
  constructor(private readonly contractRepository: ContractRepository) { }

  async createContract(
    requestUserId: number,
    body: CreateContractBodyType,
  ) {
    try {
      if (requestUserId !== body.clientId) {
        throw ContractForbiddenException();
      }

      const job = await this.contractRepository.findJobById(body.jobId);
      if (!job) {
        throw ContractJobNotFoundException();
      }

      const client = await this.contractRepository.findUserById(body.clientId);
      if (!client) {
        throw ContractClientNotFoundException();
      }

      const freelancer = await this.contractRepository.findUserById(body.freelancerId);
      if (!freelancer) {
        throw ContractFreelancerNotFoundException();
      }

      const existing = await this.contractRepository.findContractByJobId(body.jobId);
      if (existing) {
        throw ContractAlreadyExistsException();
      }

      return await this.contractRepository.createContract(body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ContractAlreadyExistsException();
      }
      throw FailedToCreateContractException();
    }
  }

  async updateContractTerms(
    contractId: number,
    requestUserId: number,
    body: UpdateContractTermsBodyType,
  ) {
    try {
      const contract = await this.contractRepository.findContractById(contractId);
      if (!contract) {
        throw ContractNotFoundException();
      }

      if (contract.clientId !== requestUserId) {
        throw ContractForbiddenException();
      }

      if (contract.status !== 'PENDING_SIGN') {
        throw ContractNotInPendingSignException();
      }

      if (contract.signedByClient) {
        throw TermsLockedException();
      }

      const resetFreelancerSignature = contract.signedByFreelancer === true;

      return await this.contractRepository.updateContractTerms(
        contractId,
        body,
        resetFreelancerSignature,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateContractException();
    }
  }

  async completeContract(contractId: number, requestUserId: number) {
    try {
      const contract = await this.contractRepository.findContractById(contractId);
      if (!contract) {
        throw ContractNotFoundException();
      }

      if (contract.clientId !== requestUserId) {
        throw ContractForbiddenException();
      }

      if (contract.status !== 'ACTIVE') {
        throw ContractNotActiveException();
      }

      return await this.contractRepository.completeContract(contractId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateContractException();
    }
  }

  async signContract(contractId: number, requestUserId: number) {
    try {
      const contract = await this.contractRepository.findContractById(contractId);
      if (!contract) {
        throw ContractNotFoundException();
      }

      const isClient = contract.clientId === requestUserId;
      const isFreelancer = contract.freelancerId === requestUserId;

      if (!isClient && !isFreelancer) {
        throw ContractForbiddenException();
      }

      if (contract.status !== 'PENDING_SIGN') {
        throw ContractNotInPendingSignException();
      }

      if (isClient && contract.signedByClient) {
        throw AlreadySignedException();
      }

      if (isFreelancer && contract.signedByFreelancer) {
        throw AlreadySignedException();
      }

      let updatedContract = isClient
        ? await this.contractRepository.signContractAsClient(contractId)
        : await this.contractRepository.signContractAsFreelancer(contractId);

      const bothSigned =
        (isClient ? true : contract.signedByClient) &&
        (isFreelancer ? true : contract.signedByFreelancer);

      if (bothSigned) {
        updatedContract = await this.contractRepository.activateContract(contractId);
      }

      return updatedContract;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateContractException();
    }
  }
}
