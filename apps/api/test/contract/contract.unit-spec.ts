import { ContractStatus, Prisma } from '@prisma/client';
import {
  CreateContractBodySchema,
  CreateContractBodyType,
  GetContractListQuerySchema,
  GetContractListQueryType,
  RoleName,
  UpdateContractBodySchema,
  UpdateContractBodyType,
} from '@shared/types';
import {
  AlreadySignedException,
  ContractAlreadyCancelledException,
  ContractAlreadyExistsException,
  ContractAwaitingPaymentException,
  ContractDisputedException,
  ContractForbiddenException,
  ContractNotActiveException,
  ContractNotFoundException,
  ContractNotPendingSignException,
  MilestoneAmountMismatchException,
  ProposalJobPositionsFilledException,
  ProposalNotActionableException,
  ProposalNotFoundException,
} from '../../src/routes/contract/contract.error';
import { ContractRepository } from '../../src/routes/contract/contract.repo';
import { ContractService } from '../../src/routes/contract/contract.service';
import { PaymentService } from '../../src/routes/payments/payment.service';
import {
  ContractNotFoundException as SharedFileContractNotFoundException,
  FailedToUploadSharedFileException,
  SharedFileDeleteExpiredException,
  SharedFileForbiddenException,
  SharedFileNotFoundException,
} from '../../src/routes/shared-file/shared-file.error';
import { SharedFileRepository } from '../../src/routes/shared-file/shared-file.repo';
import { SharedFileService } from '../../src/routes/shared-file/shared-file.service';
import { CloudinaryService } from '../../src/shared/services/cloudinary.service';
import { ContractPdfService } from '../../src/shared/services/contract-pdf.service';

