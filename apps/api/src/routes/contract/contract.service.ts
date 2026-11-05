import { HttpException, Injectable, Logger } from '@nestjs/common';
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
  MilestoneAmountMismatchException,
  ProposalJobPositionsFilledException,
  ProposalNotActionableException,
  ProposalNotFoundException,
} from './contract.error';
import { ContractStatus, Prisma } from '@prisma/client';
import { ContractPdfService } from '../../shared/services/contract-pdf.service';

const ALLOWED_PROPOSAL_STATUSES = ['SUBMITTED', 'INTERVIEWING', 'HIRED'];

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly contractPdfService: ContractPdfService,
  ) {}

  async createContract(clientId: number, body: CreateContractBodyType) {
    try {
      const proposal = await this.contractRepository.findProposalWithJob(
        body.proposalId,
      );

      if (!proposal) throw ProposalNotFoundException();

      // Cho phép lập hợp đồng khi proposal ở trạng thái SUBMITTED, INTERVIEWING hoặc HIRED
      if (!ALLOWED_PROPOSAL_STATUSES.includes(proposal.status)) {
        throw ProposalNotActionableException();
      }

      if (proposal.job.clientId !== clientId) {
        throw ContractForbiddenException();
      }

      // Kiểm tra xem số lượng vị trí tuyển đã đủ chưa
      if (proposal.job.positionsFilled >= proposal.job.positionsRequired) {
        throw ProposalJobPositionsFilledException();
      }

      // Nếu có danh sách milestone, tổng tiền các milestone phải khớp với tổng tiền hợp đồng
      if (body.milestones && body.milestones.length > 0) {
        const milestonesTotal = body.milestones.reduce(
          (sum, m) => sum + Number(m.amount),
          0,
        );
        if (Math.abs(milestonesTotal - Number(body.totalAmount)) > 0.01) {
          throw MilestoneAmountMismatchException();
        }
      }

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
      const signed = await this.contractRepository.signContract(
        contractId,
        role,
      );

      if (signed.status === ContractStatus.ACTIVE) {
        try {
          await this.contractPdfService.generateAndSaveContractPdf(contractId);
        } catch (pdfErr) {
          this.logger.error(
            `Failed to generate contract PDF on activation for contract #${contractId}:`,
            pdfErr,
          );
        }
      }

      return signed;
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

      return await this.contractRepository.completeContract(
        contractId,
        contract.jobId,
      );
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
      this.logger.error('Failed to get contract list:', error);
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
      this.logger.error(`Failed to get contract detail #${contractId}:`, error);
      this.logger.error(
        `Failed to get contract detail #${contractId}:`,
        error,
      );
      throw FailedToLoadContractException();
    }
  }

  async getContractBySlug(userId: number, roleName: string, slug: string) {
    try {
      const contract = await this.contractRepository.findContractBySlug(slug);

      if (!contract) throw ContractNotFoundException();

      const isAdmin = roleName === RoleName.ADMIN;
      const isOwner =
        contract.clientId === userId || contract.freelancerId === userId;

      if (!isAdmin && !isOwner) throw ContractForbiddenException();

      return contract;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get contract by slug "${slug}":`, error);
      this.logger.error(
        `Failed to get contract by slug "${slug}":`,
        error,
      );
      throw FailedToLoadContractException();
    }
  }
}
