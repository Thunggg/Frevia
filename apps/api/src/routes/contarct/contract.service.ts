import { HttpException, Injectable } from '@nestjs/common';
import { CreateContractBodyType, GetContractsQueryType, UpdateContractTermsBodyType, UploadContractFileBodyType } from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ContractRepository } from './contract.repo';
import {
  AlreadySignedException,
  CannotCancelActiveContractException,
  ContractAlreadyExistsException,
  ContractClientNotFoundException,
  ContractForbiddenException,
  ContractFreelancerNotFoundException,
  ContractJobNotFoundException,
  ContractNotActiveException,
  ContractFileForbiddenException,
  ContractFileNotFoundException,
  ContractNotInPendingSignException,
  ContractNotFoundException,
  FailedToCreateContractException,
  FailedToDeleteContractFileException,
  FailedToLoadContractException,
  FailedToUpdateContractException,
  FailedToUploadContractFileException,
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

  async cancelContract(contractId: number, requestUserId: number) {
    try {
      const contract = await this.contractRepository.findContractById(contractId);
      if (!contract) {
        throw ContractNotFoundException();
      }

      if (contract.clientId !== requestUserId) {
        throw ContractForbiddenException();
      }

      if (contract.status === 'ACTIVE') {
        throw CannotCancelActiveContractException();
      }

      if (contract.status !== 'PENDING_SIGN') {
        throw ContractNotInPendingSignException();
      }

      return await this.contractRepository.cancelContract(contractId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateContractException();
    }
  }

  async getContracts(query: GetContractsQueryType, requestUserId: number) {
    try {
      return await this.contractRepository.findContracts(query, requestUserId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadContractException();
    }
  }

  async getContractDetail(contractId: number, requestUserId: number) {
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

      return contract;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadContractException();
    }
  }

  private async _verifyContractAccess(contractId: number, requestUserId: number) {
    const contract = await this.contractRepository.findContractById(contractId);
    if (!contract) {
      throw ContractNotFoundException();
    }
    const isClient = contract.clientId === requestUserId;
    const isFreelancer = contract.freelancerId === requestUserId;
    if (!isClient && !isFreelancer) {
      throw ContractForbiddenException();
    }
    return contract;
  }

  async getContractFiles(contractId: number, requestUserId: number) {
    try {
      await this._verifyContractAccess(contractId, requestUserId);
      const files = await this.contractRepository.findSharedFiles(contractId);
      return { data: files };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadContractException();
    }
  }

  async uploadContractFile(contractId: number, requestUserId: number, data: UploadContractFileBodyType) {
    try {
      await this._verifyContractAccess(contractId, requestUserId);
      return await this.contractRepository.createSharedFile(contractId, requestUserId, data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUploadContractFileException();
    }
  }

  async deleteContractFile(contractId: number, fileId: number, requestUserId: number) {
    try {
      await this._verifyContractAccess(contractId, requestUserId);
      const file = await this.contractRepository.findSharedFileById(fileId);
      
      if (!file || file.contractId !== contractId) {
        throw ContractFileNotFoundException();
      }

      if (file.uploaderId !== requestUserId) {
        throw ContractFileForbiddenException();
      }

      await this.contractRepository.deleteSharedFile(fileId);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteContractFileException();
    }
  }
}