describe('Contract Management (UF-122 to UF-131)', () => {
  const contractRepository = {
    findProposalWithJob: jest.fn(),
    findContractByProposalId: jest.fn(),
    findContractById: jest.fn(),
    findContractBySlug: jest.fn(),
    createContract: jest.fn(),
    updateContract: jest.fn(),
    signContract: jest.fn(),
    rejectContract: jest.fn(),
    completeContract: jest.fn(),
    cancelContract: jest.fn(),
    getContractList: jest.fn(),
    getContractDetail: jest.fn(),
  };

  const contractPdfService = {
    generateAndSaveContractPdf: jest.fn(),
  };

  const paymentService = {
    refundContractEscrow: jest.fn(),
  };

  const sharedFileRepository = {
    findContractById: jest.fn(),
    findByContractId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  const cloudinaryService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const contractService = new ContractService(
    contractRepository as unknown as ContractRepository,
    contractPdfService as unknown as ContractPdfService,
    paymentService as unknown as PaymentService,
  );

  const sharedFileService = new SharedFileService(
    sharedFileRepository as unknown as SharedFileRepository,
    cloudinaryService as unknown as CloudinaryService,
  );

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockProposal = {
    id: 10,
    freelancerId: 2,
    status: 'SUBMITTED',
    job: {
      id: 100,
      clientId: 1,
      positionsRequired: 1,
      positionsFilled: 0,
    },
  };

  const mockContract = {
    id: 5,
    slug: 'frevia-contract-slug-005',
    jobId: 100,
    proposalId: 10,
    clientId: 1,
    freelancerId: 2,
    terms: 'Initial agreement terms',
    totalAmount: new Prisma.Decimal(500.0),
    status: ContractStatus.PENDING_SIGN,
    signedByClient: false,
    signedByFreelancer: false,
    clientSignedAt: null,
    freelancerSignedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    completedAt: null,
    expiresAt: null,
    deletedAt: null,
  };

  const mockSharedFile = {
    id: 20,
    contractId: 5,
    uploaderId: 1,
    fileUrl: 'https://cloudinary.com/frevia/contracts/5/spec.pdf',
    publicId: 'frevia/contracts/5/spec',
    fileName: 'spec.pdf',
    createdAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-122: createContract
  // =========================================================================
  describe('UF-122 createContract', () => {
    // UF-122: Khách hàng tạo hợp đồng thành công từ đề xuất hợp lệ kèm danh sách milestone.
    it('creates contract successfully with matching milestones', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(
        mockProposal,
      );
      contractRepository.findContractByProposalId.mockResolvedValueOnce(null);
      contractRepository.createContract.mockResolvedValueOnce(mockContract);

      const body: CreateContractBodyType = {
        proposalId: 10,
        totalAmount: 500,
        terms: 'Work contract terms',
        milestones: [
          { title: 'Milestone 1', amount: 200 },
          { title: 'Milestone 2', amount: 300 },
        ],
      };

      const result = await contractService.createContract(1, body);

      expect(result).toEqual(mockContract);
      expect(contractRepository.createContract).toHaveBeenCalledWith(
        body,
        1,
        2,
        100,
      );
    });

    // Tạo hợp đồng thành công mà không cần danh sách milestone đi kèm.
    it('creates contract successfully without milestones', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(
        mockProposal,
      );
      contractRepository.findContractByProposalId.mockResolvedValueOnce(null);
      contractRepository.createContract.mockResolvedValueOnce(mockContract);

      const body: CreateContractBodyType = {
        proposalId: 10,
        totalAmount: 500,
        terms: 'Contract without milestones',
      };

      const result = await contractService.createContract(1, body);

      expect(result).toEqual(mockContract);
      expect(contractRepository.createContract).toHaveBeenCalledWith(
        body,
        1,
        2,
        100,
      );
    });

    // Ném ngoại lệ ProposalNotFoundException khi đề xuất không tồn tại trong hệ thống.
    it('throws ProposalNotFoundException when proposal does not exist', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(null);

      const body: CreateContractBodyType = {
        proposalId: 999,
        totalAmount: 500,
      };

      await expect(contractService.createContract(1, body)).rejects.toThrow(
        ProposalNotFoundException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ProposalNotActionableException khi trạng thái đề xuất không nằm trong danh sách cho phép.
    it('throws ProposalNotActionableException when proposal status is not actionable', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce({
        ...mockProposal,
        status: 'REJECTED',
      });

      const body: CreateContractBodyType = { proposalId: 10, totalAmount: 500 };

      await expect(contractService.createContract(1, body)).rejects.toThrow(
        ProposalNotActionableException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractForbiddenException khi người tạo không sở hữu công việc của đề xuất.
    it('throws ContractForbiddenException when client does not own the proposal job', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(
        mockProposal,
      );

      const body: CreateContractBodyType = { proposalId: 10, totalAmount: 500 };

      await expect(contractService.createContract(99, body)).rejects.toThrow(
        ContractForbiddenException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ProposalJobPositionsFilledException khi công việc đã đủ số lượng người được tuyển.
    it('throws ProposalJobPositionsFilledException when job positions are already filled', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce({
        ...mockProposal,
        job: { ...mockProposal.job, positionsRequired: 1, positionsFilled: 1 },
      });

      const body: CreateContractBodyType = { proposalId: 10, totalAmount: 500 };

      await expect(contractService.createContract(1, body)).rejects.toThrow(
        ProposalJobPositionsFilledException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ MilestoneAmountMismatchException khi tổng tiền các milestone không khớp ngân sách hợp đồng.
    it('throws MilestoneAmountMismatchException when milestone sum differs from total amount', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(
        mockProposal,
      );

      const body: CreateContractBodyType = {
        proposalId: 10,
        totalAmount: 500,
        milestones: [
          { title: 'Milestone 1', amount: 200 },
          { title: 'Milestone 2', amount: 200 },
        ],
      };

      await expect(contractService.createContract(1, body)).rejects.toThrow(
        MilestoneAmountMismatchException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractAlreadyExistsException khi đề xuất này đã có một hợp đồng được lập.
    it('throws ContractAlreadyExistsException when contract for proposal already exists', async () => {
      contractRepository.findProposalWithJob.mockResolvedValueOnce(
        mockProposal,
      );
      contractRepository.findContractByProposalId.mockResolvedValueOnce(
        mockContract,
      );

      const body: CreateContractBodyType = { proposalId: 10, totalAmount: 500 };

      await expect(contractService.createContract(1, body)).rejects.toThrow(
        ContractAlreadyExistsException(),
      );
      expect(contractRepository.createContract).not.toHaveBeenCalled();
    });

    // Schema từ chối khi tổng ngân sách hợp đồng nhỏ hơn hoặc bằng 0.
    it('rejects totalAmount <= 0 through CreateContractBodySchema', () => {
      const parsed = CreateContractBodySchema.safeParse({
        proposalId: 10,
        totalAmount: 0,
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-123: updateContract
  // =========================================================================
  describe('UF-123 updateContract', () => {
    // UF-123: Khách hàng cập nhật thành công điều khoản hợp đồng trước khi ký kết.
    it('updates contract terms and details successfully while in PENDING_SIGN', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);
      const updated = { ...mockContract, terms: 'Updated contract terms' };
      contractRepository.updateContract.mockResolvedValueOnce(updated);

      const body: UpdateContractBodyType = { terms: 'Updated contract terms' };
      const result = await contractService.updateContract(1, 5, body);

      expect(result).toEqual(updated);
      expect(contractRepository.updateContract).toHaveBeenCalledWith(5, body);
    });

    // Ném ngoại lệ ContractNotFoundException khi mã hợp đồng cần cập nhật không tồn tại.
    it('throws ContractNotFoundException when contract ID is not found', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        contractService.updateContract(1, 999, { terms: 'New terms' }),
      ).rejects.toThrow(ContractNotFoundException());
      expect(contractRepository.updateContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractForbiddenException khi người gọi không phải là khách hàng của hợp đồng.
    it('throws ContractForbiddenException when user is not the contract client', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        contractService.updateContract(2, 5, { terms: 'Unauthorized edit' }),
      ).rejects.toThrow(ContractForbiddenException());
      expect(contractRepository.updateContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractNotPendingSignException khi hợp đồng không còn ở trạng thái chờ ký.
    it('throws ContractNotPendingSignException when contract status is not PENDING_SIGN', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.ACTIVE,
      });

      await expect(
        contractService.updateContract(1, 5, { terms: 'Late edit' }),
      ).rejects.toThrow(ContractNotPendingSignException());
      expect(contractRepository.updateContract).not.toHaveBeenCalled();
    });

    // Schema từ chối khi cập nhật số tiền totalAmount âm hoặc bằng 0.
    it('rejects non-positive totalAmount through UpdateContractBodySchema', () => {
      const parsed = UpdateContractBodySchema.safeParse({ totalAmount: -50 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-124: completeContract
  // =========================================================================
  describe('UF-124 completeContract', () => {
    // UF-124: Khách hàng hoàn thành thành công hợp đồng đang hoạt động.
    it('completes active contract successfully by client', async () => {
      const activeContract = { ...mockContract, status: ContractStatus.ACTIVE };
      contractRepository.findContractById.mockResolvedValueOnce(activeContract);
      const completed = { ...activeContract, status: ContractStatus.COMPLETED };
      contractRepository.completeContract.mockResolvedValueOnce(completed);

      const result = await contractService.completeContract(1, 5);

      expect(result.status).toBe(ContractStatus.COMPLETED);
      expect(contractRepository.completeContract).toHaveBeenCalledWith(5, 100);
    });

    // Ném ngoại lệ ContractNotFoundException khi hợp đồng cần hoàn thành không tồn tại.
    it('throws ContractNotFoundException when contract does not exist', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(null);

      await expect(contractService.completeContract(1, 999)).rejects.toThrow(
        ContractNotFoundException(),
      );
      expect(contractRepository.completeContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractForbiddenException khi Freelancer cố gắng tự hoàn thành hợp đồng.
    it('throws ContractForbiddenException when non-client attempts completion', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.ACTIVE,
      });

      await expect(contractService.completeContract(2, 5)).rejects.toThrow(
        ContractForbiddenException(),
      );
      expect(contractRepository.completeContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractNotActiveException khi cố gắng hoàn thành hợp đồng chưa kích hoạt.
    it('throws ContractNotActiveException when contract is not active', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(contractService.completeContract(1, 5)).rejects.toThrow(
        ContractNotActiveException(),
      );
      expect(contractRepository.completeContract).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-125: getContractList
  // =========================================================================
  describe('UF-125 getContractList', () => {
    // UF-125: Lấy danh sách hợp đồng theo vai trò Khách hàng kèm bộ lọc.
    it('returns filtered contracts for client role', async () => {
      const expectedData = {
        data: [mockContract],
        total: 1,
        page: 1,
        limit: 10,
      };
      contractRepository.getContractList.mockResolvedValueOnce(expectedData);

      const query: GetContractListQueryType = { page: 1, limit: 10 };
      const result = await contractService.getContractList(
        1,
        RoleName.CLIENT,
        query,
      );

      expect(result).toEqual(expectedData);
      expect(contractRepository.getContractList).toHaveBeenCalledWith(query, {
        userId: 1,
        role: 'client',
      });
    });

    // Lấy danh sách hợp đồng theo vai trò Freelancer kèm bộ lọc.
    it('returns filtered contracts for freelancer role', async () => {
      const expectedData = {
        data: [mockContract],
        total: 1,
        page: 1,
        limit: 10,
      };
      contractRepository.getContractList.mockResolvedValueOnce(expectedData);

      const query: GetContractListQueryType = { page: 1, limit: 10 };
      const result = await contractService.getContractList(
        2,
        RoleName.FREELANCER,
        query,
      );

      expect(result).toEqual(expectedData);
      expect(contractRepository.getContractList).toHaveBeenCalledWith(query, {
        userId: 2,
        role: 'freelancer',
      });
    });

    // Quản trị viên lấy toàn bộ danh sách hợp đồng mà không bị giới hạn bởi quyền sở hữu.
    it('returns all contracts without user filter for admin role', async () => {
      const expectedData = {
        data: [mockContract],
        total: 1,
        page: 1,
        limit: 10,
      };
      contractRepository.getContractList.mockResolvedValueOnce(expectedData);

      const query: GetContractListQueryType = { page: 1, limit: 10 };
      const result = await contractService.getContractList(
        99,
        RoleName.ADMIN,
        query,
      );

      expect(result).toEqual(expectedData);
      expect(contractRepository.getContractList).toHaveBeenCalledWith(
        query,
        {},
      );
    });

    // Schema query từ chối khi limit vượt quá giới hạn 50.
    it('rejects limit > 50 through GetContractListQuerySchema', () => {
      const parsed = GetContractListQuerySchema.safeParse({ limit: 100 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-126: getContractDetail
  // =========================================================================
  describe('UF-126 getContractDetail', () => {
    // UF-126: Lấy chi tiết hợp đồng thành công theo ID cho bên tham gia hợp đồng.
    it('returns contract detail by ID for participant', async () => {
      contractRepository.getContractDetail.mockResolvedValueOnce(mockContract);

      const result = await contractService.getContractDetail(
        1,
        RoleName.CLIENT,
        5,
      );

      expect(result).toEqual(mockContract);
      expect(contractRepository.getContractDetail).toHaveBeenCalledWith(5);
    });

    // Lấy chi tiết hợp đồng thành công theo đường dẫn thân thiện slug.
    it('returns contract detail by slug for participant', async () => {
      contractRepository.findContractBySlug.mockResolvedValueOnce(mockContract);

      const result = await contractService.getContractBySlug(
        2,
        RoleName.FREELANCER,
        'frevia-contract-slug-005',
      );

      expect(result).toEqual(mockContract);
      expect(contractRepository.findContractBySlug).toHaveBeenCalledWith(
        'frevia-contract-slug-005',
      );
    });

    // Ném ngoại lệ ContractNotFoundException khi hợp đồng theo ID không tồn tại.
    it('throws ContractNotFoundException when contract ID does not exist', async () => {
      contractRepository.getContractDetail.mockResolvedValueOnce(null);

      await expect(
        contractService.getContractDetail(1, RoleName.CLIENT, 999),
      ).rejects.toThrow(ContractNotFoundException());
    });

    // Ném ngoại lệ ContractForbiddenException khi người dùng lạ không thuộc hợp đồng và không phải admin.
    it('throws ContractForbiddenException when user is non-participant and non-admin', async () => {
      contractRepository.getContractDetail.mockResolvedValueOnce(mockContract);

      await expect(
        contractService.getContractDetail(999, RoleName.CLIENT, 5),
      ).rejects.toThrow(ContractForbiddenException());
    });
  });

  // =========================================================================
  // UF-127: signContract
  // =========================================================================
  describe('UF-127 signContract', () => {
    // UF-127: Khách hàng ký số hợp đồng thành công.
    it('signs contract successfully by client', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);
      const signed = { ...mockContract, signedByClient: true };
      contractRepository.signContract.mockResolvedValueOnce(signed);

      const result = await contractService.signContract(1, 5);

      expect(result.signedByClient).toBe(true);
      expect(contractRepository.signContract).toHaveBeenCalledWith(5, 'client');
      expect(
        contractPdfService.generateAndSaveContractPdf,
      ).not.toHaveBeenCalled();
    });

    // Freelancer ký số hợp đồng thành công và tự động tạo PDF nếu hợp đồng chuyển sang ACTIVE.
    it('signs contract by freelancer and generates PDF when contract activates', async () => {
      const clientSignedContract = {
        ...mockContract,
        signedByClient: true,
      };
      contractRepository.findContractById.mockResolvedValueOnce(
        clientSignedContract,
      );
      const activatedContract = {
        ...mockContract,
        signedByClient: true,
        signedByFreelancer: true,
        status: ContractStatus.ACTIVE,
      };
      contractRepository.signContract.mockResolvedValueOnce(activatedContract);
      contractPdfService.generateAndSaveContractPdf.mockResolvedValueOnce({
        id: 1,
      });

      const result = await contractService.signContract(2, 5);

      expect(result.status).toBe(ContractStatus.ACTIVE);
      expect(contractRepository.signContract).toHaveBeenCalledWith(
        5,
        'freelancer',
      );
      expect(
        contractPdfService.generateAndSaveContractPdf,
      ).toHaveBeenCalledWith(5);
    });

    // Ném ngoại lệ ContractForbiddenException khi người ký không phải là các bên trong hợp đồng.
    it('throws ContractForbiddenException when user is neither client nor freelancer', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(contractService.signContract(999, 5)).rejects.toThrow(
        ContractForbiddenException(),
      );
      expect(contractRepository.signContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractAwaitingPaymentException khi hợp đồng đang chờ khách hàng nạp cọc.
    it('throws ContractAwaitingPaymentException when contract status is AWAITING_PAYMENT', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.AWAITING_PAYMENT,
      });

      await expect(contractService.signContract(1, 5)).rejects.toThrow(
        ContractAwaitingPaymentException(),
      );
      expect(contractRepository.signContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ AlreadySignedException khi một bên cố gắng ký lặp lại hợp đồng đã ký.
    it('throws AlreadySignedException on duplicate signature attempt', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        signedByClient: true,
      });

      await expect(contractService.signContract(1, 5)).rejects.toThrow(
        AlreadySignedException(),
      );
      expect(contractRepository.signContract).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-128: cancelContract
  // =========================================================================
  describe('UF-128 cancelContract', () => {
    // UF-128: Người tham gia hủy hợp đồng đang chờ ký thành công.
    it('cancels pending contract successfully by participant', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);
      const cancelled = { ...mockContract, status: ContractStatus.CANCELLED };
      contractRepository.cancelContract.mockResolvedValueOnce(cancelled);

      const result = await contractService.cancelContract(1, 5);

      expect(result.status).toBe(ContractStatus.CANCELLED);
      expect(contractRepository.cancelContract).toHaveBeenCalledWith(5);
    });

    // Ném ngoại lệ ContractForbiddenException khi người ngoài cố gắng hủy hợp đồng.
    it('throws ContractForbiddenException when caller is not contract participant', async () => {
      contractRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(contractService.cancelContract(999, 5)).rejects.toThrow(
        ContractForbiddenException(),
      );
      expect(contractRepository.cancelContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractAlreadyCancelledException khi hủy một hợp đồng vốn đã bị hủy.
    it('throws ContractAlreadyCancelledException when contract is already cancelled', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.CANCELLED,
      });

      await expect(contractService.cancelContract(1, 5)).rejects.toThrow(
        ContractAlreadyCancelledException(),
      );
      expect(contractRepository.cancelContract).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ ContractDisputedException khi hợp đồng đang xảy ra tranh chấp.
    it('throws ContractDisputedException when contract is in DISPUTED status', async () => {
      contractRepository.findContractById.mockResolvedValueOnce({
        ...mockContract,
        status: ContractStatus.DISPUTED,
      });

      await expect(contractService.cancelContract(1, 5)).rejects.toThrow(
        ContractDisputedException(),
      );
      expect(contractRepository.cancelContract).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UF-129: getSharedFiles
  // =========================================================================
  describe('UF-129 getSharedFiles', () => {
    // UF-129: Lấy danh sách tệp đính kèm dùng chung của hợp đồng cho người tham gia.
    it('returns list of shared files for authorized participant', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findByContractId.mockResolvedValueOnce([
        mockSharedFile,
      ]);

      const result = await sharedFileService.getSharedFiles(
        1,
        RoleName.CLIENT,
        5,
      );

      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('spec.pdf');
      expect(sharedFileRepository.findByContractId).toHaveBeenCalledWith(5);
    });

    // Quản trị viên hệ thống có quyền xem toàn bộ tệp đính kèm của hợp đồng.
    it('returns shared files for system administrator', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findByContractId.mockResolvedValueOnce([
        mockSharedFile,
      ]);

      const result = await sharedFileService.getSharedFiles(
        99,
        RoleName.ADMIN,
        5,
      );

      expect(result).toHaveLength(1);
      expect(sharedFileRepository.findByContractId).toHaveBeenCalledWith(5);
    });

    // Ném ngoại lệ ContractNotFoundException khi mã hợp đồng không tồn tại.
    it('throws ContractNotFoundException when contract does not exist', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(null);

      await expect(
        sharedFileService.getSharedFiles(1, RoleName.CLIENT, 999),
      ).rejects.toThrow(SharedFileContractNotFoundException());
    });

    // Ném ngoại lệ SharedFileForbiddenException khi người dùng lạ cố xem tệp đính kèm.
    it('throws SharedFileForbiddenException when non-participant tries to view files', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        sharedFileService.getSharedFiles(999, RoleName.CLIENT, 5),
      ).rejects.toThrow(SharedFileForbiddenException());
    });
  });

  // =========================================================================
  // UF-130: uploadSharedFile
  // =========================================================================
  describe('UF-130 uploadSharedFile', () => {
    const mockFile = {
      originalname: 'agreement.pdf',
      buffer: Buffer.from('dummy-pdf-content'),
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    // UF-130: Tải lên tệp đính kèm hợp đồng thành công lên bộ lưu trữ đám mây.
    it('uploads contract shared file successfully by participant', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      cloudinaryService.uploadFile.mockResolvedValueOnce({
        secure_url: 'https://cloudinary.com/frevia/contracts/5/agreement.pdf',
        public_id: 'frevia/contracts/5/agreement',
      });
      sharedFileRepository.create.mockResolvedValueOnce({
        id: 21,
        contractId: 5,
        uploaderId: 1,
        fileUrl: 'https://cloudinary.com/frevia/contracts/5/agreement.pdf',
        publicId: 'frevia/contracts/5/agreement',
        fileName: 'agreement.pdf',
      });

      const result = await sharedFileService.uploadSharedFile(
        1,
        RoleName.CLIENT,
        5,
        mockFile,
      );

      expect(result.fileName).toBe('agreement.pdf');
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'frevia/contracts/5',
      );
      expect(sharedFileRepository.create).toHaveBeenCalledWith({
        contractId: 5,
        uploaderId: 1,
        fileUrl: 'https://cloudinary.com/frevia/contracts/5/agreement.pdf',
        publicId: 'frevia/contracts/5/agreement',
        fileName: 'agreement.pdf',
      });
    });

    // Ném ngoại lệ SharedFileForbiddenException khi người ngoài tải tệp vào hợp đồng.
    it('throws SharedFileForbiddenException when non-participant attempts upload', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);

      await expect(
        sharedFileService.uploadSharedFile(999, RoleName.CLIENT, 5, mockFile),
      ).rejects.toThrow(SharedFileForbiddenException());
      expect(cloudinaryService.uploadFile).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ FailedToUploadSharedFileException khi dịch vụ đám mây gặp sự cố.
    it('throws FailedToUploadSharedFileException when Cloudinary upload fails', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      cloudinaryService.uploadFile.mockRejectedValueOnce(
        new Error('Cloudinary error'),
      );

      await expect(
        sharedFileService.uploadSharedFile(1, RoleName.CLIENT, 5, mockFile),
      ).rejects.toThrow(FailedToUploadSharedFileException());
    });
  });

  // =========================================================================
  // UF-131: deleteSharedFile
  // =========================================================================
  describe('UF-131 deleteSharedFile', () => {
    // UF-131: Người tải lên xóa tệp dùng chung thành công trong thời gian cho phép.
    it('deletes shared file successfully by original uploader within allowed window', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findById.mockResolvedValueOnce(mockSharedFile);
      cloudinaryService.deleteFile.mockResolvedValueOnce(undefined);
      sharedFileRepository.softDelete.mockResolvedValueOnce({
        ...mockSharedFile,
        deletedAt: new Date(),
      });

      const result = await sharedFileService.deleteSharedFile(
        1,
        RoleName.CLIENT,
        5,
        20,
      );

      expect(result.deletedAt).toBeDefined();
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'frevia/contracts/5/spec',
      );
      expect(sharedFileRepository.softDelete).toHaveBeenCalledWith(20);
    });

    // Ném ngoại lệ SharedFileNotFoundException khi tệp không tồn tại hoặc đã bị xóa.
    it('throws SharedFileNotFoundException when file does not exist or is deleted', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findById.mockResolvedValueOnce(null);

      await expect(
        sharedFileService.deleteSharedFile(1, RoleName.CLIENT, 5, 999),
      ).rejects.toThrow(SharedFileNotFoundException());
      expect(sharedFileRepository.softDelete).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ SharedFileForbiddenException khi người khác cố gắng xóa tệp của người tải.
    it('throws SharedFileForbiddenException when non-uploader non-admin tries to delete', async () => {
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findById.mockResolvedValueOnce(mockSharedFile);

      await expect(
        sharedFileService.deleteSharedFile(2, RoleName.FREELANCER, 5, 20),
      ).rejects.toThrow(SharedFileForbiddenException());
      expect(sharedFileRepository.softDelete).not.toHaveBeenCalled();
    });

    // Ném ngoại lệ SharedFileDeleteExpiredException khi tệp đã được tạo quá 1 giờ và người xóa không phải admin.
    it('throws SharedFileDeleteExpiredException when file creation age exceeds 1 hour', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      sharedFileRepository.findContractById.mockResolvedValueOnce(mockContract);
      sharedFileRepository.findById.mockResolvedValueOnce({
        ...mockSharedFile,
        createdAt: twoHoursAgo,
      });

      await expect(
        sharedFileService.deleteSharedFile(1, RoleName.CLIENT, 5, 20),
      ).rejects.toThrow(SharedFileDeleteExpiredException());
      expect(sharedFileRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
