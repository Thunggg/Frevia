import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobBodySchema,
  RoleName,
  UpdateJobBodySchema,
  ViewListJobFilterSchema,
  type CreateJobBodyType,
  type JobType,
  type UpdateJobBodyType,
  type ViewListJobParsedFilterType,
} from '@shared/types';
import type { EmbeddingOutboxService } from '../../src/routes/recommendations/embedding-outbox.service';
import type { ManageJobRepository } from '../../src/routes/manage-job/manage-job.repo';
import { ManageJobService } from '../../src/routes/manage-job/manage-job.service';
import {
  FailedToCloseJobException,
  FailedToCreateJobException,
  FailedToDeleteJobException,
  FailedToPublishJobException,
  FailedToReopenJobException,
  FailedToUpdateJobException,
  JobCannotBeClosedException,
  JobCannotBeDeletedWithActiveContractException,
  JobCannotBePublishedException,
  JobCannotBeReopenedException,
  JobNotFoundException,
  JobOnlyForClientException,
  JobReopenPeriodExpiredException,
  PositionsRequiredBelowFilledException,
} from '../../src/routes/manage-job/manage-job.error';

describe('Job Management (UF-87 to UF-93)', () => {
  const mockJob: JobType = {
    id: 5,
    slug: 'build-responsive-web-application',
    clientId: 1,
    title: 'Build Responsive Web Application',
    description: 'Develop responsive frontend using React and Tailwind',
    budgetMin: 500,
    budgetMax: 2000,
    budgetType: 'FIXED_PRICE',
    deadline: new Date('2026-12-31T00:00:00.000Z'),
    expiryDate: new Date('2026-12-15T00:00:00.000Z'),
    status: 'OPEN',
    hiringType: 'SINGLE',
    positionsRequired: 1,
    positionsFilled: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const prismaError = (code = 'P2000') =>
    new PrismaClientKnownRequestError('Database operation failed', {
      code,
      clientVersion: '6.0.0',
    });

  let repository: {
    createJob: jest.Mock;
    updateJob: jest.Mock;
    deleteJob: jest.Mock;
    publishJob: jest.Mock;
    closeJob: jest.Mock;
    reopenJob: jest.Mock;
    getClientJobLists: jest.Mock;
    getClientJobDetail: jest.Mock;
    searchSkills: jest.Mock;
  };

  let embeddingOutbox: {
    enqueueAndProcess: jest.Mock;
  };

  let service: ManageJobService;

  beforeEach(() => {
    repository = {
      createJob: jest.fn().mockResolvedValue(mockJob),
      updateJob: jest.fn().mockResolvedValue(mockJob),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      publishJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'OPEN' }),
      closeJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'CLOSED' }),
      reopenJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'OPEN' }),
      getClientJobLists: jest
        .fn()
        .mockResolvedValue({ jobs: [mockJob], total: 1 }),
      getClientJobDetail: jest.fn().mockResolvedValue(mockJob),
      searchSkills: jest.fn().mockResolvedValue([]),
    };

    embeddingOutbox = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };

    service = new ManageJobService(
      repository as unknown as ManageJobRepository,
      embeddingOutbox as unknown as EmbeddingOutboxService,
    );

    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-87: viewClientJobs
  // =========================================================================
  describe('UF-87 viewClientJobs', () => {
    // UF-87: Client xem danh sách công việc của mình thành công kèm phân trang.
    it('returns client jobs with pagination when caller has CLIENT role', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      const result = await service.viewClientJobs(1, RoleName.CLIENT, filter);

      expect(result.data).toEqual([mockJob]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(repository.getClientJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Trả về mảng rỗng khi client chưa đăng bài tuyển dụng nào trong hệ thống.
    it('returns empty data array when client has zero jobs posted', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getClientJobLists.mockResolvedValueOnce({
        jobs: [],
        total: 0,
      });

      const result = await service.viewClientJobs(1, RoleName.CLIENT, filter);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Từ chối và ném ForbiddenException khi tài khoản có role khác CLIENT.
    it('throws BookmarkJobOnlyForFreelancerException when caller role is not CLIENT', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      await expect(
        service.viewClientJobs(1, RoleName.FREELANCER, filter),
      ).rejects.toThrow();
    });

    // Truyền chính xác bộ lọc trạng thái status sang repository.
    it('forwards status filter to repository when status is provided', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          status: 'DRAFT',
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      await service.viewClientJobs(1, RoleName.CLIENT, filter);

      expect(repository.getClientJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Truyền từ khóa tìm kiếm search sang repository.
    it('forwards search keyword to repository', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          search: 'Frontend',
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      await service.viewClientJobs(1, RoleName.CLIENT, filter);

      expect(repository.getClientJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Schema bộ lọc từ chối khi số trang page <= 0.
    it('rejects page <= 0 through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({ page: -1, limit: 10 });
      expect(parsed.success).toBe(false);
    });

    // Schema bộ lọc từ chối khi số lượng limit vượt quá 20.
    it('rejects limit > 20 through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({ page: 1, limit: 25 });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-88: createJob
  // =========================================================================
  describe('UF-88 createJob', () => {
    const validBody: CreateJobBodyType = {
      title: 'Build Responsive Web Application',
      description: 'Develop responsive frontend using React and Tailwind',
      budgetMin: 500,
      budgetMax: 2000,
      budgetType: 'FIXED_PRICE',
      deadline: new Date('2026-12-31T00:00:00.000Z'),
      expiryDate: new Date('2026-12-15T00:00:00.000Z'),
      skills: [1, 2, 3],
      jobCategories: [1],
      hiringType: 'SINGLE',
      positionsRequired: 1,
    };

    // UF-88: Tạo công việc mới ở trạng thái DRAFT thành công và đưa vào hàng đợi AI embedding.
    it('creates a job in DRAFT status and enqueues AI embedding', async () => {
      const result = await service.createJob(1, RoleName.CLIENT, validBody);

      expect(result).toEqual(mockJob);
      expect(repository.createJob).toHaveBeenCalledWith(1, validBody);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Tạo công việc với kiểu tuyển dụng MULTIPLE và số vị trí cần tuyển lớn hơn 1.
    it('creates a job with MULTIPLE hiring type and positionsRequired > 1', async () => {
      const multipleBody: CreateJobBodyType = {
        ...validBody,
        hiringType: 'MULTIPLE',
        positionsRequired: 5,
      };

      await service.createJob(1, RoleName.CLIENT, multipleBody);

      expect(repository.createJob).toHaveBeenCalledWith(1, multipleBody);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalled();
    });

    // Từ chối tạo công việc khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when non-client attempts to create job', async () => {
      await expect(
        service.createJob(1, RoleName.FREELANCER, validBody),
      ).rejects.toThrow(JobOnlyForClientException());

      expect(repository.createJob).not.toHaveBeenCalled();
      expect(embeddingOutbox.enqueueAndProcess).not.toHaveBeenCalled();
    });

    // Ném FailedToCreateJobException khi repository gặp lỗi Prisma database.
    it('throws FailedToCreateJobException when database insert fails with Prisma error', async () => {
      repository.createJob.mockRejectedValueOnce(prismaError());

      await expect(
        service.createJob(1, RoleName.CLIENT, validBody),
      ).rejects.toThrow(FailedToCreateJobException());
    });

    // Chấp nhận tiêu đề dài đúng 10 ký tự ở biên dưới hợp lệ.
    it('accepts title of exactly 10 characters at lower boundary', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        title: '0123456789',
      });
      expect(parsed.success).toBe(true);
    });

    // Chấp nhận tiêu đề dài đúng 255 ký tự ở biên trên hợp lệ.
    it('accepts title of exactly 255 characters at upper boundary', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        title: 'a'.repeat(255),
      });
      expect(parsed.success).toBe(true);
    });

    // Schema từ chối khi tiêu đề ngắn hơn 10 ký tự.
    it('rejects title shorter than 10 characters', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        title: 'Fix bug',
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi tiêu đề để trống.
    it('rejects empty title', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        title: '',
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi mô tả vượt quá 5000 ký tự.
    it('rejects description longer than 5000 characters', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        description: 'a'.repeat(5001),
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi budgetMin lớn hơn budgetMax.
    it('rejects budgetMin greater than budgetMax', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        budgetMin: 5000,
        budgetMax: 1000,
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi hạn chót deadline nằm ở quá khứ.
    it('rejects deadline date in the past', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        deadline: new Date('2020-01-01'),
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi hạn nộp hồ sơ expiryDate nằm sau deadline bàn giao.
    it('rejects expiryDate scheduled after deadline', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        deadline: new Date('2026-12-01'),
        expiryDate: new Date('2026-12-10'),
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi kiểu tuyển dụng SINGLE nhưng số vị trí tuyển khác 1.
    it('rejects positionsRequired not equal to 1 for SINGLE hiring type', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        hiringType: 'SINGLE',
        positionsRequired: 2,
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi chọn nhiều hơn 1 danh mục công việc.
    it('rejects jobCategories with more than 1 category', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        jobCategories: [1, 2],
      });
      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi danh sách kỹ năng rỗng.
    it('rejects empty skills array', () => {
      const parsed = CreateJobBodySchema.safeParse({
        ...validBody,
        skills: [],
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-89: publishJob
  // =========================================================================
  describe('UF-89 publishJob', () => {
    // UF-89: Công khai công việc DRAFT thành OPEN thành công và đưa vào hàng đợi AI embedding.
    it('publishes a DRAFT job to OPEN status and queues AI upsert', async () => {
      const result = await service.publishJob(1, RoleName.CLIENT, 5);

      expect(result.status).toBe('OPEN');
      expect(repository.publishJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Từ chối publish khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when caller role is not CLIENT', async () => {
      await expect(
        service.publishJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());

      expect(repository.publishJob).not.toHaveBeenCalled();
      expect(embeddingOutbox.enqueueAndProcess).not.toHaveBeenCalled();
    });

    // Ném JobNotFoundException khi công việc không thuộc về client hoặc không tồn tại.
    it('rethrows JobNotFoundException when job is not found or not owned', async () => {
      repository.publishJob.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.publishJob(1, RoleName.CLIENT, 999)).rejects.toThrow(
        JobNotFoundException(),
      );
    });

    // Ném JobCannotBePublishedException khi công việc không ở trạng thái DRAFT.
    it('rethrows JobCannotBePublishedException when job is not in DRAFT status', async () => {
      repository.publishJob.mockRejectedValueOnce(
        JobCannotBePublishedException(),
      );

      await expect(service.publishJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBePublishedException(),
      );
    });

    // Ném FailedToPublishJobException khi gặp lỗi Prisma database lúc cập nhật trạng thái.
    it('throws FailedToPublishJobException when database update fails with Prisma error', async () => {
      repository.publishJob.mockRejectedValueOnce(prismaError());

      await expect(service.publishJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        FailedToPublishJobException(),
      );
    });
  });

  // =========================================================================
  // UF-90: updateJob
  // =========================================================================
  describe('UF-90 updateJob', () => {
    const updateBody: UpdateJobBodyType = {
      title: 'Updated Web App Title',
      description: 'Updated frontend description',
      budgetMin: 600,
      budgetMax: 2200,
      budgetType: 'FIXED_PRICE',
      deadline: new Date('2026-12-31T00:00:00.000Z'),
      expiryDate: new Date('2026-12-15T00:00:00.000Z'),
      skills: [1, 2, 4],
      jobCategories: [1],
      hiringType: 'SINGLE',
      positionsRequired: 1,
    };

    // UF-90: Cập nhật thông tin công việc thành công và đưa vào hàng đợi AI embedding.
    it('updates job details and enqueues AI upsert', async () => {
      const result = await service.updateJob(1, RoleName.CLIENT, 5, updateBody);

      expect(result).toEqual(mockJob);
      expect(repository.updateJob).toHaveBeenCalledWith(1, 5, updateBody);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Từ chối cập nhật công việc khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when caller role is not CLIENT', async () => {
      await expect(
        service.updateJob(1, RoleName.FREELANCER, 5, updateBody),
      ).rejects.toThrow(JobOnlyForClientException());

      expect(repository.updateJob).not.toHaveBeenCalled();
    });

    // Ném JobNotFoundException khi công việc không tồn tại hoặc client không phải chủ sở hữu.
    it('rethrows JobNotFoundException when job is not found or not owned', async () => {
      repository.updateJob.mockRejectedValueOnce(JobNotFoundException());

      await expect(
        service.updateJob(1, RoleName.CLIENT, 999, updateBody),
      ).rejects.toThrow(JobNotFoundException());
    });

    // Ném PositionsRequiredBelowFilledException khi giảm số lượng tuyển xuống dưới số vị trí đã tuyển.
    it('rethrows PositionsRequiredBelowFilledException when positionsRequired < positionsFilled', async () => {
      repository.updateJob.mockRejectedValueOnce(
        PositionsRequiredBelowFilledException(),
      );

      await expect(
        service.updateJob(1, RoleName.CLIENT, 5, updateBody),
      ).rejects.toThrow(PositionsRequiredBelowFilledException());
    });

    // Ném FailedToUpdateJobException khi gặp lỗi Prisma database lúc cập nhật.
    it('throws FailedToUpdateJobException when database update fails with Prisma error', async () => {
      repository.updateJob.mockRejectedValueOnce(prismaError());

      await expect(
        service.updateJob(1, RoleName.CLIENT, 5, updateBody),
      ).rejects.toThrow(FailedToUpdateJobException());
    });

    // Chấp nhận cập nhật tiêu đề đúng 10 ký tự ở biên dưới qua UpdateJobBodySchema.
    it('accepts title of exactly 10 characters at lower boundary for update', () => {
      const parsed = UpdateJobBodySchema.safeParse({
        ...updateBody,
        title: '0123456789',
      });
      expect(parsed.success).toBe(true);
    });

    // Schema cập nhật từ chối khi chọn nhiều hơn 1 danh mục công việc.
    it('rejects update with more than 1 category through UpdateJobBodySchema', () => {
      const parsed = UpdateJobBodySchema.safeParse({
        ...updateBody,
        jobCategories: [1, 2],
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-91: deleteJob
  // =========================================================================
  describe('UF-91 deleteJob', () => {
    // UF-91: Xóa mềm công việc thành công và đưa vào hàng đợi AI để xóa embedding.
    it('deletes job and enqueues AI delete event', async () => {
      await service.deleteJob(1, RoleName.CLIENT, 5);

      expect(repository.deleteJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Từ chối xóa công việc khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when caller role is not CLIENT', async () => {
      await expect(
        service.deleteJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());

      expect(repository.deleteJob).not.toHaveBeenCalled();
    });

    // Chặn xóa công việc khi đang có hợp đồng hoạt động hoặc tranh chấp.
    it('rethrows JobCannotBeDeletedWithActiveContractException when active contract exists', async () => {
      repository.deleteJob.mockRejectedValueOnce(
        JobCannotBeDeletedWithActiveContractException(),
      );

      await expect(service.deleteJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeDeletedWithActiveContractException(),
      );
    });

    // Ném JobNotFoundException khi công việc không tồn tại hoặc không thuộc quyền sở hữu.
    it('rethrows JobNotFoundException when job is not found during delete', async () => {
      repository.deleteJob.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.deleteJob(1, RoleName.CLIENT, 999)).rejects.toThrow(
        JobNotFoundException(),
      );
    });

    // Ném FailedToDeleteJobException khi gặp lỗi Prisma database lúc xóa.
    it('throws FailedToDeleteJobException when database delete fails with Prisma error', async () => {
      repository.deleteJob.mockRejectedValueOnce(prismaError());

      await expect(service.deleteJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        FailedToDeleteJobException(),
      );
    });
  });

  // =========================================================================
  // UF-92: closeJob
  // =========================================================================
  describe('UF-92 closeJob', () => {
    // UF-92: Đóng công việc OPEN thành công sang CLOSED và đưa vào hàng đợi AI để xóa embedding.
    it('closes OPEN job and enqueues AI delete event', async () => {
      const result = await service.closeJob(1, RoleName.CLIENT, 5);

      expect(result.status).toBe('CLOSED');
      expect(repository.closeJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Từ chối đóng công việc khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when caller role is not CLIENT', async () => {
      await expect(service.closeJob(1, RoleName.FREELANCER, 5)).rejects.toThrow(
        JobOnlyForClientException(),
      );

      expect(repository.closeJob).not.toHaveBeenCalled();
    });

    // Ném JobCannotBeClosedException khi công việc không ở trạng thái OPEN.
    it('rethrows JobCannotBeClosedException when job is not in OPEN status', async () => {
      repository.closeJob.mockRejectedValueOnce(JobCannotBeClosedException());

      await expect(service.closeJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeClosedException(),
      );
    });

    // Ném JobNotFoundException khi công việc không tồn tại hoặc không thuộc quyền sở hữu.
    it('rethrows JobNotFoundException when job is not found during close', async () => {
      repository.closeJob.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.closeJob(1, RoleName.CLIENT, 999)).rejects.toThrow(
        JobNotFoundException(),
      );
    });

    // Ném FailedToCloseJobException khi gặp lỗi Prisma database lúc đóng công việc.
    it('throws FailedToCloseJobException when database close fails with Prisma error', async () => {
      repository.closeJob.mockRejectedValueOnce(prismaError());

      await expect(service.closeJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        FailedToCloseJobException(),
      );
    });
  });

  // =========================================================================
  // UF-93: reopenJob
  // =========================================================================
  describe('UF-93 reopenJob', () => {
    // UF-93: Mở lại công việc CLOSED thành công sang OPEN và đưa vào hàng đợi AI embedding.
    it('reopens CLOSED job and enqueues AI upsert event', async () => {
      const result = await service.reopenJob(1, RoleName.CLIENT, 5);

      expect(result.status).toBe('OPEN');
      expect(repository.reopenJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    // Từ chối mở lại công việc khi role người gọi không phải CLIENT.
    it('throws JobOnlyForClientException when caller role is not CLIENT', async () => {
      await expect(
        service.reopenJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());

      expect(repository.reopenJob).not.toHaveBeenCalled();
    });

    // Ném JobCannotBeReopenedException khi công việc không ở trạng thái CLOSED.
    it('rethrows JobCannotBeReopenedException when job is not in CLOSED status', async () => {
      repository.reopenJob.mockRejectedValueOnce(
        JobCannotBeReopenedException(),
      );

      await expect(service.reopenJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeReopenedException(),
      );
    });

    // Chặn mở lại công việc khi thời hạn đóng đã vượt quá 60 ngày.
    it('rethrows JobReopenPeriodExpiredException when job closed for more than 60 days', async () => {
      repository.reopenJob.mockRejectedValueOnce(
        JobReopenPeriodExpiredException(),
      );

      await expect(service.reopenJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobReopenPeriodExpiredException(),
      );
    });

    // Ném JobNotFoundException khi công việc không tồn tại hoặc không thuộc quyền sở hữu.
    it('rethrows JobNotFoundException when job is not found during reopen', async () => {
      repository.reopenJob.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.reopenJob(1, RoleName.CLIENT, 999)).rejects.toThrow(
        JobNotFoundException(),
      );
    });

    // Ném FailedToReopenJobException khi gặp lỗi Prisma database lúc mở lại công việc.
    it('throws FailedToReopenJobException when database reopen fails with Prisma error', async () => {
      repository.reopenJob.mockRejectedValueOnce(prismaError());

      await expect(service.reopenJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        FailedToReopenJobException(),
      );
    });
  });
});
