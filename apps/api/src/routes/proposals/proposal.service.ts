import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateProposalBodyType,
  MyProposalsQueryType,
  MyProposalsResponseType,
  ProposalDetailType,
  ProposalType,
  RoleName,
  SaveProposalDraftBodyType,
} from '@shared/types';

import {
  ActiveProposalExistsException,
  CannotProposeOwnJobException,
  FailedToCreateProposalException,
  FailedToLoadProposalException,
  FailedToUpdateProposalException,
  ProposalForbiddenException,
  ProposalFreelancerOnlyException,
  ProposalJobExpiredException,
  ProposalJobNotFoundException,
  ProposalJobUnavailableException,
  ProposalIncompleteException,
  ProposalNotDraftException,
  ProposalNotFoundException,
} from './proposal.error';
import { ProposalRepository } from './proposal.repo';

@Injectable()
export class ProposalService {
  constructor(private readonly proposalRepository: ProposalRepository) {}

  async createProposal(
    userId: number,
    roleName: string,
    jobId: number,
    body: CreateProposalBodyType,
  ): Promise<ProposalType> {
    await this.assertCanPropose(userId, roleName, jobId);
    try {
      return await this.proposalRepository.createPending(jobId, userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateProposalException();
      }
      throw error;
    }
  }

  async saveDraft(
    userId: number,
    roleName: string,
    jobId: number,
    body: SaveProposalDraftBodyType,
  ): Promise<ProposalType> {
    await this.assertCanPropose(userId, roleName, jobId);
    try {
      return await this.proposalRepository.createDraft(jobId, userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateProposalException();
      }
      throw error;
    }
  }

  async updateDraft(
    userId: number,
    roleName: string,
    proposalId: number,
    body: SaveProposalDraftBodyType,
  ): Promise<ProposalType> {
    this.assertFreelancer(roleName);
    const proposal = await this.getOwnedDraft(userId, proposalId);
    try {
      return await this.proposalRepository.updateDraft(proposal.id, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  async submitDraft(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalType> {
    this.assertFreelancer(roleName);
    const proposal = await this.getOwnedDraft(userId, proposalId);

    // Re-check eligibility at submission time; a job may have changed since draft was saved.
    await this.assertCanPropose(userId, roleName, proposal.jobId, proposal.id);

    if (
      !proposal.coverLetter ||
      !proposal.coverLetter.trim() ||
      !proposal.bidAmount ||
      Number(proposal.bidAmount) <= 0 ||
      !proposal.deliveryDays ||
      proposal.deliveryDays <= 0
    ) {
      throw ProposalIncompleteException();
    }

    try {
      return await this.proposalRepository.submitDraft(proposal.id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  async getMyProposals(
    userId: number,
    roleName: string,
    query: MyProposalsQueryType,
  ): Promise<MyProposalsResponseType> {
    this.assertFreelancer(roleName);
    try {
      return await this.proposalRepository.getMyProposals(userId, query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async getProposalDetail(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalDetailType> {
    this.assertFreelancer(roleName);
    try {
      const proposal =
        await this.proposalRepository.getProposalDetail(proposalId);
      if (!proposal) throw ProposalNotFoundException();
      if (proposal.freelancerId !== userId) throw ProposalForbiddenException();
      return proposal;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  private assertFreelancer(roleName: string): void {
    if (roleName !== RoleName.FREELANCER)
      throw ProposalFreelancerOnlyException();
  }

  private async assertCanPropose(
    userId: number,
    roleName: string,
    jobId: number,
    ignoredProposalId?: number,
  ): Promise<void> {
    // 1 is guaranteed by the global AuthGuard before the controller is reached.
    this.assertFreelancer(roleName); // 2

    const job = await this.proposalRepository.findJobForProposal(jobId); // 3
    if (!job) throw ProposalJobNotFoundException();
    if (job.deletedAt) throw ProposalJobUnavailableException(); // 4
    if (job.client.isBanned || job.client.deletedAt) {
      throw ProposalJobUnavailableException(); // 5
    }
    if (job.status !== 'OPEN') throw ProposalJobUnavailableException(); // 6
    if (job.expiryDate && job.expiryDate <= new Date()) {
      throw ProposalJobExpiredException(); // 7
    }
    if (job.clientId === userId) throw CannotProposeOwnJobException(); // 8

    const activeProposal = await this.proposalRepository.findActiveProposal(
      job.id,
      userId,
      ignoredProposalId,
    );
    if (activeProposal) throw ActiveProposalExistsException(); // 9
  }

  private async getOwnedDraft(userId: number, proposalId: number) {
    const proposal = await this.proposalRepository.findProposal(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (proposal.freelancerId !== userId) throw ProposalForbiddenException();
    if (proposal.status !== 'DRAFT') throw ProposalNotDraftException();
    return proposal;
  }
}
