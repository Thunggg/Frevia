import {
  ContractStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
  SubmissionStatus,
} from '@prisma/client';
import {
  CreateMilestoneBodySchema,
  CreateMilestoneBodyType,
  GetMilestoneListQuerySchema,
  GetMilestoneListQueryType,
  RequestChangesBodySchema,
  RequestChangesBodyType,
  RoleName,
  SubmitMilestoneBodySchema,
  SubmitMilestoneBodyType,
  UpdateMilestoneBodyType,
} from '@shared/types';
import {
  MilestoneAlreadyInProgressException,
  MilestoneAmountExceedsContractException,
  MilestoneCannotBeDeletedException,
  MilestoneCannotBeEditedException,
  MilestoneContractNotActiveException,
  MilestoneContractNotFoundException,
  MilestoneForbiddenException,
  MilestoneNotFoundException,
  MilestonePaymentStatusException,
} from '../../src/routes/milestone/milestone.error';
import { MilestoneRepository } from '../../src/routes/milestone/milestone.repo';
import { MilestoneService } from '../../src/routes/milestone/milestone.service';
import {
  FailedToUploadMilestoneFileException,
  MilestoneFileContractNotFoundException,
  MilestoneFileForbiddenException,
  MilestoneFileMilestoneNotFoundException,
  MilestoneFileNotFoundException,
  MilestoneFileRequiredException,
} from '../../src/routes/milestone-file/milestone-file.error';
import { MilestoneFileRepository } from '../../src/routes/milestone-file/milestone-file.repo';
import { MilestoneFileService } from '../../src/routes/milestone-file/milestone-file.service';
import {
  MilestoneNotFundedException,
  MilestoneNotInProgressException,
  SubmissionContractNotFoundException,
  SubmissionForbiddenException,
  SubmissionNotFoundException,
  SubmissionNotPendingReviewException,
} from '../../src/routes/milestone-submission/milestone-submission.error';
import { MilestoneSubmissionRepository } from '../../src/routes/milestone-submission/milestone-submission.repo';
import { MilestoneSubmissionService } from '../../src/routes/milestone-submission/milestone-submission.service';
import { CloudinaryService } from '../../src/shared/services/cloudinary.service';

