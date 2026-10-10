import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateContractBodyType,
  GetContractListQueryType,
  RoleName,
  UpdateContractBodyType,
} from '@shared/types';
import { ContractRepository } from './contract.repo';
import {
  AlreadySignedException,
  ContractAlreadyCancelledException,
  ContractAlreadyCompletedException,
  ContractAlreadyExistsException,
  ContractDisputedException,
  ContractForbiddenException,
  ContractNotActiveException,
  ContractNotFoundException,
  ContractNotPendingSignException,
  FailedToCreateContractException,
  FailedToLoadContractException,
  FailedToUpdateContractException,
  ProposalNotFoundException,
  ProposalNotPendingException,
} from './contract.error';
import { ContractStatus, Prisma } from '@prisma/client';

@Injectable()
export class ContractService {
  constructor(private readonly contractRepository: ContractRepository) {}

  async createContract(clientId: number, body: CreateContractBodyType) {
    try {
      const proposal = await this.contractRepository.findProposalWithJob(
        body.proposalId,
      );

      if (!proposal) throw ProposalNotFoundException();
      if (proposal.status !== 'PENDING') throw ProposalNotPendingException();
      if (proposal.job.clientId !== clientId)
        throw ContractForbiddenException();

      const existing = await this.contractRepository.findContractByProposalId(
        body.proposalId,
      );
      if (existing) throw ContractAlreadyExistsException();

      return await this.contractRepository.createContract(
        body,
        clientId,
        proposal.freelancerId,
        proposal.job.id,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw ContractAlreadyExistsException();
      throw FailedToCreateContractException();
    }
  }

  async updateContract(
    clientId: number,
    contractId: number,
    body: UpdateContractBodyType,
  ) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();
      if (contract.clientId !== clientId) throw ContractForbiddenException();
      if (contract.status !== 'PENDING_SIGN')
        throw ContractNotPendingSignException();

      return await this.contractRepository.updateContract(contractId, body);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async signContract(userId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      const isClient = contract.clientId === userId;
      const isFreelancer = contract.freelancerId === userId;
      if (!isClient && !isFreelancer) throw ContractForbiddenException();

      if (contract.status !== 'PENDING_SIGN')
        throw ContractNotPendingSignException();

      if (isClient && contract.signedByClient) throw AlreadySignedException();
      if (isFreelancer && contract.signedByFreelancer)
        throw AlreadySignedException();

      const role = isClient ? 'client' : 'freelancer';
      const alreadySigned = isClient
        ? contract.signedByFreelancer
        : contract.signedByClient;

      return await this.contractRepository.signContract(
        contractId,
        role,
        alreadySigned,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async completeContract(clientId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      if (contract.clientId !== clientId) throw ContractForbiddenException();

      if (contract.status !== 'ACTIVE') throw ContractNotActiveException();

      return await this.contractRepository.completeContract(contractId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async cancelContract(userId: number, contractId: number) {
    try {
      const contract =
        await this.contractRepository.findContractById(contractId);

      if (!contract) throw ContractNotFoundException();

      if (contract.clientId !== userId && contract.freelancerId !== userId)
        throw ContractForbiddenException();
      if (contract.status === ContractStatus.CANCELLED)
        throw ContractAlreadyCancelledException();
      if (contract.status === ContractStatus.COMPLETED)
        throw ContractAlreadyCompletedException();
      if (contract.status === ContractStatus.DISPUTED) {
        throw ContractDisputedException();
      }

      return await this.contractRepository.cancelContract(contractId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToUpdateContractException();
    }
  }

  async getContractList(
    userId: number,
    roleName: string,
    query: GetContractListQueryType,
  ) {
    try {
      const isAdmin = roleName === RoleName.ADMIN;
      const isClient = roleName === RoleName.CLIENT;
      const isFreelancer = roleName === RoleName.FREELANCER;

      const filter = isAdmin
        ? {}
        : isClient
          ? { userId, role: 'client' as const }
          : isFreelancer
            ? { userId, role: 'freelancer' as const }
            : { userId, role: 'client' as const };

      return await this.contractRepository.getContractList(query, filter);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadContractException();
    }
  }

  async getContractDetail(
    userId: number,
    roleName: string,
    contractId: number,
  ) {
    try {
      const contract =
        await this.contractRepository.getContractDetail(contractId);

      if (!contract) throw ContractNotFoundException();

      const isAdmin = roleName === RoleName.ADMIN;
      const isOwner =
        contract.clientId === userId || contract.freelancerId === userId;

      if (!isAdmin && !isOwner) throw ContractForbiddenException();

      return contract;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadContractException();
    }
  }
}
