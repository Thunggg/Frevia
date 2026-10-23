import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateProposalBodyType,
  ClientJobProposalsResponseType,
  ClientJobProposalsPageType,
  ClientJobProposalsQueryType,
  ClientProposalDetailType,
  MyProposalsQueryType,
  MyProposalsResponseType,
  ProposalDetailType,
  ProposalType,
  ProposalStatusType,
  RoleName,
  SaveProposalDraftBodyType,
} from '@shared/types';

import {
  ActiveProposalExistsException,
  CannotProposeOwnJobException,
  ProposalClientOnlyException,
  FailedToCreateProposalException,
  FailedToLoadProposalException,
  FailedToUpdateProposalException,
  ProposalForbiddenException,
  ProposalFreelancerOnlyException,
  ProposalJobExpiredException,
  ProposalJobNotFoundException,
  ProposalJobPositionsFilledException,
  ProposalJobUnavailableException,
  ProposalIncompleteException,
  ProposalNotDraftException,
  ProposalNotFoundException,
  ProposalNotSubmittedException,
} from './proposal.error';
import { ProposalRepository } from './proposal.repo';

// Khách hàng còn có thể phỏng vấn / từ chối / tuyển trên các trạng thái này.
const ACTIONABLE_STATUSES: ProposalStatusType[] = ['SUBMITTED', 'INTERVIEWING'];

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
      return await this.proposalRepository.createSubmitted(jobId, userId, body);
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
    await this.assertCanPropose(userId, roleName, proposal.jobId, proposal.id);
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
      await this.expireStaleProposals();
      return await this.proposalRepository.getMyProposals(userId, query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async getMyActiveProposalForJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<ProposalType | null> {
    this.assertFreelancer(roleName);
    try {
      return await this.proposalRepository.findMyActiveProposal(jobId, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async getSubmittedProposalsForClientJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<ClientJobProposalsResponseType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    const job = await this.proposalRepository.findJobForClientProposals(jobId);
    if (!job) throw ProposalJobNotFoundException();
    if (job.deletedAt) throw ProposalJobUnavailableException();
    if (job.clientId !== userId) throw ProposalForbiddenException();

    try {
      await this.expireStaleProposals();
      return await this.proposalRepository.findSubmittedProposalsForClientJob(
        job.id,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async getSubmittedProposalsPageForClientJob(
    userId: number,
    roleName: string,
    jobId: number,
    query: ClientJobProposalsQueryType,
  ): Promise<ClientJobProposalsPageType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    const job = await this.proposalRepository.findJobForClientProposals(jobId);
    if (!job) throw ProposalJobNotFoundException();
    if (job.deletedAt) throw ProposalJobUnavailableException();
    if (job.clientId !== userId) throw ProposalForbiddenException();

    try {
      await this.expireStaleProposals();
      return await this.proposalRepository.findSubmittedProposalsPageForClientJob(
        job.id,
        query,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async getProposalDetailForClient(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ClientProposalDetailType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    try {
      await this.expireStaleProposals();
      const access =
        await this.proposalRepository.findProposalForClientDecision(proposalId);
      if (!access || access.deletedAt) throw ProposalNotFoundException();
      if (!access.job || access.job.deletedAt) {
        throw ProposalJobUnavailableException();
      }
      if (access.job.clientId !== userId) throw ProposalForbiddenException();

      const proposal =
        await this.proposalRepository.findProposalDetailForClient(proposalId);
      if (!proposal) throw ProposalNotFoundException();
      return proposal;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw FailedToLoadProposalException();
    }
  }

  async withdrawProposal(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalType> {
    this.assertFreelancer(roleName);
    await this.expireStaleProposals();
    const proposal = await this.proposalRepository.findProposal(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (proposal.freelancerId !== userId) throw ProposalForbiddenException();
    this.assertActionable(proposal.status);

    try {
      return await this.proposalRepository.withdrawProposal(proposal.id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  // Khách hàng phản hồi và bắt đầu trao đổi/phỏng vấn freelancer.
  async interviewProposal(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    await this.expireStaleProposals();
    const proposal =
      await this.proposalRepository.findProposalForClientDecision(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (!proposal.job || proposal.job.deletedAt) {
      throw ProposalJobUnavailableException();
    }
    if (proposal.job.clientId !== userId) throw ProposalForbiddenException();
    this.assertActionable(proposal.status);

    try {
      return await this.proposalRepository.interviewProposal(proposal.id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  async rejectProposal(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    await this.expireStaleProposals();
    const proposal =
      await this.proposalRepository.findProposalForClientDecision(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (!proposal.job || proposal.job.deletedAt) {
      throw ProposalJobUnavailableException();
    }
    if (proposal.job.clientId !== userId) throw ProposalForbiddenException();
    this.assertActionable(proposal.status);

    try {
      return await this.proposalRepository.rejectProposal(proposal.id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  /**
   * UC-32.06 — Tuyển (hire) một đề xuất.
   *
   * Job SINGLE: nhận 1 người thì các đề xuất còn lại bị REJECTED.
   * Job MULTIPLE: các đề xuất khác giữ nguyên trạng thái; job chỉ đóng khi đủ số vị trí.
   */
  async acceptProposal(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalType> {
    if (roleName !== RoleName.CLIENT) throw ProposalClientOnlyException();

    await this.expireStaleProposals();
    const proposal =
      await this.proposalRepository.findProposalForClientDecision(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (!proposal.job || proposal.job.deletedAt) {
      throw ProposalJobUnavailableException();
    }
    if (proposal.job.clientId !== userId) throw ProposalForbiddenException();
    this.assertActionable(proposal.status);
    if (proposal.job.status !== 'OPEN') throw ProposalJobUnavailableException();
    if (proposal.bidAmount === null) throw ProposalIncompleteException();
    if (proposal.job.positionsFilled >= proposal.job.positionsRequired) {
      throw ProposalJobPositionsFilledException();
    }

    try {
      return await this.proposalRepository.hireProposal({
        proposalId: proposal.id,
        jobId: proposal.job.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
        bidAmount: Number(proposal.bidAmount),
        jobTitle: proposal.job.title,
        hiringType: proposal.job.hiringType,
        positionsRequired: proposal.job.positionsRequired,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateProposalException();
      }
      throw error;
    }
  }

  async getProposalDetail(
    userId: number,
    roleName: string,
    proposalId: number,
  ): Promise<ProposalDetailType> {
    this.assertFreelancer(roleName);
    try {
      await this.expireStaleProposals();
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

  // Chỉ đề xuất đang chờ khách hàng xử lý mới được phỏng vấn/từ chối/tuyển/rút.
  private assertActionable(status: ProposalStatusType): void {
    if (!ACTIONABLE_STATUSES.includes(status)) {
      throw ProposalNotSubmittedException();
    }
  }

  // Đề xuất quá hạn xử lý (khách hàng không hoạt động) được chuyển sang EXPIRED
  // trước khi đọc/quyết định để trạng thái hiển thị luôn đúng.
  private async expireStaleProposals(): Promise<void> {
    await this.proposalRepository.expireOverdueProposals();
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
    if (job.deadline && job.deadline <= new Date()) {
      throw ProposalJobExpiredException();
    }
    if (job.clientId === userId) throw CannotProposeOwnJobException(); // 8

    // 9 — job đã tuyển đủ số vị trí (SINGLE: 1, MULTIPLE: positionsRequired).
    if (job.positionsFilled >= job.positionsRequired) {
      throw ProposalJobPositionsFilledException();
    }

    const activeProposal = await this.proposalRepository.findActiveProposal(
      job.id,
      userId,
      ignoredProposalId,
    );
    if (activeProposal) throw ActiveProposalExistsException(); // 10
  }

  private async getOwnedDraft(userId: number, proposalId: number) {
    const proposal = await this.proposalRepository.findProposal(proposalId);
    if (!proposal || proposal.deletedAt) throw ProposalNotFoundException();
    if (proposal.freelancerId !== userId) throw ProposalForbiddenException();
    if (proposal.status !== 'DRAFT') throw ProposalNotDraftException();
    return proposal;
  }
}
