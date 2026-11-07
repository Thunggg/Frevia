import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ProposalRepository } from './proposal.repo';
import { ProposalService } from './proposal.service';

describe('ProposalService (UC-32)', () => {
  const repository = {
    findJobForProposal: jest.fn(),
    findJobForClientProposals: jest.fn(),
    findFreelancerStatus: jest.fn(),
    countProposalsByFreelancerAndJob: jest.fn(),
    cancelPendingProposalsForJob: jest.fn(),
    findActiveProposal: jest.fn(),
    findMyActiveProposal: jest.fn(),
    findProposal: jest.fn(),
    findProposalForClientDecision: jest.fn(),
    createSubmitted: jest.fn(),
    createDraft: jest.fn(),
    updateDraft: jest.fn(),
    submitDraft: jest.fn(),
    withdrawProposal: jest.fn(),
    interviewProposal: jest.fn(),
    rejectProposal: jest.fn(),
    hireProposal: jest.fn(),
    getMyProposals: jest.fn(),
    getProposalDetail: jest.fn(),
    findSubmittedProposalsForClientJob: jest.fn(),
    findSubmittedProposalsPageForClientJob: jest.fn(),
    findProposalDetailForClient: jest.fn(),
    expireOverdueProposals: jest.fn().mockResolvedValue(0),
  };

  const service = new ProposalService(
    repository as unknown as ProposalRepository,
  );

  const mockJob = {
    id: 10,
    clientId: 99,
    status: 'OPEN',
    budgetMin: 100,
    budgetMax: 1000,
    deadline: null,
    expiryDate: new Date(Date.now() + 86400000), // ngày mai
    deletedAt: null,
    hiringType: 'SINGLE' as const,
    positionsRequired: 1,
    positionsFilled: 0,
    client: { isBanned: false, deletedAt: null },
  };

  const mockProposal = {
    id: 1,
    jobId: 10,
    freelancerId: 12,
    coverLetter: 'I am a skilled developer with 5+ years experience.',
    bidAmount: 500,
    deliveryDays: 7,
    status: 'SUBMITTED' as const,
    createdAt: new Date(),
    submittedAt: new Date(),
    acceptedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    expiresAt: new Date(Date.now() + 86400000 * 30),
    updatedAt: new Date(),
  };

  const mockDraftProposal = {
    ...mockProposal,
    id: 2,
    status: 'DRAFT' as const,
    submittedAt: null,
    expiresAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findJobForProposal.mockResolvedValue(mockJob);
    repository.findJobForClientProposals.mockResolvedValue(mockJob);
    repository.findFreelancerStatus.mockResolvedValue({
      isBanned: false,
      deletedAt: null,
    });
    repository.countProposalsByFreelancerAndJob.mockResolvedValue(0);
    repository.cancelPendingProposalsForJob.mockResolvedValue(0);
    repository.findActiveProposal.mockResolvedValue(null);
    repository.expireOverdueProposals.mockResolvedValue(0);
  });

  // ==========================================
  // UC-32.01: View My Proposal List
  // ==========================================
  describe('UC-32.01: View My Proposal List', () => {
    it('throws ForbiddenException if user is not a freelancer', async () => {
      await expect(
        service.getMyProposals(12, RoleName.CLIENT, { page: 1, limit: 10 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns paginated list of proposals for freelancer', async () => {
      const mockResult = {
        data: [{ ...mockProposal, job: mockJob, client: { id: 99 } }],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      };
      repository.getMyProposals.mockResolvedValue(mockResult);

      const result = await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
      });

      expect(repository.expireOverdueProposals).toHaveBeenCalled();
      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  // ==========================================
  // UC-32.02: View My Proposal Detail
  // ==========================================
  describe('UC-32.02: View My Proposal Detail', () => {
    it('throws ForbiddenException if user is not a freelancer', async () => {
      await expect(
        service.getProposalDetail(12, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException if proposal does not exist', async () => {
      repository.getProposalDetail.mockResolvedValue(null);

      await expect(
        service.getProposalDetail(12, RoleName.FREELANCER, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if proposal belongs to another freelancer', async () => {
      repository.getProposalDetail.mockResolvedValue({
        ...mockProposal,
        freelancerId: 999,
      });

      await expect(
        service.getProposalDetail(12, RoleName.FREELANCER, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns proposal detail when valid', async () => {
      const detail = { ...mockProposal, job: mockJob, client: { id: 99 } };
      repository.getProposalDetail.mockResolvedValue(detail);

      const result = await service.getProposalDetail(
        12,
        RoleName.FREELANCER,
        1,
      );
      expect(result).toEqual(detail);
    });
  });

  // ==========================================
  // UC-32.03: Submit Proposal
  // ==========================================
  describe('UC-32.03: Submit Proposal', () => {
    const validBody = {
      coverLetter: 'I will complete this project with highest quality.',
      bidAmount: 800,
      deliveryDays: 14,
    };

    it('throws ForbiddenException if user is not freelancer', async () => {
      await expect(
        service.createProposal(12, RoleName.CLIENT, 10, validBody),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException if job does not exist', async () => {
      repository.findJobForProposal.mockResolvedValue(null);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 999, validBody),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if freelancer tries to propose to own job (BR-PR02)', async () => {
      repository.findJobForProposal.mockResolvedValue({
        ...mockJob,
        clientId: 12, // trùng với user
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws UnprocessableEntityException if job is not OPEN (BR-PR03)', async () => {
      repository.findJobForProposal.mockResolvedValue({
        ...mockJob,
        status: 'CLOSED',
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException if job is expired (BR-PR03)', async () => {
      repository.findJobForProposal.mockResolvedValue({
        ...mockJob,
        expiryDate: new Date(Date.now() - 10000), // đã quá hạn
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException if job positions are already filled (BR-PR03)', async () => {
      repository.findJobForProposal.mockResolvedValue({
        ...mockJob,
        positionsRequired: 1,
        positionsFilled: 1,
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws ConflictException if freelancer already has an active proposal (BR-PR04)', async () => {
      repository.findActiveProposal.mockResolvedValue(mockProposal);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ForbiddenException if freelancer is banned (BR-PR11)', async () => {
      repository.findFreelancerStatus.mockResolvedValue({
        isBanned: true,
        deletedAt: null,
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException if freelancer exceeds 3 submissions for the same job (BR-PR13)', async () => {
      repository.countProposalsByFreelancerAndJob.mockResolvedValue(3);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, validBody),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws UnprocessableEntityException if bidAmount is below $5 (BR-PR15)', async () => {
      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          ...validBody,
          bidAmount: 4,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException if bidAmount is extreme compared to budget (BR-PR15)', async () => {
      // Job budgetMin = 100, budgetMax = 1000
      // Bid < budgetMin / 10 (< 10)
      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          ...validBody,
          bidAmount: 8,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);

      // Bid > budgetMax * 10 (> 10000)
      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          ...validBody,
          bidAmount: 15000,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('creates and returns submitted proposal when valid', async () => {
      repository.createSubmitted.mockResolvedValue(mockProposal);

      const result = await service.createProposal(
        12,
        RoleName.FREELANCER,
        10,
        validBody,
      );

      expect(repository.createSubmitted).toHaveBeenCalledWith(
        10,
        12,
        validBody,
      );
      expect(result).toEqual(mockProposal);
    });

    it('submits a saved draft successfully', async () => {
      repository.findProposal.mockResolvedValue(mockDraftProposal);
      repository.submitDraft.mockResolvedValue(mockProposal);

      const result = await service.submitDraft(12, RoleName.FREELANCER, 2);

      expect(repository.submitDraft).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockProposal);
    });

    it('throws UnprocessableEntityException when submitting an incomplete draft', async () => {
      repository.findProposal.mockResolvedValue({
        ...mockDraftProposal,
        coverLetter: null,
      });

      await expect(
        service.submitDraft(12, RoleName.FREELANCER, 2),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  // ==========================================
  // UC-32.04: Update Proposal
  // ==========================================
  describe('UC-32.04: Update Proposal', () => {
    it('updates a draft proposal successfully', async () => {
      repository.findProposal.mockResolvedValue(mockDraftProposal);
      const updateData = { bidAmount: 600, deliveryDays: 10 };
      repository.updateDraft.mockResolvedValue({
        ...mockDraftProposal,
        ...updateData,
      });

      const result = await service.updateDraft(
        12,
        RoleName.FREELANCER,
        2,
        updateData,
      );

      expect(repository.updateDraft).toHaveBeenCalledWith(2, updateData);
      expect(result.bidAmount).toBe(600);
    });

    it('updates a submitted proposal via updateProposal', async () => {
      repository.findProposal.mockResolvedValue(mockProposal);
      const updateData = { bidAmount: 550 };
      repository.updateDraft.mockResolvedValue({
        ...mockProposal,
        bidAmount: 550,
      });

      const result = await service.updateProposal(
        12,
        RoleName.FREELANCER,
        1,
        updateData,
      );

      expect(repository.updateDraft).toHaveBeenCalledWith(1, updateData);
      expect(result.bidAmount).toBe(550);
    });

    it('throws UnprocessableEntityException when updating a non-actionable proposal', async () => {
      repository.findProposal.mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
      });

      await expect(
        service.updateProposal(12, RoleName.FREELANCER, 1, { bidAmount: 550 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  // ==========================================
  // UC-32.05: Withdraw Proposal
  // ==========================================
  describe('UC-32.05: Withdraw Proposal', () => {
    it('throws ForbiddenException if user is not freelancer', async () => {
      await expect(
        service.withdrawProposal(12, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws UnprocessableEntityException if proposal is not actionable (e.g. already REJECTED)', async () => {
      repository.findProposal.mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
      });

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('withdraws proposal successfully when in SUBMITTED state', async () => {
      repository.findProposal.mockResolvedValue(mockProposal);
      repository.withdrawProposal.mockResolvedValue({
        ...mockProposal,
        status: 'WITHDRAWN',
      });

      const result = await service.withdrawProposal(12, RoleName.FREELANCER, 1);

      expect(repository.withdrawProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('WITHDRAWN');
    });
  });

  // ==========================================
  // UC-32.06: Accept Proposal (Client)
  // ==========================================
  describe('UC-32.06: Accept Proposal', () => {
    const proposalForDecision = {
      ...mockProposal,
      job: {
        id: 10,
        clientId: 99,
        title: 'Build API',
        status: 'OPEN',
        hiringType: 'SINGLE' as const,
        positionsRequired: 1,
        positionsFilled: 0,
        deletedAt: null,
      },
    };

    it('throws ForbiddenException if user is not a client', async () => {
      await expect(
        service.acceptProposal(99, RoleName.FREELANCER, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException if client is not the job owner', async () => {
      repository.findProposalForClientDecision.mockResolvedValue({
        ...proposalForDecision,
        job: { ...proposalForDecision.job, clientId: 100 }, // different client
      });

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws UnprocessableEntityException if proposal is already processed (e.g. WITHDRAWN)', async () => {
      repository.findProposalForClientDecision.mockResolvedValue({
        ...proposalForDecision,
        status: 'WITHDRAWN',
      });

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('hires proposal successfully and creates contract (BR-PR07)', async () => {
      repository.findProposalForClientDecision.mockResolvedValue(
        proposalForDecision,
      );
      repository.hireProposal.mockResolvedValue({
        ...mockProposal,
        status: 'HIRED',
        acceptedAt: new Date(),
      });

      const result = await service.acceptProposal(99, RoleName.CLIENT, 1);

      expect(repository.hireProposal).toHaveBeenCalledWith({
        proposalId: 1,
        jobId: 10,
        clientId: 99,
        freelancerId: 12,
        bidAmount: 500,
        jobTitle: 'Build API',
        hiringType: 'SINGLE',
        positionsRequired: 1,
      });
      expect(result.status).toBe('HIRED');
    });
  });

  // ==========================================
  // UC-32.07: Reject Proposal (Client)
  // ==========================================
  describe('UC-32.07: Reject Proposal', () => {
    const proposalForDecision = {
      ...mockProposal,
      job: {
        id: 10,
        clientId: 99,
        title: 'Build API',
        status: 'OPEN',
        deletedAt: null,
      },
    };

    it('throws ForbiddenException if user is not client', async () => {
      await expect(
        service.rejectProposal(99, RoleName.FREELANCER, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects proposal successfully when in SUBMITTED state', async () => {
      repository.findProposalForClientDecision.mockResolvedValue(
        proposalForDecision,
      );
      repository.rejectProposal.mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
        rejectedAt: new Date(),
      });

      const result = await service.rejectProposal(99, RoleName.CLIENT, 1);

      expect(repository.rejectProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('REJECTED');
    });
  });

  // ==========================================
  // UC-32.08: View Job Proposal List (Client)
  // ==========================================
  describe('UC-32.08: View Job Proposal List', () => {
    it('throws ForbiddenException if user is not client', async () => {
      await expect(
        service.getSubmittedProposalsPageForClientJob(
          99,
          RoleName.FREELANCER,
          10,
          { page: 1, limit: 10 },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException if client does not own the job', async () => {
      repository.findJobForClientProposals.mockResolvedValue({
        ...mockJob,
        clientId: 100, // other client
      });

      await expect(
        service.getSubmittedProposalsPageForClientJob(99, RoleName.CLIENT, 10, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns paginated submitted proposals for client job', async () => {
      const mockPage = {
        data: [{ ...mockProposal, freelancer: { id: 12, email: 'f@f.com' } }],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      };
      repository.findSubmittedProposalsPageForClientJob.mockResolvedValue(
        mockPage,
      );

      const result = await service.getSubmittedProposalsPageForClientJob(
        99,
        RoleName.CLIENT,
        10,
        { page: 1, limit: 10 },
      );

      expect(repository.expireOverdueProposals).toHaveBeenCalled();
      expect(
        repository.findSubmittedProposalsPageForClientJob,
      ).toHaveBeenCalledWith(10, { page: 1, limit: 10 });
      expect(result).toEqual(mockPage);
    });

    it('cancels pending proposals if job is CANCELLED (BR-PR14)', async () => {
      repository.findJobForClientProposals.mockResolvedValue({
        ...mockJob,
        status: 'CANCELLED',
      });
      repository.findSubmittedProposalsPageForClientJob.mockResolvedValue({
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      });

      await service.getSubmittedProposalsPageForClientJob(
        99,
        RoleName.CLIENT,
        10,
        { page: 1, limit: 10 },
      );

      expect(repository.cancelPendingProposalsForJob).toHaveBeenCalledWith(10);
    });
  });

  // ==========================================
  // UC-32.09: View Proposal Detail (Client)
  // ==========================================
  describe('UC-32.09: View Proposal Detail', () => {
    const clientProposalDetail = {
      ...mockProposal,
      job: mockJob,
      freelancer: { id: 12, email: 'freelancer@test.com' },
    };

    it('throws ForbiddenException if user is not client', async () => {
      await expect(
        service.getProposalDetailForClient(99, RoleName.FREELANCER, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException if proposal not found', async () => {
      repository.findProposalForClientDecision.mockResolvedValue(null);

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if client is not the job owner', async () => {
      repository.findProposalForClientDecision.mockResolvedValue({
        ...clientProposalDetail,
        job: { ...mockJob, clientId: 100 },
      });

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns proposal detail for client when valid', async () => {
      repository.findProposalForClientDecision.mockResolvedValue(
        clientProposalDetail,
      );
      repository.findProposalDetailForClient.mockResolvedValue(
        clientProposalDetail,
      );

      const result = await service.getProposalDetailForClient(
        99,
        RoleName.CLIENT,
        1,
      );

      expect(repository.findProposalDetailForClient).toHaveBeenCalledWith(1);
      expect(result).toEqual(clientProposalDetail);
    });
  });
});