describe('Milestone Management (UF-132 to UF-146)', () => {
  const milestoneRepository = {
    findContractById: jest.fn(),
    findMilestoneById: jest.fn(),
    getMilestoneList: jest.fn(),
    getMilestoneDetail: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
    progressMilestone: jest.fn(),
    getTotalMilestoneAmount: jest.fn(),
    findInProgressMilestone: jest.fn(),
  };

  const milestoneFileRepository = {
    findContractById: jest.fn(),
    findMilestoneById: jest.fn(),
    getMilestoneFiles: jest.fn(),
    findFileById: jest.fn(),
    createMilestoneFile: jest.fn(),
    softDeleteFile: jest.fn(),
  };

  const submissionRepository = {
    findContractById: jest.fn(),
    findMilestoneById: jest.fn(),
    createSubmission: jest.fn(),
    getSubmission: jest.fn(),
    getSubmissionDetail: jest.fn(),
    findSubmissionById: jest.fn(),
    requestChanges: jest.fn(),
    approveSubmission: jest.fn(),
  };

  const cloudinaryService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const milestoneService = new MilestoneService(
    milestoneRepository as unknown as MilestoneRepository,
  );

  const milestoneFileService = new MilestoneFileService(
    milestoneFileRepository as unknown as MilestoneFileRepository,
    cloudinaryService as unknown as CloudinaryService,
  );

  const submissionService = new MilestoneSubmissionService(
    submissionRepository as unknown as MilestoneSubmissionRepository,
  );

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockContract = {
    id: 10,
    clientId: 1,
    freelancerId: 2,
    totalAmount: new Prisma.Decimal(1000.0),
    status: ContractStatus.ACTIVE,
  };

  const mockMilestone = {
    id: 100,
    contractId: 10,
    title: 'Milestone 1',
    description: 'Initial development delivery',
    amount: new Prisma.Decimal(400.0),
    status: MilestoneStatus.PENDING,
    paymentStatus: MilestonePaymentStatus.PENDING,
    dueDate: mockDate,
    completedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    deletedAt: null,
  };

  const mockSubmission = {
    id: 50,
    milestoneId: 100,
    freelancerId: 2,
    message: 'Finished implementation for review',
    links: ['https://github.com/frevia/repo'],
    status: SubmissionStatus.PENDING_REVIEW,
    changeRequestMessage: null,
    changeRequestDueDate: null,
    submittedAt: mockDate,
    reviewedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockMilestoneFile = {
    id: 30,
    milestoneId: 100,
    uploaderId: 2,
    fileUrl: 'https://cloudinary.com/frevia/milestones/100/preview.png',
    publicId: 'frevia/milestones/100/preview',
    fileName: 'preview.png',
    createdAt: mockDate,
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-132: getMilestoneList
  // =========================================================================
  describe('UF-132 getMilestoneList', () => {
    // UF-132: Lấy danh sách milestone của hợp đồng kèm phân trang cho người tham gia hợp đồng.
    it('returns paginated milestones for contract participant', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      const expectedData = {
        data: [mockMilestone],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      };
      milestoneRepository.getMilestoneList.mockResolvedValueOnce(expectedData);

      const query: GetMilestoneListQueryType = { page: 1, limit: 10 };
      const result = await milestoneService.getMilestoneList(
        1,
        RoleName.CLIENT,
        10,
        query,
      );

      expect(result).toEqual(expectedData);
      expect(milestoneRepository.getMilestoneList).toHaveBeenCalledWith(
        10,
        query,
      );
    });

    // Quản trị viên hệ thống có quyền lấy danh sách milestone của bất kỳ hợp đồng nào.
    it('returns milestones for admin role', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getMilestoneList.mockResolvedValueOnce({
        data: [mockMilestone],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      });

      const query: GetMilestoneListQueryType = { page: 1, limit: 10 };
      const result = await milestoneService.getMilestoneList(
        99,
        RoleName.ADMIN,
        10,
        query,
      );

      expect(result.data).toHaveLength(1);
    });

    // Ném ngoại lệ MilestoneContractNotFoundException khi hợp đồng không tồn tại.
    it('throws MilestoneContractNotFoundException when contract does not exist', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        milestoneService.getMilestoneList(1, RoleName.CLIENT, 999, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(MilestoneContractNotFoundException());
      expect(milestoneRepository.getMilestoneList).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneForbiddenException khi người ngoài không có quyền xem milestone.
    it('throws MilestoneForbiddenException when non-participant tries to view milestones', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        milestoneService.getMilestoneList(999, RoleName.CLIENT, 10, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(MilestoneForbiddenException());
      expect(milestoneRepository.getMilestoneList).not.toHaveBeenCalled();
    });

    // Schema query từ chối khi số lượng limit vượt quá 50.
    it('rejects limit > 50 through GetMilestoneListQuerySchema', () => {
      const parsed = GetMilestoneListQuerySchema.safeParse({ limit: 100 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-133: getMilestoneDetail
  // =========================================================================
  describe('UF-133 getMilestoneDetail', () => {
    // UF-133: Lấy chi tiết milestone thành công theo ID cho bên tham gia hợp đồng.
    it('returns milestone detail for contract participant', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getMilestoneDetail.mockResolvedValueOnce(
        mockMilestone,
      );

      const result = await milestoneService.getMilestoneDetail(
        1,
        RoleName.CLIENT,
        10,
        100,
      );

      expect(result).toEqual(mockMilestone);
      expect(milestoneRepository.getMilestoneDetail).toHaveBeenCalledWith(100);
    });

    // Ném ngoại lệ MilestoneContractNotFoundException khi hợp đồng không tồn tại.
    it('throws MilestoneContractNotFoundException when contract does not exist', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        milestoneService.getMilestoneDetail(1, RoleName.CLIENT, 999, 100),
      ).rejects.toThrow(MilestoneContractNotFoundException());
    });

    // Ném ngoại lệ MilestoneNotFoundException khi mã milestone không tồn tại.
    it('throws MilestoneNotFoundException when milestone is not found', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getMilestoneDetail.mockResolvedValueOnce(null);

      await expect(
        milestoneService.getMilestoneDetail(1, RoleName.CLIENT, 10, 999),
      ).rejects.toThrow(MilestoneNotFoundException());
    });

    // Ném ngoại lệ MilestoneForbiddenException khi milestone thuộc hợp đồng khác.
    it('throws MilestoneForbiddenException when milestone belongs to a different contract', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getMilestoneDetail.mockResolvedValueOnce({
        ...mockMilestone,
        contractId: 888,
      });

      await expect(
        milestoneService.getMilestoneDetail(1, RoleName.CLIENT, 10, 100),
      ).rejects.toThrow(MilestoneForbiddenException());
    });
  });

  // =========================================================================
  // UF-134: createMilestone
  // =========================================================================
  describe('UF-134 createMilestone', () => {
    // UF-134: Khách hàng tạo mới milestone thành công khi hợp đồng đang ở trạng thái ACTIVE.
    it('creates milestone successfully on active contract within budget', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getTotalMilestoneAmount.mockResolvedValueOnce(400);
      milestoneRepository.createMilestone.mockResolvedValueOnce(mockMilestone);

      const body: CreateMilestoneBodyType = {
        title: 'New Milestone',
        amount: 300,
        description: 'Frontend features',
      };

      const result = await milestoneService.createMilestone(1, 10, body);

      expect(result).toEqual(mockMilestone);
      expect(milestoneRepository.createMilestone).toHaveBeenCalledWith(
        10,
        body,
      );
    });

    // Ném ngoại lệ MilestoneForbiddenException khi Freelancer cố tạo milestone cho hợp đồng.
    it('throws MilestoneForbiddenException when non-client attempts creation', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);

      const body: CreateMilestoneBodyType = {
        title: 'Unauthorized',
        amount: 100,
      };

      await expect(
        milestoneService.createMilestone(2, 10, body),
      ).rejects.toThrow(MilestoneForbiddenException());
      expect(milestoneRepository.createMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneContractNotActiveException khi hợp đồng ở trạng thái COMPLETED hoặc CANCELLED.
    it('throws MilestoneContractNotActiveException when contract is completed or cancelled', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.COMPLETED,
      });

      const body: CreateMilestoneBodyType = {
        title: 'Late Milestone',
        amount: 100,
      };

      await expect(
        milestoneService.createMilestone(1, 10, body),
      ).rejects.toThrow(MilestoneContractNotActiveException());
      expect(milestoneRepository.createMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneAmountExceedsContractException khi tổng tiền milestone vượt quá ngân sách hợp đồng.
    it('throws MilestoneAmountExceedsContractException when total exceeds contract budget', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.getTotalMilestoneAmount.mockResolvedValueOnce(900);

      const body: CreateMilestoneBodyType = {
        title: 'Over Budget',
        amount: 200,
      };

      await expect(
        milestoneService.createMilestone(1, 10, body),
      ).rejects.toThrow(MilestoneAmountExceedsContractException());
      expect(milestoneRepository.createMilestone).not.toHaveBeenCalled();
    });

    // Schema từ chối khi tiêu đề milestone rỗng hoặc số tiền nhỏ hơn hoặc bằng 0.
    it('rejects empty title and negative amount through CreateMilestoneBodySchema', () => {
      const parsedEmpty = CreateMilestoneBodySchema.safeParse({
        title: '',
        amount: 100,
      });
      expect(parsedEmpty.success).toBe(false);

      const parsedNegative = CreateMilestoneBodySchema.safeParse({
        title: 'Valid',
        amount: -50,
      });
      expect(parsedNegative.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-135: updateMilestone
  // =========================================================================
  describe('UF-135 updateMilestone', () => {
    // UF-135: Khách hàng cập nhật thành công tiêu đề và ngân sách của milestone đang ở trạng thái PENDING.
    it('updates milestone successfully while in PENDING status', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneRepository.getTotalMilestoneAmount.mockResolvedValueOnce(200);
      const updated = {
        ...mockMilestone,
        title: 'Updated Title',
        amount: new Prisma.Decimal(350.0),
      };
      milestoneRepository.updateMilestone.mockResolvedValueOnce(updated);

      const body: UpdateMilestoneBodyType = {
        title: 'Updated Title',
        amount: 350,
      };
      const result = await milestoneService.updateMilestone(1, 10, 100, body);

      expect(result.title).toBe('Updated Title');
      expect(milestoneRepository.updateMilestone).toHaveBeenCalledWith(
        100,
        body,
      );
    });

    // Ném ngoại lệ MilestoneCannotBeEditedException khi milestone không còn ở trạng thái PENDING.
    it('throws MilestoneCannotBeEditedException when milestone is already in progress', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      });

      await expect(
        milestoneService.updateMilestone(1, 10, 100, { title: 'Too late' }),
      ).rejects.toThrow(MilestoneCannotBeEditedException());
      expect(milestoneRepository.updateMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneAmountExceedsContractException khi cập nhật số tiền vượt quá tổng giá trị hợp đồng.
    it('throws MilestoneAmountExceedsContractException when updated amount exceeds remaining budget', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneRepository.getTotalMilestoneAmount.mockResolvedValueOnce(800);

      const body: UpdateMilestoneBodyType = { amount: 300 };

      await expect(
        milestoneService.updateMilestone(1, 10, 100, body),
      ).rejects.toThrow(MilestoneAmountExceedsContractException());
      expect(milestoneRepository.updateMilestone).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-136: deleteMilestone
  // =========================================================================
  describe('UF-136 deleteMilestone', () => {
    // UF-136: Khách hàng xóa thành công milestone ở trạng thái PENDING.
    it('deletes milestone successfully while in PENDING status', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneRepository.deleteMilestone.mockResolvedValueOnce(mockMilestone);

      const result = await milestoneService.deleteMilestone(1, 10, 100);

      expect(result).toEqual(mockMilestone);
      expect(milestoneRepository.deleteMilestone).toHaveBeenCalledWith(100);
    });

    // Ném ngoại lệ MilestoneCannotBeDeletedException khi milestone đã bắt đầu thực hiện hoặc đã thanh toán.
    it('throws MilestoneCannotBeDeletedException when milestone is not in PENDING status', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        status: MilestoneStatus.COMPLETED,
      });

      await expect(
        milestoneService.deleteMilestone(1, 10, 100),
      ).rejects.toThrow(MilestoneCannotBeDeletedException());
      expect(milestoneRepository.deleteMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneForbiddenException khi Freelancer cố gắng xóa milestone.
    it('throws MilestoneForbiddenException when non-client attempts milestone deletion', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        milestoneService.deleteMilestone(2, 10, 100),
      ).rejects.toThrow(MilestoneForbiddenException());
      expect(milestoneRepository.deleteMilestone).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-137: requestChanges
  // =========================================================================
  describe('UF-137 requestChanges', () => {
    // UF-137: Khách hàng yêu cầu chỉnh sửa bài nộp kèm thông tin phản hồi chi tiết.
    it('requests changes successfully on submission with feedback message', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.findSubmissionById.mockResolvedValueOnce(
        mockSubmission,
      );
      const updatedSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.CHANGES_REQUESTED,
        changeRequestMessage: 'Please fix responsive styling on mobile',
      };
      submissionRepository.requestChanges.mockResolvedValueOnce(
        updatedSubmission,
      );

      const body: RequestChangesBodyType = {
        changeRequestMessage: 'Please fix responsive styling on mobile',
      };

      const result = await submissionService.requestChanges(
        1,
        RoleName.CLIENT,
        10,
        100,
        50,
        body,
      );

      expect(result.status).toBe(SubmissionStatus.CHANGES_REQUESTED);
      expect(submissionRepository.requestChanges).toHaveBeenCalledWith(
        50,
        100,
        body,
      );
    });

    // Ném ngoại lệ SubmissionForbiddenException khi Freelancer cố tự yêu cầu sửa trên bài làm của mình.
    it('throws SubmissionForbiddenException when freelancer tries to request changes', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);

      const body: RequestChangesBodyType = {
        changeRequestMessage: 'Self feedback',
      };

      await expect(
        submissionService.requestChanges(
          2,
          RoleName.FREELANCER,
          10,
          100,
          50,
          body,
        ),
      ).rejects.toThrow(SubmissionForbiddenException());
    });

    // Ném ngoại lệ SubmissionNotPendingReviewException khi bài nộp không ở trạng thái chờ duyệt.
    it('throws SubmissionNotPendingReviewException when submission is already reviewed', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.findSubmissionById.mockResolvedValueOnce({
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
      });

      const body: RequestChangesBodyType = {
        changeRequestMessage: 'Late change request',
      };

      await expect(
        submissionService.requestChanges(1, RoleName.CLIENT, 10, 100, 50, body),
      ).rejects.toThrow(SubmissionNotPendingReviewException());
    });

    // Schema từ chối khi tin nhắn yêu cầu thay đổi rỗng.
    it('rejects empty message through RequestChangesBodySchema', () => {
      const parsed = RequestChangesBodySchema.safeParse({
        changeRequestMessage: '',
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-138: approveMilestone
  // =========================================================================
  describe('UF-138 approveMilestone', () => {
    // UF-138: Khách hàng nghiệm thu bài nộp milestone thành công.
    it('approves milestone submission successfully by client', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.findSubmissionById.mockResolvedValueOnce(
        mockSubmission,
      );
      const approved = { ...mockSubmission, status: SubmissionStatus.APPROVED };
      submissionRepository.approveSubmission.mockResolvedValueOnce(approved);

      const result = await submissionService.approveMilestone(
        1,
        RoleName.CLIENT,
        10,
        100,
        50,
      );

      expect(result.status).toBe(SubmissionStatus.APPROVED);
      expect(submissionRepository.approveSubmission).toHaveBeenCalledWith(
        50,
        100,
      );
    });

    // Ném ngoại lệ SubmissionForbiddenException khi Freelancer cố gắng tự duyệt milestone của mình.
    it('throws SubmissionForbiddenException when freelancer attempts self-approval', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        submissionService.approveMilestone(2, RoleName.FREELANCER, 10, 100, 50),
      ).rejects.toThrow(SubmissionForbiddenException());
    });

    // Ném ngoại lệ SubmissionNotPendingReviewException khi bài nộp đã được duyệt trước đó.
    it('throws SubmissionNotPendingReviewException when submission was already approved', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.findSubmissionById.mockResolvedValueOnce({
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
      });

      await expect(
        submissionService.approveMilestone(1, RoleName.CLIENT, 10, 100, 50),
      ).rejects.toThrow(SubmissionNotPendingReviewException());
    });
  });

  // =========================================================================
  // UF-139: progressMilestone
  // =========================================================================
  describe('UF-139 progressMilestone', () => {
    // UF-139: Freelancer bắt đầu thực hiện milestone đã được nạp tiền vào quỹ ký quỹ.
    it('starts milestone progress when funded and in pending status', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      const fundedPending = {
        ...mockMilestone,
        status: MilestoneStatus.PENDING,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      };
      milestoneRepository.findMilestoneById.mockResolvedValueOnce(
        fundedPending,
      );
      milestoneRepository.findInProgressMilestone.mockResolvedValueOnce(null);
      const inProgress = {
        ...fundedPending,
        status: MilestoneStatus.IN_PROGRESS,
      };
      milestoneRepository.progressMilestone.mockResolvedValueOnce(inProgress);

      const result = await milestoneService.progressMilestone(2, 10, 100);

      expect(result.status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(milestoneRepository.progressMilestone).toHaveBeenCalledWith(100);
    });

    // Ném ngoại lệ MilestoneForbiddenException khi người gọi không phải là Freelancer của hợp đồng.
    it('throws MilestoneForbiddenException when non-freelancer attempts to start work', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        milestoneService.progressMilestone(1, 10, 100),
      ).rejects.toThrow(MilestoneForbiddenException());
      expect(milestoneRepository.progressMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestonePaymentStatusException khi milestone chưa được khách nạp tiền ký quỹ.
    it('throws MilestonePaymentStatusException when milestone escrow is unfunded', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.PENDING,
      });

      await expect(
        milestoneService.progressMilestone(2, 10, 100),
      ).rejects.toThrow(MilestonePaymentStatusException());
      expect(milestoneRepository.progressMilestone).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneAlreadyInProgressException khi hợp đồng đã có một milestone khác đang chạy.
    it('throws MilestoneAlreadyInProgressException when another milestone is running', async () => {
      milestoneRepository.findContractById.mockResolvedValueOnce(mockContract);
      milestoneRepository.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      });
      milestoneRepository.findInProgressMilestone.mockResolvedValueOnce({
        id: 99,
        contractId: 10,
        status: MilestoneStatus.IN_PROGRESS,
      });

      await expect(
        milestoneService.progressMilestone(2, 10, 100),
      ).rejects.toThrow(MilestoneAlreadyInProgressException());
      expect(milestoneRepository.progressMilestone).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-140: getMilestoneFiles
  // =========================================================================
  describe('UF-140 getMilestoneFiles', () => {
    // UF-140: Lấy danh sách tệp đính kèm của milestone thành công cho người tham gia.
    it('returns milestone files for contract participant', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneFileRepository.getMilestoneFiles.mockResolvedValueOnce([
        mockMilestoneFile,
      ]);

      const result = await milestoneFileService.getMilestoneFiles(
        1,
        RoleName.CLIENT,
        10,
        100,
      );

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('preview.png');
      expect(milestoneFileRepository.getMilestoneFiles).toHaveBeenCalledWith(
        100,
      );
    });

    // Ném ngoại lệ MilestoneFileContractNotFoundException khi hợp đồng không tồn tại.
    it('throws MilestoneFileContractNotFoundException when contract does not exist', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        milestoneFileService.getMilestoneFiles(1, RoleName.CLIENT, 999, 100),
      ).rejects.toThrow(MilestoneFileContractNotFoundException());
    });

    // Ném ngoại lệ MilestoneFileMilestoneNotFoundException khi milestone không tồn tại.
    it('throws MilestoneFileMilestoneNotFoundException when milestone does not exist', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(null);

      await expect(
        milestoneFileService.getMilestoneFiles(1, RoleName.CLIENT, 10, 999),
      ).rejects.toThrow(MilestoneFileMilestoneNotFoundException());
    });

    // Ném ngoại lệ MilestoneFileForbiddenException khi người ngoài cố xem tệp milestone.
    it('throws MilestoneFileForbiddenException when non-participant tries to access files', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );

      await expect(
        milestoneFileService.getMilestoneFiles(999, RoleName.CLIENT, 10, 100),
      ).rejects.toThrow(MilestoneFileForbiddenException());
    });
  });

  // =========================================================================
  // UF-141: uploadMilestoneFile
  // =========================================================================
  describe('UF-141 uploadMilestoneFile', () => {
    const mockFile = {
      originalname: 'deliverable.zip',
      buffer: Buffer.from('dummy-zip-bytes'),
      mimetype: 'application/zip',
      size: 2048,
    } as Express.Multer.File;

    // UF-141: Người tham gia tải lên tệp đính kèm sản phẩm bàn giao thành công.
    it('uploads deliverable file to Cloudinary and database successfully', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      cloudinaryService.uploadFile.mockResolvedValueOnce({
        secure_url:
          'https://cloudinary.com/frevia/milestones/100/deliverable.zip',
        public_id: 'frevia/milestones/100/deliverable',
      });
      milestoneFileRepository.createMilestoneFile.mockResolvedValueOnce({
        id: 31,
        milestoneId: 100,
        uploaderId: 2,
        fileUrl: 'https://cloudinary.com/frevia/milestones/100/deliverable.zip',
        publicId: 'frevia/milestones/100/deliverable',
        fileName: 'deliverable.zip',
      });

      const result = await milestoneFileService.uploadMilestoneFile(
        2,
        10,
        100,
        mockFile,
      );

      expect(result.fileName).toBe('deliverable.zip');
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'frevia/milestones/100',
      );
    });

    // Ném ngoại lệ MilestoneFileRequiredException khi không có tệp nào được gửi lên.
    it('throws MilestoneFileRequiredException when file is missing in upload request', async () => {
      await expect(
        milestoneFileService.uploadMilestoneFile(2, 10, 100, null as never),
      ).rejects.toThrow(MilestoneFileRequiredException());
    });

    // Ném ngoại lệ MilestoneFileForbiddenException khi người ngoài tải tệp vào milestone.
    it('throws MilestoneFileForbiddenException when non-participant uploads file', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );

      await expect(
        milestoneFileService.uploadMilestoneFile(999, 10, 100, mockFile),
      ).rejects.toThrow(MilestoneFileForbiddenException());
    });

    // Xóa file trên Cloudinary khi quá trình ghi dữ liệu vào database xảy ra lỗi.
    it('rolls back Cloudinary upload when repository database insertion fails', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      cloudinaryService.uploadFile.mockResolvedValueOnce({
        secure_url:
          'https://cloudinary.com/frevia/milestones/100/deliverable.zip',
        public_id: 'frevia/milestones/100/deliverable',
      });
      milestoneFileRepository.createMilestoneFile.mockRejectedValueOnce(
        new Error('Database write failure'),
      );

      await expect(
        milestoneFileService.uploadMilestoneFile(2, 10, 100, mockFile),
      ).rejects.toThrow(FailedToUploadMilestoneFileException());

      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'frevia/milestones/100/deliverable',
      );
    });
  });

  // =========================================================================
  // UF-142: deleteMilestoneFile
  // =========================================================================
  describe('UF-142 deleteMilestoneFile', () => {
    // UF-142: Người tải lên xóa tệp bàn giao thành công và giải phóng dung lượng trên Cloudinary.
    it('deletes milestone file successfully by uploader', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneFileRepository.findFileById.mockResolvedValueOnce(
        mockMilestoneFile,
      );
      cloudinaryService.deleteFile.mockResolvedValueOnce(undefined);
      milestoneFileRepository.softDeleteFile.mockResolvedValueOnce({
        ...mockMilestoneFile,
        deletedAt: new Date(),
      });

      const result = await milestoneFileService.deleteMilestoneFile(
        2,
        10,
        100,
        30,
      );

      expect(result.deletedAt).toBeDefined();
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'frevia/milestones/100/preview',
      );
      expect(milestoneFileRepository.softDeleteFile).toHaveBeenCalledWith(30);
    });

    // Ném ngoại lệ MilestoneFileForbiddenException khi người khác cố gắng xóa tệp của uploader.
    it('throws MilestoneFileForbiddenException when non-uploader attempts deletion', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneFileRepository.findFileById.mockResolvedValueOnce(
        mockMilestoneFile,
      );

      await expect(
        milestoneFileService.deleteMilestoneFile(1, 10, 100, 30),
      ).rejects.toThrow(MilestoneFileForbiddenException());
      expect(milestoneFileRepository.softDeleteFile).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneFileNotFoundException khi tệp không tồn tại hoặc đã bị xóa.
    it('throws MilestoneFileNotFoundException when file ID does not exist', async () => {
      milestoneFileRepository.findContractById.mockResolvedValueOnce(
        mockContract,
      );
      milestoneFileRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      milestoneFileRepository.findFileById.mockResolvedValueOnce(null);

      await expect(
        milestoneFileService.deleteMilestoneFile(2, 10, 100, 999),
      ).rejects.toThrow(MilestoneFileNotFoundException());
    });
  });

  // =========================================================================
  // UF-143: submitMilestone
  // =========================================================================
  describe('UF-143 submitMilestone', () => {
    // UF-143: Freelancer gửi bài nộp milestone thành công khi milestone đang thực hiện và đã ký quỹ.
    it('submits milestone deliverables successfully for funded in-progress milestone', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      };
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        inProgressMilestone,
      );
      submissionRepository.createSubmission.mockResolvedValueOnce(
        mockSubmission,
      );

      const body: SubmitMilestoneBodyType = {
        message: 'Completed first sprint tasks',
        links: ['https://frevia.io/demo'],
        fileIds: [30],
      };

      const result = await submissionService.submitMilestone(
        2,
        RoleName.FREELANCER,
        10,
        100,
        body,
      );

      expect(result).toEqual(mockSubmission);
      expect(submissionRepository.createSubmission).toHaveBeenCalledWith(
        100,
        2,
        body,
      );
    });

    // Freelancer nộp lại bài thành công khi milestone ở trạng thái CHANGES_REQUESTED.
    it('submits revised milestone deliverables when status is CHANGES_REQUESTED', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      const changesRequestedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.CHANGES_REQUESTED,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      };
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        changesRequestedMilestone,
      );
      submissionRepository.createSubmission.mockResolvedValueOnce(
        mockSubmission,
      );

      const body: SubmitMilestoneBodyType = {
        message: 'Addressed all feedback items',
        links: [],
        fileIds: [],
      };

      const result = await submissionService.submitMilestone(
        2,
        RoleName.FREELANCER,
        10,
        100,
        body,
      );

      expect(result).toEqual(mockSubmission);
    });

    // Ném ngoại lệ MilestoneNotInProgressException khi milestone ở trạng thái PENDING.
    it('throws MilestoneNotInProgressException when milestone is still in pending status', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );

      const body: SubmitMilestoneBodyType = {
        message: 'Too early submit',
        links: [],
        fileIds: [],
      };

      await expect(
        submissionService.submitMilestone(
          2,
          RoleName.FREELANCER,
          10,
          100,
          body,
        ),
      ).rejects.toThrow(MilestoneNotInProgressException());
    });

    // Ném ngoại lệ MilestoneNotFundedException khi milestone chưa được khách nạp tiền ký quỹ.
    it('throws MilestoneNotFundedException when milestone is unfunded', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce({
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
        paymentStatus: MilestonePaymentStatus.PENDING,
      });

      const body: SubmitMilestoneBodyType = {
        message: 'Unfunded submit',
        links: [],
        fileIds: [],
      };

      await expect(
        submissionService.submitMilestone(
          2,
          RoleName.FREELANCER,
          10,
          100,
          body,
        ),
      ).rejects.toThrow(MilestoneNotFundedException());
    });

    // Ném ngoại lệ SubmissionForbiddenException khi Khách hàng cố tình gửi bài nộp thay cho Freelancer.
    it('throws SubmissionForbiddenException when client attempts milestone submission', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);

      const body: SubmitMilestoneBodyType = {
        message: 'Client submit',
        links: [],
        fileIds: [],
      };

      await expect(
        submissionService.submitMilestone(1, RoleName.CLIENT, 10, 100, body),
      ).rejects.toThrow(SubmissionForbiddenException());
    });
  });

  // =========================================================================
  // UF-144: deleteMilestoneSubmission
  // =========================================================================
  describe('UF-144 deleteMilestoneSubmission', () => {
    // UF-144: Hệ thống hỗ trợ chu trình chỉnh sửa bài nộp thông qua submitMilestone khi có yêu cầu thay đổi.
    it('handles revision cycle cleanly through resubmission without hard delete', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      const changesMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.CHANGES_REQUESTED,
        paymentStatus: MilestonePaymentStatus.FUNDED,
      };
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        changesMilestone,
      );
      const revisedSubmission = {
        ...mockSubmission,
        id: 51,
        message: 'Revised implementation',
      };
      submissionRepository.createSubmission.mockResolvedValueOnce(
        revisedSubmission,
      );

      const body: SubmitMilestoneBodyType = {
        message: 'Revised implementation',
        links: ['https://frevia.io/v2'],
        fileIds: [],
      };

      const result = await submissionService.submitMilestone(
        2,
        RoleName.FREELANCER,
        10,
        100,
        body,
      );

      expect(result.id).toBe(51);
      expect(result.message).toBe('Revised implementation');
    });

    // Từ chối nộp bài khi URL liên kết trong body gửi lên không đúng định dạng website.
    it('rejects invalid link format through SubmitMilestoneBodySchema', () => {
      const parsed = SubmitMilestoneBodySchema.safeParse({
        links: ['invalid-url-string'],
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-145: getSubmission
  // =========================================================================
  describe('UF-145 getSubmission', () => {
    // UF-145: Lấy thông tin bài nộp của milestone thành công cho bên tham gia hợp đồng.
    it('returns submission detail for contract participant', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.getSubmissionDetail.mockResolvedValueOnce(
        mockSubmission,
      );

      const result = await submissionService.getSubmission(
        1,
        RoleName.CLIENT,
        10,
        100,
      );

      expect(result).toEqual(mockSubmission);
      expect(submissionRepository.getSubmissionDetail).toHaveBeenCalledWith(
        100,
      );
    });

    // Ném ngoại lệ SubmissionContractNotFoundException khi hợp đồng không tồn tại.
    it('throws SubmissionContractNotFoundException when contract does not exist', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        submissionService.getSubmission(1, RoleName.CLIENT, 999, 100),
      ).rejects.toThrow(SubmissionContractNotFoundException());
    });

    // Ném ngoại lệ SubmissionForbiddenException khi người ngoài cố truy cập bài nộp.
    it('throws SubmissionForbiddenException when non-participant accesses submission', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        submissionService.getSubmission(999, RoleName.CLIENT, 10, 100),
      ).rejects.toThrow(SubmissionForbiddenException());
    });
  });

  // =========================================================================
  // UF-146: getSubmissionDetail
  // =========================================================================
  describe('UF-146 getSubmissionDetail', () => {
    // UF-146: Lấy chi tiết bài nộp cụ thể theo ID thành công cho bên tham gia.
    it('returns specific submission detail by ID for participant', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.getSubmission.mockResolvedValueOnce(mockSubmission);

      const result = await submissionService.getSubmissionDetail(
        2,
        RoleName.FREELANCER,
        10,
        100,
        50,
      );

      expect(result).toEqual(mockSubmission);
      expect(submissionRepository.getSubmission).toHaveBeenCalledWith(50);
    });

    // Ném ngoại lệ SubmissionNotFoundException khi bài nộp không tồn tại hoặc thuộc milestone khác.
    it('throws SubmissionNotFoundException when submission does not match milestone', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);
      submissionRepository.findMilestoneById.mockResolvedValueOnce(
        mockMilestone,
      );
      submissionRepository.getSubmission.mockResolvedValueOnce({
        ...mockSubmission,
        milestoneId: 888,
      });

      await expect(
        submissionService.getSubmissionDetail(1, RoleName.CLIENT, 10, 100, 50),
      ).rejects.toThrow(SubmissionNotFoundException());
    });

    // Ném ngoại lệ SubmissionForbiddenException khi người ngoài cố truy cập chi tiết bài nộp.
    it('throws SubmissionForbiddenException when non-participant tries to access submission detail', async () => {
      submissionRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        submissionService.getSubmissionDetail(
          999,
          RoleName.CLIENT,
          10,
          100,
          50,
        ),
      ).rejects.toThrow(SubmissionForbiddenException());
    });
  });
});
