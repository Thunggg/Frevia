import {
  DisputeDecisionResponse,
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import {
  AdminDisputeDecisionBodySchema,
  AdminDisputeDecisionBodyType,
  AdminDisputeFinalDecisionBodyType,
  CreateDisputeBodySchema,
  CreateDisputeBodyType,
  GetDisputeListQuerySchema,
  GetDisputeListQueryType,
  ReviewDisputeDecisionBodySchema,
  ReviewDisputeDecisionBodyType,
  RoleName,
  SubmitDisputeResponseBodyType,
} from '@shared/types';
import {
  DisputeDecisionNotPendingException,
  DisputeEvidenceLimitExceededException,
  DisputeForbiddenException,
  DisputeInvalidSplitAmountException,
  DisputeMilestoneNotFoundException,
  DisputeNotContractParticipantException,
  DisputeNotFoundException,
  DisputeResponseAlreadySubmittedException,
  DisputeResponseNotAllowedException,
  DisputeReviewReasonRequiredException,
  MilestoneAlreadyDisputedException,
  MilestoneCannotBeDisputedException,
} from '../../src/routes/disputes/dispute.error';
import { DisputeRepository } from '../../src/routes/disputes/dispute.repo';
import { DisputeService } from '../../src/routes/disputes/dispute.service';

describe('Dispute Management (UF-147 to UF-152)', () => {
  const disputeRepo = {
    findMilestoneWithContract: jest.fn(),
    findDisputeById: jest.fn(),
    findDisputeByMilestoneId: jest.fn(),
    findSharedFilesByIds: jest.fn(),
    createDisputeTransaction: jest.fn(),
    findFeeByDisputeAndUser: jest.fn(),
    updateFeeStatus: jest.fn(),
    hasUserSubmittedEvidence: jest.fn(),
    submitResponseTransaction: jest.fn(),
    markFeeOverdue: jest.fn(),
    listDisputes: jest.fn(),
    makeDecisionTransaction: jest.fn(),
    findDecisionReviews: jest.fn(),
    upsertDecisionReview: jest.fn(),
    updateDisputeStatus: jest.fn(),
    finalizeDisputeTransaction: jest.fn(),
  };

  const service = new DisputeService(
    disputeRepo as unknown as DisputeRepository,
  );

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockMilestone = {
    id: 10,
    contractId: 100,
    title: 'Milestone 1',
    description: 'First milestone',
    amount: new Prisma.Decimal(500.0),
    status: MilestoneStatus.IN_PROGRESS,
    paymentStatus: MilestonePaymentStatus.FUNDED,
    dueDate: null,
    completedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    deletedAt: null,
    dispute: null,
    contract: {
      id: 100,
      jobId: 1,
      proposalId: 1,
      clientId: 1,
      freelancerId: 2,
      terms: 'Terms',
      totalAmount: new Prisma.Decimal(1000.0),
      status: 'ACTIVE',
      signedByClient: true,
      signedByFreelancer: true,
    },
  };

  const mockDispute = {
    id: 5,
    milestoneId: 10,
    openedById: 1,
    respondentId: 2,
    reason: 'Work does not match specifications',
    description: 'Detailed description of dispute',
    status: DisputeStatus.OPEN,
    arbitrationFee: new Prisma.Decimal(50.0),
    freelancerAmount: null,
    clientAmount: null,
    decisionReason: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    fees: [] as {
      id: number;
      disputeId: number;
      userId: number;
      status: DisputeFeeStatus;
      deadline: Date | null;
    }[],
    milestone: mockMilestone,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-147: createDispute
  // =========================================================================
  describe('UF-147 createDispute', () => {
    // UF-147: Người tham gia hợp đồng khởi tạo tranh chấp thành công cho milestone đã ký quỹ.
    it('creates dispute successfully on funded milestone by participant', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );
      disputeRepo.findSharedFilesByIds.mockResolvedValueOnce([{ id: 1 }]);
      disputeRepo.createDisputeTransaction.mockResolvedValueOnce(mockDispute);

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Work does not match specifications',
        description: 'Detailed description',
        evidenceFiles: [{ fileId: 1 }],
      };

      const result = await service.createDispute(1, body);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.createDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 10,
          openedById: 1,
          respondentId: 2,
          reason: 'Work does not match specifications',
        }),
      );
    });

    // Ném ngoại lệ DisputeMilestoneNotFoundException khi milestone không tồn tại.
    it('throws DisputeMilestoneNotFoundException when milestone is not found', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(null);

      const body: CreateDisputeBodyType = {
        milestoneId: 999,
        reason: 'Missing milestone',
        description: 'Milestone was not delivered according to requirements',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        DisputeMilestoneNotFoundException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeNotContractParticipantException khi người mở không thuộc hợp đồng.
    it('throws DisputeNotContractParticipantException when user is non-participant', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'IDOR attempt',
        description: 'Unauthorized user dispute attempt',
      };

      await expect(service.createDispute(999, body)).rejects.toThrow(
        DisputeNotContractParticipantException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneAlreadyDisputedException khi milestone đã có tranh chấp đang mở.
    it('throws MilestoneAlreadyDisputedException when milestone already has a dispute', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce({
        ...mockMilestone,
        dispute: { id: 1, status: DisputeStatus.OPEN },
      });

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Duplicate dispute',
        description: 'Attempting to open duplicate dispute on milestone',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        MilestoneAlreadyDisputedException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneCannotBeDisputedException khi milestone chưa được nạp tiền ký quỹ.
    it('throws MilestoneCannotBeDisputedException when milestone is not funded', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.PENDING,
      });

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Unfunded milestone',
        description: 'Cannot open dispute on unfunded milestone',
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        MilestoneCannotBeDisputedException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeEvidenceLimitExceededException khi đính kèm quá 5 tệp bằng chứng.
    it('throws DisputeEvidenceLimitExceededException when evidence files exceed limit', async () => {
      disputeRepo.findMilestoneWithContract.mockResolvedValueOnce(
        mockMilestone,
      );

      const body: CreateDisputeBodyType = {
        milestoneId: 10,
        reason: 'Too many files',
        description: 'Excessive evidence attachments',
        evidenceFiles: [
          { fileId: 1 },
          { fileId: 2 },
          { fileId: 3 },
          { fileId: 4 },
          { fileId: 5 },
          { fileId: 6 },
        ],
      };

      await expect(service.createDispute(1, body)).rejects.toThrow(
        DisputeEvidenceLimitExceededException(),
      );
      expect(disputeRepo.createDisputeTransaction).not.toHaveBeenCalled();
    });

    // Schema từ chối khi lý do mở tranh chấp bị bỏ trống.
    it('rejects empty reason through CreateDisputeBodySchema', () => {
      const parsed = CreateDisputeBodySchema.safeParse({
        milestoneId: 10,
        reason: '',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-148: listMyDisputes
  // =========================================================================
  describe('UF-148 listMyDisputes', () => {
    // UF-148: Lấy danh sách tranh chấp của người dùng kèm phân trang thành công.
    it('returns paginated disputes for authenticated user', async () => {
      const expectedData = {
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      disputeRepo.listDisputes.mockResolvedValueOnce(expectedData);

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };
      const result = await service.listMyDisputes(1, query);

      expect(result).toEqual(expectedData);
      expect(disputeRepo.listDisputes).toHaveBeenCalledWith(query, 1);
    });

    // Quản trị viên hệ thống lấy toàn bộ danh sách tranh chấp trong hệ thống.
    it('returns all system disputes for admin role', async () => {
      const expectedData = {
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      disputeRepo.listDisputes.mockResolvedValueOnce(expectedData);

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };
      const result = await service.adminListDisputes(RoleName.ADMIN, query);

      expect(result).toEqual(expectedData);
      expect(disputeRepo.listDisputes).toHaveBeenCalledWith(query);
    });

    // Ném ngoại lệ DisputeForbiddenException khi người dùng thông thường cố truy cập API danh sách của admin.
    it('throws DisputeForbiddenException when non-admin accesses admin dispute list', async () => {
      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      await expect(
        service.adminListDisputes(RoleName.CLIENT, query),
      ).rejects.toThrow(DisputeForbiddenException());
      expect(disputeRepo.listDisputes).not.toHaveBeenCalled();
    });

    // Lọc danh sách tranh chấp theo trạng thái cụ thể.
    it('filters dispute list by status cleanly', async () => {
      disputeRepo.listDisputes.mockResolvedValueOnce({
        data: [mockDispute],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const query: GetDisputeListQueryType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
        status: DisputeStatus.OPEN,
      };
      const result = await service.listMyDisputes(1, query);

      expect(result.data).toHaveLength(1);
    });

    // Schema query từ chối khi limit vượt quá 50.
    it('rejects limit > 50 through GetDisputeListQuerySchema', () => {
      const parsed = GetDisputeListQuerySchema.safeParse({ limit: 100 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-149: getDisputeDetail
  // =========================================================================
  describe('UF-149 getDisputeDetail', () => {
    // UF-149: Lấy chi tiết tranh chấp thành công theo ID cho bên tham gia hoặc Admin.
    it('returns dispute detail by ID for participant', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeDetail(1, RoleName.CLIENT, 5);

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.findDisputeById).toHaveBeenCalledWith(5);
    });

    // Lấy chi tiết tranh chấp thành công theo mã milestone.
    it('returns dispute detail by milestone ID for participant', async () => {
      disputeRepo.findDisputeByMilestoneId.mockResolvedValueOnce(mockDispute);

      const result = await service.getDisputeByMilestoneId(
        2,
        RoleName.FREELANCER,
        10,
      );

      expect(result).toEqual(mockDispute);
      expect(disputeRepo.findDisputeByMilestoneId).toHaveBeenCalledWith(10);
    });

    // Tự động phát hiện và đánh dấu phí trọng tài quá hạn nếu vượt mốc thời gian quy định.
    it('automatically marks pending arbitration fees as OVERDUE when expired', async () => {
      const expiredDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const disputeWithPendingFee = {
        ...mockDispute,
        fees: [
          {
            id: 99,
            disputeId: 5,
            userId: 1,
            status: DisputeFeeStatus.PENDING,
            deadline: expiredDeadline,
          },
        ],
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(disputeWithPendingFee);

      const result = await service.getDisputeDetail(1, RoleName.CLIENT, 5);

      expect(result.fees[0].status).toBe(DisputeFeeStatus.OVERDUE);
      expect(disputeRepo.markFeeOverdue).toHaveBeenCalledWith(99);
    });

    // Ném ngoại lệ DisputeNotFoundException khi mã tranh chấp không tồn tại.
    it('throws DisputeNotFoundException when dispute is not found', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(null);

      await expect(
        service.getDisputeDetail(1, RoleName.CLIENT, 999),
      ).rejects.toThrow(DisputeNotFoundException());
    });

    // Ném ngoại lệ DisputeForbiddenException khi người ngoài cố tình xem chi tiết tranh chấp.
    it('throws DisputeForbiddenException when non-participant accesses dispute detail', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      await expect(
        service.getDisputeDetail(999, RoleName.CLIENT, 5),
      ).rejects.toThrow(DisputeForbiddenException());
    });
  });

  // =========================================================================
  // UF-150: submitResponse
  // =========================================================================
  describe('UF-150 submitResponse', () => {
    // UF-150: Bên bị tranh chấp gửi văn bản phản hồi và bằng chứng thành công.
    it('submits counter-response with explanation and files by respondent', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);
      disputeRepo.hasUserSubmittedEvidence.mockResolvedValueOnce(false);
      disputeRepo.findSharedFilesByIds.mockResolvedValueOnce([{ id: 2 }]);
      const updatedDispute = {
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      };
      disputeRepo.submitResponseTransaction.mockResolvedValueOnce(
        updatedDispute,
      );

      const body: SubmitDisputeResponseBodyType = {
        description:
          'All requested requirements were delivered according to specification',
        evidenceFiles: [{ fileId: 2 }],
      };

      const result = await service.submitResponse(2, 5, body);

      expect(result.status).toBe(DisputeStatus.UNDER_REVIEW);
      expect(disputeRepo.submitResponseTransaction).toHaveBeenCalledWith(
        5,
        2,
        body.description,
        body.evidenceFiles,
      );
    });

    // Ném ngoại lệ DisputeForbiddenException khi người mở tranh chấp cố tình gửi phản hồi thay cho bên bị tranh chấp.
    it('throws DisputeForbiddenException when opener attempts to submit respondent defense', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const body: SubmitDisputeResponseBodyType = {
        description: 'Invalid caller response',
      };

      await expect(service.submitResponse(1, 5, body)).rejects.toThrow(
        DisputeForbiddenException(),
      );
      expect(disputeRepo.submitResponseTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeResponseAlreadySubmittedException khi phản hồi lặp lại lần thứ hai.
    it('throws DisputeResponseAlreadySubmittedException on duplicate response submission', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);
      disputeRepo.hasUserSubmittedEvidence.mockResolvedValueOnce(true);

      const body: SubmitDisputeResponseBodyType = {
        description: 'Second response attempt',
      };

      await expect(service.submitResponse(2, 5, body)).rejects.toThrow(
        DisputeResponseAlreadySubmittedException(),
      );
      expect(disputeRepo.submitResponseTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeResponseNotAllowedException khi trạng thái tranh chấp không còn cho phép phản hồi.
    it('throws DisputeResponseNotAllowedException when dispute is not awaiting response', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.FINALIZED,
      });

      const body: SubmitDisputeResponseBodyType = {
        description: 'Late response',
      };

      await expect(service.submitResponse(2, 5, body)).rejects.toThrow(
        DisputeResponseNotAllowedException(),
      );
    });
  });

  // =========================================================================
  // UF-151: submitDecisionReview
  // =========================================================================
  describe('UF-151 submitDecisionReview', () => {
    // UF-151: Một bên từ chối phương án phân chia của Admin kèm lý do bắt buộc.
    it('rejects proposed split with reason and transitions to REVIEW_REQUESTED', async () => {
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(200.0),
        clientAmount: new Prisma.Decimal(300.0),
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(decisionDispute);
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
      ]);
      const reviewRequestedDispute = {
        ...decisionDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
      };
      disputeRepo.updateDisputeStatus.mockResolvedValueOnce(
        reviewRequestedDispute,
      );

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.REJECTED,
        reason: 'Client refund portion is insufficient',
      };

      const result = await service.submitDecisionReview(1, 5, body);

      expect(result!.status).toBe(DisputeStatus.REVIEW_REQUESTED);
      expect(disputeRepo.upsertDecisionReview).toHaveBeenCalledWith(
        5,
        1,
        DisputeDecisionResponse.REJECTED,
        'Client refund portion is insufficient',
      );
    });

    // Tự động hoàn tất và giải ngân khi cả hai bên Khách hàng và Freelancer cùng chấp thuận phương án phân chia.
    it('automatically finalizes dispute when both parties accept resolution', async () => {
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(250.0),
        clientAmount: new Prisma.Decimal(250.0),
        decisionReason: 'Equal compromise settlement',
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(decisionDispute);
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
        { userId: 2, response: DisputeDecisionResponse.ACCEPTED },
      ]);
      const finalized = { ...decisionDispute, status: DisputeStatus.FINALIZED };
      disputeRepo.finalizeDisputeTransaction.mockResolvedValueOnce(finalized);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.ACCEPTED,
      };

      const result = await service.submitDecisionReview(1, 5, body);

      expect(result!.status).toBe(DisputeStatus.FINALIZED);
      expect(disputeRepo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 250,
          clientAmount: 250,
        }),
      );
    });

    // Ném ngoại lệ DisputeReviewReasonRequiredException khi từ chối phương án mà không cung cấp lý do.
    it('throws DisputeReviewReasonRequiredException when rejection reason is missing', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce({
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
      });
      disputeRepo.findDecisionReviews.mockResolvedValueOnce([
        { userId: 1, response: DisputeDecisionResponse.PENDING },
      ]);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.REJECTED,
        reason: '',
      };

      await expect(service.submitDecisionReview(1, 5, body)).rejects.toThrow(
        DisputeReviewReasonRequiredException(),
      );
      expect(disputeRepo.upsertDecisionReview).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeDecisionNotPendingException khi phương án không ở trạng thái DECISION_MADE.
    it('throws DisputeDecisionNotPendingException when dispute is not in DECISION_MADE', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const body: ReviewDisputeDecisionBodyType = {
        response: DisputeDecisionResponse.ACCEPTED,
      };

      await expect(service.submitDecisionReview(1, 5, body)).rejects.toThrow(
        DisputeDecisionNotPendingException(),
      );
    });

    // Schema từ chối khi phản hồi không thuộc ACCEPTED hoặc REJECTED.
    it('rejects invalid response enum through ReviewDisputeDecisionBodySchema', () => {
      const parsed = ReviewDisputeDecisionBodySchema.safeParse({
        response: 'MAYBE',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-152: adminMakeDecision
  // =========================================================================
  describe('UF-152 adminMakeDecision', () => {
    // UF-152: Quản trị viên đề xuất phương án phân bổ số tiền giải quyết tranh chấp hợp lệ.
    it('proposes valid split resolution allocation by administrator', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);
      const decisionDispute = {
        ...mockDispute,
        status: DisputeStatus.DECISION_MADE,
        freelancerAmount: new Prisma.Decimal(300.0),
        clientAmount: new Prisma.Decimal(200.0),
      };
      disputeRepo.makeDecisionTransaction.mockResolvedValueOnce(
        decisionDispute,
      );

      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 300,
        clientAmount: 200,
        decisionReason: 'Milestone 60% delivered satisfactorily',
      };

      const result = await service.adminMakeDecision(
        99,
        RoleName.ADMIN,
        5,
        body,
      );

      expect(result!.status).toBe(DisputeStatus.DECISION_MADE);
      expect(disputeRepo.makeDecisionTransaction).toHaveBeenCalledWith(
        5,
        99,
        300,
        200,
        'Milestone 60% delivered satisfactorily',
        1,
        2,
      );
    });

    // Ném ngoại lệ DisputeInvalidSplitAmountException khi tổng số tiền phân chia không bằng ngân sách milestone.
    it('throws DisputeInvalidSplitAmountException when split sum differs from milestone amount', async () => {
      disputeRepo.findDisputeById.mockResolvedValueOnce(mockDispute);

      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 200,
        clientAmount: 200,
        decisionReason: 'Mismatch sum',
      };

      await expect(
        service.adminMakeDecision(99, RoleName.ADMIN, 5, body),
      ).rejects.toThrow(DisputeInvalidSplitAmountException());
      expect(disputeRepo.makeDecisionTransaction).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ DisputeForbiddenException khi người dùng không phải Quản trị viên đưa ra phán quyết.
    it('throws DisputeForbiddenException when non-admin attempts to propose resolution', async () => {
      const body: AdminDisputeDecisionBodyType = {
        freelancerAmount: 300,
        clientAmount: 200,
        decisionReason: 'Unauthorized',
      };

      await expect(
        service.adminMakeDecision(1, RoleName.CLIENT, 5, body),
      ).rejects.toThrow(DisputeForbiddenException());
    });

    // Quản trị viên đưa ra phán quyết chung cuộc có tính ràng buộc khi hai bên không đạt được thỏa thuận.
    it('issues final binding decision when consensus cannot be reached', async () => {
      const reviewRequestedDispute = {
        ...mockDispute,
        status: DisputeStatus.REVIEW_REQUESTED,
        milestone: mockMilestone,
      };
      disputeRepo.findDisputeById.mockResolvedValueOnce(reviewRequestedDispute);
      const finalized = {
        ...reviewRequestedDispute,
        status: DisputeStatus.FINALIZED,
      };
      disputeRepo.finalizeDisputeTransaction.mockResolvedValueOnce(finalized);

      const body: AdminDisputeFinalDecisionBodyType = {
        freelancerAmount: 350,
        clientAmount: 150,
        decisionReason: 'Final administrative determination',
      };

      const result = await service.adminFinalDecision(
        99,
        RoleName.ADMIN,
        5,
        body,
      );

      expect(result!.status).toBe(DisputeStatus.FINALIZED);
      expect(disputeRepo.finalizeDisputeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 5,
          freelancerAmount: 350,
          clientAmount: 150,
        }),
      );
    });

    // Schema từ chối khi số tiền hoàn cho khách âm.
    it('rejects negative clientAmount through AdminDisputeDecisionBodySchema', () => {
      const parsed = AdminDisputeDecisionBodySchema.safeParse({
        freelancerAmount: 500,
        clientAmount: -50,
        decisionReason: 'Invalid',
      });
      expect(parsed.success).toBe(false);
    });
  });
});
