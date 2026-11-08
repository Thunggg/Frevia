import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  ClientJobProposalsQuerySchema,
  MyProposalsQuerySchema,
  RoleName,
} from '@shared/types';

import {
  ActiveProposalExistsException,
  BidAmountTooLowException,
  CannotProposeOwnJobException,
  ExtremeBidAmountException,
  FailedToCreateProposalException,
  FailedToLoadProposalException,
  FailedToUpdateProposalException,
  FreelancerBannedException,
  MaxProposalSubmissionsExceededException,
  ProposalClientOnlyException,
  ProposalForbiddenException,
  ProposalFreelancerOnlyException,
  ProposalIncompleteException,
  ProposalJobExpiredException,
  ProposalJobNotFoundException,
  ProposalJobPositionsFilledException,
  ProposalJobUnavailableException,
  ProposalNotFoundException,
  ProposalNotSubmittedException,
} from '../../src/routes/proposals/proposal.error';
import { ProposalRepository } from '../../src/routes/proposals/proposal.repo';
import { ProposalService } from '../../src/routes/proposals/proposal.service';

describe('Proposals Management (UF-110 to UF-118)', () => {
  let repository: {
    findJobForProposal: jest.Mock;
    findJobForClientProposals: jest.Mock;
    findFreelancerStatus: jest.Mock;
    countProposalsByFreelancerAndJob: jest.Mock;
    cancelPendingProposalsForJob: jest.Mock;
    findActiveProposal: jest.Mock;
    findMyActiveProposal: jest.Mock;
    findProposal: jest.Mock;
    findProposalForClientDecision: jest.Mock;
    createSubmitted: jest.Mock;
    createDraft: jest.Mock;
    updateDraft: jest.Mock;
    submitDraft: jest.Mock;
    withdrawProposal: jest.Mock;
    interviewProposal: jest.Mock;
    rejectProposal: jest.Mock;
    hireProposal: jest.Mock;
    getMyProposals: jest.Mock;
    getProposalDetail: jest.Mock;
    findSubmittedProposalsForClientJob: jest.Mock;
    findSubmittedProposalsPageForClientJob: jest.Mock;
    findProposalDetailForClient: jest.Mock;
    expireOverdueProposals: jest.Mock;
  };

  let service: ProposalService;

  const mockJob = {
    id: 10,
    clientId: 99,
    status: 'OPEN',
    budgetMin: 100,
    budgetMax: 1000,
    deadline: null,
    expiryDate: new Date(Date.now() + 86400000 * 7),
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
    createdAt: new Date('2026-03-01T00:00:00Z'),
    submittedAt: new Date('2026-03-01T00:00:00Z'),
    acceptedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    expiresAt: new Date(Date.now() + 86400000 * 30),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
  };

  const mockDraftProposal = {
    ...mockProposal,
    id: 2,
    status: 'DRAFT' as const,
    submittedAt: null,
    expiresAt: null,
  };

  beforeEach(() => {
    repository = {
      findJobForProposal: jest.fn().mockResolvedValue(mockJob),
      findJobForClientProposals: jest.fn().mockResolvedValue(mockJob),
      findFreelancerStatus: jest.fn().mockResolvedValue({
        isBanned: false,
        deletedAt: null,
      }),
      countProposalsByFreelancerAndJob: jest.fn().mockResolvedValue(0),
      cancelPendingProposalsForJob: jest.fn().mockResolvedValue(0),
      findActiveProposal: jest.fn().mockResolvedValue(null),
      findMyActiveProposal: jest.fn().mockResolvedValue(null),
      findProposal: jest.fn().mockResolvedValue(mockProposal),
      findProposalForClientDecision: jest.fn().mockResolvedValue({
        ...mockProposal,
        job: mockJob,
      }),
      createSubmitted: jest.fn().mockResolvedValue(mockProposal),
      createDraft: jest.fn().mockResolvedValue(mockDraftProposal),
      updateDraft: jest.fn().mockResolvedValue(mockProposal),
      submitDraft: jest.fn().mockResolvedValue({
        ...mockDraftProposal,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      }),
      withdrawProposal: jest.fn().mockResolvedValue({
        ...mockProposal,
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
      }),
      interviewProposal: jest.fn().mockResolvedValue({
        ...mockProposal,
        status: 'INTERVIEWING',
      }),
      rejectProposal: jest.fn().mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
        rejectedAt: new Date(),
      }),
      hireProposal: jest.fn().mockResolvedValue({
        proposal: { ...mockProposal, status: 'HIRED', acceptedAt: new Date() },
        contract: { id: 100, jobId: 10, freelancerId: 12 },
      }),
      getMyProposals: jest.fn().mockResolvedValue({
        data: [mockProposal],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      }),
      getProposalDetail: jest.fn().mockResolvedValue({
        ...mockProposal,
        job: mockJob,
      }),
      findSubmittedProposalsForClientJob: jest
        .fn()
        .mockResolvedValue([mockProposal]),
      findSubmittedProposalsPageForClientJob: jest.fn().mockResolvedValue({
        data: [mockProposal],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      }),
      findProposalDetailForClient: jest.fn().mockResolvedValue({
        ...mockProposal,
        freelancer: { id: 12, name: 'Freelancer Dev' },
      }),
      expireOverdueProposals: jest.fn().mockResolvedValue(0),
    };

    service = new ProposalService(repository as unknown as ProposalRepository);

    jest.clearAllMocks();
  });

  describe('UF-110 viewMyProposals', () => {
    // UF-110: Lấy danh sách đề xuất của freelancer thành công với phân trang mặc định.
    it('returns paginated proposals list for freelancer with default query', async () => {
      const result = await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
    });

    // Lọc danh sách đề xuất theo trạng thái SUBMITTED.
    it('filters proposals by SUBMITTED status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'SUBMITTED',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'SUBMITTED',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái DRAFT.
    it('filters proposals by DRAFT status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'DRAFT',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'DRAFT',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái INTERVIEWING.
    it('filters proposals by INTERVIEWING status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'INTERVIEWING',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'INTERVIEWING',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái HIRED.
    it('filters proposals by HIRED status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'HIRED',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'HIRED',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái REJECTED.
    it('filters proposals by REJECTED status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'REJECTED',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'REJECTED',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái WITHDRAWN.
    it('filters proposals by WITHDRAWN status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'WITHDRAWN',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'WITHDRAWN',
      });
    });

    // Lọc danh sách đề xuất theo trạng thái EXPIRED.
    it('filters proposals by EXPIRED status', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        status: 'EXPIRED',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        status: 'EXPIRED',
      });
    });

    // Lọc danh sách đề xuất theo mã công việc cụ thể.
    it('filters proposals by specific jobId', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        jobId: 10,
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        jobId: 10,
      });
    });

    // Lọc danh sách đề xuất theo đồng thời mã công việc và trạng thái SUBMITTED.
    it('filters proposals by jobId and SUBMITTED status concurrently', async () => {
      await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
        jobId: 10,
        status: 'SUBMITTED',
      });

      expect(repository.getMyProposals).toHaveBeenCalledWith(12, {
        page: 1,
        limit: 10,
        jobId: 10,
        status: 'SUBMITTED',
      });
    });

    // Trả về danh sách rỗng khi freelancer chưa có đề xuất nào.
    it('returns empty data when freelancer has no proposals', async () => {
      repository.getMyProposals.mockResolvedValueOnce({
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      });

      const result = await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });

    // Trả về danh sách rỗng khi số trang yêu cầu vượt quá tổng số trang.
    it('returns empty data when requested page exceeds total available pages', async () => {
      repository.getMyProposals.mockResolvedValueOnce({
        data: [],
        totalItems: 5,
        totalPages: 1,
        page: 99,
        limit: 10,
      });

      const result = await service.getMyProposals(12, RoleName.FREELANCER, {
        page: 99,
        limit: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.page).toBe(99);
    });

    // Người dùng không phải Freelancer bị từ chối truy cập.
    it('forbids non-freelancer role from viewing my proposals', async () => {
      await expect(
        service.getMyProposals(12, RoleName.CLIENT, { page: 1, limit: 10 }),
      ).rejects.toThrow(ProposalFreelancerOnlyException());
    });

    // Schema từ chối khi số trang là số âm.
    it('rejects negative page number in query schema validation', () => {
      const parsed = MyProposalsQuerySchema.safeParse({ page: -1 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi số lượng mỗi trang vượt quá 50.
    it('rejects limit exceeding 50 in query schema validation', () => {
      const parsed = MyProposalsQuerySchema.safeParse({ limit: 51 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi số lượng mỗi trang là số âm.
    it('rejects negative limit in query schema validation', () => {
      const parsed = MyProposalsQuerySchema.safeParse({ limit: -5 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi trạng thái đề xuất không hợp lệ.
    it('rejects invalid proposal status enum in query schema validation', () => {
      const parsed = MyProposalsQuerySchema.safeParse({
        status: 'INVALID_STATUS',
      });

      expect(parsed.success).toBe(false);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadProposalException.
    it('throws FailedToLoadProposalException on repository failure', async () => {
      repository.getMyProposals.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(
        service.getMyProposals(12, RoleName.FREELANCER, { page: 1, limit: 10 }),
      ).rejects.toThrow(FailedToLoadProposalException());
    });
  });

  describe('UF-111 viewMyProposalDetail', () => {
    // UF-111: Xem chi tiết đề xuất thành công khi thuộc sở hữu của freelancer.
    it('returns proposal detail when owned by freelancer', async () => {
      const result = await service.getProposalDetail(
        12,
        RoleName.FREELANCER,
        1,
      );

      expect(repository.getProposalDetail).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    // Báo lỗi NotFound khi ID đề xuất không tồn tại trong hệ thống.
    it('raises NotFound when proposal id does not exist', async () => {
      repository.getProposalDetail.mockResolvedValueOnce(null);

      await expect(
        service.getProposalDetail(12, RoleName.FREELANCER, 999),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Từ chối freelancer xem đề xuất của người khác.
    it('forbids freelancer from viewing proposal owned by another freelancer', async () => {
      repository.getProposalDetail.mockResolvedValueOnce({
        ...mockProposal,
        freelancerId: 99,
      });

      await expect(
        service.getProposalDetail(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Freelancer bị từ chối truy cập.
    it('forbids non-freelancer role from viewing my proposal detail', async () => {
      await expect(
        service.getProposalDetail(12, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalFreelancerOnlyException());
    });

    // Tự động kiểm tra và chuyển các đề xuất quá hạn sang trạng thái EXPIRED.
    it('expires stale proposals before returning detail', async () => {
      await service.getProposalDetail(12, RoleName.FREELANCER, 1);

      expect(repository.expireOverdueProposals).toHaveBeenCalled();
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadProposalException.
    it('throws FailedToLoadProposalException on repository error', async () => {
      repository.getProposalDetail.mockRejectedValueOnce(
        new Error('read error'),
      );

      await expect(
        service.getProposalDetail(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(FailedToLoadProposalException());
    });
  });

  describe('UF-112 submitProposal', () => {
    // UF-112: Tạo và nộp đề xuất thành công cho công việc đang mở.
    it('creates and submits a proposal successfully for an open job', async () => {
      const body = {
        coverLetter: 'I am a strong candidate with 5+ years experience.',
        bidAmount: 500,
        deliveryDays: 14,
      };

      const result = await service.createProposal(
        12,
        RoleName.FREELANCER,
        10,
        body,
      );

      expect(repository.createSubmitted).toHaveBeenCalledWith(10, 12, body);
      expect(result).toEqual(mockProposal);
    });

    // Nộp bản nháp đề xuất đã lưu trước đó thành công.
    it('submits a saved draft proposal successfully', async () => {
      repository.findProposal.mockResolvedValueOnce(mockDraftProposal);

      const result = await service.submitDraft(12, RoleName.FREELANCER, 2);

      expect(repository.submitDraft).toHaveBeenCalledWith(2);
      expect(result.status).toBe('SUBMITTED');
    });

    // Lưu đề xuất dưới dạng bản nháp thành công không yêu cầu nộp ngay.
    it('saves proposal as draft successfully without immediate submission', async () => {
      const body = {
        coverLetter: 'Draft proposal notes',
      };

      const result = await service.saveDraft(12, RoleName.FREELANCER, 10, body);

      expect(repository.createDraft).toHaveBeenCalledWith(10, 12, body);
      expect(result.status).toBe('DRAFT');
    });

    // Cho phép lưu bản nháp ngay cả khi thiếu thư ngỏ hoặc giá dự thầu.
    it('allows draft proposal with missing cover letter or bid amount', async () => {
      await service.saveDraft(12, RoleName.FREELANCER, 10, {});

      expect(repository.createDraft).toHaveBeenCalledWith(10, 12, {});
    });

    // Cho phép nộp đề xuất lần thứ 2 sau khi đề xuất trước đó đã bị rút hoặc từ chối.
    it('allows second proposal submission after previous proposal was withdrawn or rejected', async () => {
      repository.countProposalsByFreelancerAndJob.mockResolvedValueOnce(1);
      repository.findActiveProposal.mockResolvedValueOnce(null);

      await service.createProposal(12, RoleName.FREELANCER, 10, {
        coverLetter: 'Second proposal try',
        bidAmount: 600,
        deliveryDays: 10,
      });

      expect(repository.createSubmitted).toHaveBeenCalled();
    });

    // Chấp nhận thư ngỏ có độ dài tối đa chính xác 5000 ký tự.
    it('accepts maximum length cover letter of exactly 5000 characters', async () => {
      const body = {
        coverLetter: 'X'.repeat(5000),
        bidAmount: 500,
        deliveryDays: 14,
      };

      await service.createProposal(12, RoleName.FREELANCER, 10, body);

      expect(repository.createSubmitted).toHaveBeenCalledWith(10, 12, body);
    });

    // Chấp nhận số ngày hoàn thành tối thiểu là 1 ngày.
    it('accepts delivery days minimum boundary of 1 day', async () => {
      const body = {
        coverLetter: 'Quick delivery proposal',
        bidAmount: 500,
        deliveryDays: 1,
      };

      await service.createProposal(12, RoleName.FREELANCER, 10, body);

      expect(repository.createSubmitted).toHaveBeenCalledWith(10, 12, body);
    });

    // Chấp nhận giá dự thầu bằng đúng mức sàn tối thiểu $5.
    it('accepts bid amount matching minimum allowed value of $5', async () => {
      repository.findJobForProposal.mockResolvedValue({
        ...mockJob,
        budgetMin: 5,
        budgetMax: 50,
      });

      await service.createProposal(12, RoleName.FREELANCER, 10, {
        coverLetter: 'Minimum bid test',
        bidAmount: 5,
        deliveryDays: 7,
      });

      expect(repository.createSubmitted).toHaveBeenCalled();
    });

    // Từ chối nộp bản nháp khi thiếu thông tin bắt buộc (chưa hoàn thành).
    it('rejects submitting draft when required fields are incomplete', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockDraftProposal,
        coverLetter: '',
      });

      await expect(
        service.submitDraft(12, RoleName.FREELANCER, 2),
      ).rejects.toThrow(ProposalIncompleteException());
    });

    // Báo lỗi NotFound khi công việc cần nộp đề xuất không tồn tại.
    it('raises NotFound when target job does not exist', async () => {
      repository.findJobForProposal.mockResolvedValueOnce(null);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 999, {
          coverLetter: 'Test proposal',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ProposalJobNotFoundException());
    });

    // Không cho phép nộp đề xuất cho công việc do chính mình đăng (BR-PR02).
    it('forbids freelancer from submitting proposal to their own job', async () => {
      repository.findJobForProposal.mockResolvedValueOnce({
        ...mockJob,
        clientId: 12,
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Self proposal',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(CannotProposeOwnJobException());
    });

    // Từ chối đề xuất khi công việc không ở trạng thái OPEN (BR-PR03).
    it('rejects proposal when target job is not open', async () => {
      repository.findJobForProposal.mockResolvedValueOnce({
        ...mockJob,
        status: 'CLOSED',
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Closed job test',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ProposalJobUnavailableException());
    });

    // Từ chối đề xuất khi công việc đã hết hạn (BR-PR03).
    it('rejects proposal when target job is expired', async () => {
      repository.findJobForProposal.mockResolvedValueOnce({
        ...mockJob,
        expiryDate: new Date('2020-01-01T00:00:00Z'),
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Expired job test',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ProposalJobExpiredException());
    });

    // Từ chối đề xuất khi số lượng tuyển dụng đã đủ (BR-PR03).
    it('rejects proposal when target job positions are already filled', async () => {
      repository.findJobForProposal.mockResolvedValueOnce({
        ...mockJob,
        positionsRequired: 1,
        positionsFilled: 1,
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Filled job test',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ProposalJobPositionsFilledException());
    });

    // Báo lỗi xung đột khi freelancer đã có một đề xuất đang hoạt động (BR-PR04).
    it('forbids proposal when freelancer already has an active proposal for the job', async () => {
      repository.findActiveProposal.mockResolvedValueOnce(mockProposal);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Duplicate active proposal',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ActiveProposalExistsException());
    });

    // Từ chối đề xuất khi tài khoản freelancer bị cấm hoạt động (BR-PR11).
    it('forbids proposal when freelancer account is banned', async () => {
      repository.findFreelancerStatus.mockResolvedValueOnce({
        isBanned: true,
        deletedAt: null,
      });

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Banned test',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(FreelancerBannedException());
    });

    // Báo lỗi khi freelancer đã nộp quá 3 lần cho cùng một công việc (BR-PR13).
    it('forbids submission when freelancer exceeds maximum limit of 3 submissions for the job', async () => {
      repository.countProposalsByFreelancerAndJob.mockResolvedValueOnce(3);

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: '4th submission attempt',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(MaxProposalSubmissionsExceededException());
    });

    // Từ chối giá dự thầu nhỏ hơn $5 (BR-PR15).
    it('rejects bid amount strictly less than $5', async () => {
      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Low bid',
          bidAmount: 4,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(BidAmountTooLowException());
    });

    // Từ chối giá dự thầu chênh lệch quá lớn so với ngân sách công việc (BR-PR15).
    it('rejects extreme bid amount multiple times higher than budgetMax', async () => {
      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Extreme bid test',
          bidAmount: 60000,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ExtremeBidAmountException());
    });

    // Người dùng không phải Freelancer không được phép nộp đề xuất.
    it('forbids non-freelancer role from submitting proposal', async () => {
      await expect(
        service.createProposal(12, RoleName.CLIENT, 10, {
          coverLetter: 'Client attempt',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(ProposalFreelancerOnlyException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToCreateProposalException.
    it('throws FailedToCreateProposalException on database error', async () => {
      repository.createSubmitted.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2002',
          clientVersion: '1',
        }),
      );

      await expect(
        service.createProposal(12, RoleName.FREELANCER, 10, {
          coverLetter: 'Database failure test',
          bidAmount: 500,
          deliveryDays: 7,
        }),
      ).rejects.toThrow(FailedToCreateProposalException());
    });
  });

  describe('UF-113 updateProposal', () => {
    // UF-113: Cập nhật thư ngỏ và giá dự thầu của đề xuất thành công khi ở trạng thái SUBMITTED.
    it('updates submitted proposal details successfully while in SUBMITTED state', async () => {
      const updateBody = {
        coverLetter: 'Updated proposal content with better experience',
        bidAmount: 600,
        deliveryDays: 10,
      };

      const result = await service.updateProposal(
        12,
        RoleName.FREELANCER,
        1,
        updateBody,
      );

      expect(repository.updateDraft).toHaveBeenCalledWith(1, updateBody);
      expect(result).toEqual(mockProposal);
    });

    // Cập nhật bản nháp đề xuất thành công qua phương thức updateDraft.
    it('updates draft proposal cover letter and bid amount successfully', async () => {
      repository.findProposal.mockResolvedValueOnce(mockDraftProposal);

      const result = await service.updateDraft(12, RoleName.FREELANCER, 2, {
        coverLetter: 'Draft revised notes',
        bidAmount: 550,
      });

      expect(repository.updateDraft).toHaveBeenCalledWith(2, {
        coverLetter: 'Draft revised notes',
        bidAmount: 550,
      });
      expect(result).toBeDefined();
    });

    // Cập nhật chỉ riêng thư ngỏ và giữ nguyên giá dự thầu.
    it('updates only cover letter leaving bid amount unchanged', async () => {
      await service.updateProposal(12, RoleName.FREELANCER, 1, {
        coverLetter: 'Updated letter only',
      });

      expect(repository.updateDraft).toHaveBeenCalledWith(1, {
        coverLetter: 'Updated letter only',
      });
    });

    // Cập nhật chỉ riêng giá dự thầu và giữ nguyên thư ngỏ.
    it('updates only bid amount leaving cover letter unchanged', async () => {
      await service.updateProposal(12, RoleName.FREELANCER, 1, {
        bidAmount: 700,
      });

      expect(repository.updateDraft).toHaveBeenCalledWith(1, {
        bidAmount: 700,
      });
    });

    // Từ chối cập nhật khi đề xuất không ở trạng thái DRAFT hoặc SUBMITTED.
    it('rejects update when proposal is in HIRED status', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        status: 'HIRED',
      });

      await expect(
        service.updateProposal(12, RoleName.FREELANCER, 1, {
          coverLetter: 'Late update',
        }),
      ).rejects.toThrow(ProposalNotSubmittedException());
    });

    // Báo lỗi NotFound khi đề xuất cần cập nhật không tồn tại.
    it('raises NotFound when updating non-existent proposal', async () => {
      repository.findProposal.mockResolvedValueOnce(null);

      await expect(
        service.updateProposal(12, RoleName.FREELANCER, 999, {
          coverLetter: 'Non existent',
        }),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Từ chối freelancer cập nhật đề xuất của người khác.
    it('forbids freelancer from updating proposal owned by another freelancer', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        freelancerId: 99,
      });

      await expect(
        service.updateProposal(12, RoleName.FREELANCER, 1, {
          coverLetter: 'Unauthorized update',
        }),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Freelancer không được phép cập nhật đề xuất.
    it('forbids non-freelancer role from updating proposal', async () => {
      await expect(
        service.updateProposal(12, RoleName.CLIENT, 1, {
          coverLetter: 'Client update',
        }),
      ).rejects.toThrow(ProposalFreelancerOnlyException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToUpdateProposalException.
    it('throws FailedToUpdateProposalException on database error', async () => {
      repository.updateDraft.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.updateProposal(12, RoleName.FREELANCER, 1, {
          coverLetter: 'Fail',
        }),
      ).rejects.toThrow(FailedToUpdateProposalException());
    });
  });

  describe('UF-114 withdrawProposal', () => {
    // UF-114: Rút đề xuất đã nộp (SUBMITTED) thành công.
    it('withdraws a submitted proposal successfully', async () => {
      const result = await service.withdrawProposal(12, RoleName.FREELANCER, 1);

      expect(repository.withdrawProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('WITHDRAWN');
    });

    // Rút đề xuất đang trong giai đoạn phỏng vấn (INTERVIEWING) thành công.
    it('withdraws a proposal in interviewing status successfully', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        status: 'INTERVIEWING',
      });

      const result = await service.withdrawProposal(12, RoleName.FREELANCER, 1);

      expect(repository.withdrawProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('WITHDRAWN');
    });

    // Báo lỗi khi rút đề xuất đã được tuyển dụng (HIRED).
    it('rejects withdrawing a proposal already in HIRED status', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        status: 'HIRED',
      });

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalNotSubmittedException());
    });

    // Báo lỗi khi rút đề xuất đã bị từ chối (REJECTED).
    it('rejects withdrawing a proposal already in REJECTED status', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        status: 'REJECTED',
      });

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalNotSubmittedException());
    });

    // Báo lỗi NotFound khi ID đề xuất cần rút không tồn tại.
    it('raises NotFound when withdrawing non-existent proposal', async () => {
      repository.findProposal.mockResolvedValueOnce(null);

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 999),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Từ chối freelancer rút đề xuất của người khác.
    it('forbids freelancer from withdrawing proposal owned by another freelancer', async () => {
      repository.findProposal.mockResolvedValueOnce({
        ...mockProposal,
        freelancerId: 99,
      });

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Freelancer không được phép rút đề xuất.
    it('forbids non-freelancer role from withdrawing proposal', async () => {
      await expect(
        service.withdrawProposal(12, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalFreelancerOnlyException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToUpdateProposalException.
    it('throws FailedToUpdateProposalException on database error', async () => {
      repository.withdrawProposal.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.withdrawProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(FailedToUpdateProposalException());
    });
  });

  describe('UF-115 acceptProposal', () => {
    // UF-115: Khách hàng tuyển (hire) đề xuất thành công và tự động tạo hợp đồng.
    it('hires proposal successfully and creates contract', async () => {
      const result = await service.acceptProposal(99, RoleName.CLIENT, 1);

      expect(repository.hireProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: 1,
          jobId: 10,
          clientId: 99,
          freelancerId: 12,
        }),
      );
      expect(result).toHaveProperty('proposal');
    });

    // Khách hàng không sở hữu công việc bị từ chối chấp nhận đề xuất.
    it('forbids client from accepting proposal on a job owned by another client', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockJob, clientId: 888 },
      });

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Client không được phép chấp nhận đề xuất.
    it('forbids non-client role from accepting proposal', async () => {
      await expect(
        service.acceptProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalClientOnlyException());
    });

    // Báo lỗi NotFound khi ID đề xuất cần tuyển không tồn tại.
    it('raises NotFound when accepting non-existent proposal', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce(null);

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 999),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Báo lỗi khi công việc gắn với đề xuất đã bị xóa.
    it('raises ProposalJobUnavailableException when proposal job is deleted', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockJob, deletedAt: new Date() },
      });

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalJobUnavailableException());
    });

    // Từ chối chấp nhận đề xuất đã bị rút (WITHDRAWN).
    it('rejects accepting proposal when proposal is in WITHDRAWN status', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        status: 'WITHDRAWN',
        job: mockJob,
      });

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalNotSubmittedException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToUpdateProposalException.
    it('throws FailedToUpdateProposalException on database error', async () => {
      repository.hireProposal.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.acceptProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(FailedToUpdateProposalException());
    });
  });

  describe('UF-116 rejectProposal', () => {
    // UF-116: Khách hàng từ chối đề xuất thành công khi ở trạng thái SUBMITTED.
    it('rejects proposal successfully when in SUBMITTED state', async () => {
      const result = await service.rejectProposal(99, RoleName.CLIENT, 1);

      expect(repository.rejectProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('REJECTED');
    });

    // Khách hàng bắt đầu phỏng vấn freelancer thành công qua interviewProposal.
    it('moves proposal to INTERVIEWING status via interviewProposal', async () => {
      const result = await service.interviewProposal(99, RoleName.CLIENT, 1);

      expect(repository.interviewProposal).toHaveBeenCalledWith(1);
      expect(result.status).toBe('INTERVIEWING');
    });

    // Khách hàng không sở hữu công việc bị từ chối thực hiện từ chối đề xuất.
    it('forbids client from rejecting proposal on a job owned by another client', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockJob, clientId: 888 },
      });

      await expect(
        service.rejectProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Client không được phép từ chối đề xuất.
    it('forbids non-client role from rejecting proposal', async () => {
      await expect(
        service.rejectProposal(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalClientOnlyException());
    });

    // Báo lỗi NotFound khi ID đề xuất cần từ chối không tồn tại.
    it('raises NotFound when rejecting non-existent proposal', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce(null);

      await expect(
        service.rejectProposal(99, RoleName.CLIENT, 999),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Từ chối xử lý khi đề xuất đã ở trạng thái HIRED.
    it('rejects action when proposal is already in HIRED status', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        status: 'HIRED',
        job: mockJob,
      });

      await expect(
        service.rejectProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalNotSubmittedException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToUpdateProposalException.
    it('throws FailedToUpdateProposalException on database error', async () => {
      repository.rejectProposal.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.rejectProposal(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(FailedToUpdateProposalException());
    });
  });

  describe('UF-117 viewJobProposals', () => {
    // UF-117: Khách hàng xem danh sách đề xuất đã nộp của công việc kèm phân trang.
    it('returns paginated submitted proposals for client job', async () => {
      const result = await service.getSubmittedProposalsPageForClientJob(
        99,
        RoleName.CLIENT,
        10,
        { page: 1, limit: 10 },
      );

      expect(
        repository.findSubmittedProposalsPageForClientJob,
      ).toHaveBeenCalledWith(10, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    // Tự động hủy các đề xuất đang chờ khi công việc bị CANCELLED (BR-PR14).
    it('cancels pending proposals if job is CANCELLED', async () => {
      repository.findJobForClientProposals.mockResolvedValueOnce({
        ...mockJob,
        status: 'CANCELLED',
      });

      await service.getSubmittedProposalsPageForClientJob(
        99,
        RoleName.CLIENT,
        10,
        { page: 1, limit: 10 },
      );

      expect(repository.cancelPendingProposalsForJob).toHaveBeenCalledWith(10);
    });

    // Khách hàng không sở hữu công việc bị từ chối xem danh sách đề xuất.
    it('forbids client who does not own the job from viewing proposals', async () => {
      repository.findJobForClientProposals.mockResolvedValueOnce({
        ...mockJob,
        clientId: 888,
      });

      await expect(
        service.getSubmittedProposalsPageForClientJob(99, RoleName.CLIENT, 10, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Client bị từ chối xem danh sách đề xuất công việc.
    it('forbids non-client role from viewing client job proposals', async () => {
      await expect(
        service.getSubmittedProposalsPageForClientJob(
          12,
          RoleName.FREELANCER,
          10,
          { page: 1, limit: 10 },
        ),
      ).rejects.toThrow(ProposalClientOnlyException());
    });

    // Báo lỗi NotFound khi công việc không tồn tại.
    it('raises NotFound when client job does not exist', async () => {
      repository.findJobForClientProposals.mockResolvedValueOnce(null);

      await expect(
        service.getSubmittedProposalsPageForClientJob(
          99,
          RoleName.CLIENT,
          999,
          { page: 1, limit: 10 },
        ),
      ).rejects.toThrow(ProposalJobNotFoundException());
    });

    // Báo lỗi khi công việc đã bị xóa mềm (deletedAt có giá trị).
    it('raises ProposalJobUnavailableException when client job is soft deleted', async () => {
      repository.findJobForClientProposals.mockResolvedValueOnce({
        ...mockJob,
        deletedAt: new Date(),
      });

      await expect(
        service.getSubmittedProposalsPageForClientJob(99, RoleName.CLIENT, 10, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(ProposalJobUnavailableException());
    });

    // Schema từ chối khi số lượng mỗi trang vượt quá 50.
    it('rejects limit exceeding 50 in query schema validation', () => {
      const parsed = ClientJobProposalsQuerySchema.safeParse({ limit: 51 });

      expect(parsed.success).toBe(false);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadProposalException.
    it('throws FailedToLoadProposalException on repository failure', async () => {
      repository.findSubmittedProposalsPageForClientJob.mockRejectedValueOnce(
        new Error('read failure'),
      );

      await expect(
        service.getSubmittedProposalsPageForClientJob(99, RoleName.CLIENT, 10, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(FailedToLoadProposalException());
    });
  });

  describe('UF-118 viewProposalDetail', () => {
    // UF-118: Khách hàng xem thông tin chi tiết đề xuất của freelancer thành công.
    it('returns proposal detail for client when valid', async () => {
      const result = await service.getProposalDetailForClient(
        99,
        RoleName.CLIENT,
        1,
      );

      expect(repository.findProposalDetailForClient).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('freelancer');
    });

    // Khách hàng không sở hữu công việc bị từ chối xem chi tiết đề xuất.
    it('forbids client from viewing proposal detail for another client job', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockJob, clientId: 888 },
      });

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalForbiddenException());
    });

    // Người dùng không phải Client bị từ chối xem chi tiết đề xuất của khách hàng.
    it('forbids non-client role from viewing proposal detail as client', async () => {
      await expect(
        service.getProposalDetailForClient(12, RoleName.FREELANCER, 1),
      ).rejects.toThrow(ProposalClientOnlyException());
    });

    // Báo lỗi NotFound khi ID đề xuất không tồn tại.
    it('raises NotFound when proposal does not exist for client view', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce(null);

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 999),
      ).rejects.toThrow(ProposalNotFoundException());
    });

    // Báo lỗi khi công việc gắn với đề xuất đã bị xóa.
    it('raises ProposalJobUnavailableException when job associated with proposal is deleted', async () => {
      repository.findProposalForClientDecision.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockJob, deletedAt: new Date() },
      });

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(ProposalJobUnavailableException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadProposalException.
    it('throws FailedToLoadProposalException on database read failure', async () => {
      repository.findProposalDetailForClient.mockRejectedValueOnce(
        new Error('read error'),
      );

      await expect(
        service.getProposalDetailForClient(99, RoleName.CLIENT, 1),
      ).rejects.toThrow(FailedToLoadProposalException());
    });
  });
});
