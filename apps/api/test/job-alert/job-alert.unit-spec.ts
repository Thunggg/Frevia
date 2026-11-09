import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobAlertBodySchema,
  type JobAlertType,
  MAX_JOB_ALERTS_PER_USER,
  RoleName,
  UpdateJobAlertBodySchema,
} from '@shared/types';

import {
  FailedToCreateJobAlertException,
  FailedToDeleteJobAlertException,
  FailedToLoadJobAlertException,
  FailedToUpdateJobAlertException,
  JobAlertDuplicateCriteriaException,
  JobAlertLimitExceededException,
  JobAlertNotFoundException,
  JobAlertOnlyForFreelancerException,
} from '../../src/routes/job-alert/job-alert.error';
import { JobAlertRepository } from '../../src/routes/job-alert/job-alert.repo';
import { JobAlertService } from '../../src/routes/job-alert/job-alert.service';

describe('Job Alerts (UF-105 to UF-109)', () => {
  let repository: {
    countByUserId: jest.Mock;
    findDuplicate: jest.Mock;
    findAllByUserId: jest.Mock;
    findByIdAndUserId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMatchingJobs: jest.Mock;
  };

  let service: JobAlertService;

  const mockAlert: JobAlertType = {
    id: 1,
    userId: 10,
    name: 'NestJS Backend Alerts',
    keywords: 'NodeJS NestJS',
    skills: ['TypeScript', 'NodeJS'],
    frequency: 'DAILY',
    channels: ['IN_APP'],
    isActive: true,
    lastSentAt: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
  };

  const mockMatchingJob = {
    id: 201,
    title: 'Senior NestJS Developer Needed',
    slug: 'senior-nestjs-dev',
    budgetMin: 1000,
    budgetMax: 2500,
    createdAt: new Date('2026-03-02T00:00:00Z'),
    skills: ['TypeScript', 'NodeJS'],
  };

  beforeEach(() => {
    repository = {
      countByUserId: jest.fn().mockResolvedValue(0),
      findDuplicate: jest.fn().mockResolvedValue(null),
      findAllByUserId: jest.fn().mockResolvedValue([mockAlert]),
      findByIdAndUserId: jest.fn().mockResolvedValue(mockAlert),
      create: jest.fn().mockResolvedValue(mockAlert),
      update: jest.fn().mockResolvedValue(mockAlert),
      delete: jest.fn().mockResolvedValue(true),
      findMatchingJobs: jest.fn().mockResolvedValue([mockMatchingJob]),
    };

    service = new JobAlertService(repository as unknown as JobAlertRepository);

    jest.clearAllMocks();
  });

  describe('UF-105 getJobAlerts', () => {
    // UF-105: Freelancer xem danh sách các thông báo việc làm đã thiết lập.
    it('returns job alerts for authenticated freelancer', async () => {
      const result = await service.getJobAlerts(10, RoleName.FREELANCER);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockAlert]);
    });

    // Trả về mảng rỗng khi freelancer chưa thiết lập cảnh báo nào.
    it('returns empty array when freelancer has no job alerts', async () => {
      repository.findAllByUserId.mockResolvedValueOnce([]);

      const result = await service.getJobAlerts(10, RoleName.FREELANCER);

      expect(result).toEqual([]);
    });

    // Người dùng có vai trò khác Freelancer bị từ chối truy cập.
    it('forbids non-freelancer role from viewing job alerts', async () => {
      await expect(service.getJobAlerts(10, RoleName.CLIENT)).rejects.toThrow(
        JobAlertOnlyForFreelancerException(),
      );
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadJobAlertException.
    it('throws FailedToLoadJobAlertException on database error', async () => {
      repository.findAllByUserId.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db read error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.getJobAlerts(10, RoleName.FREELANCER),
      ).rejects.toThrow(FailedToLoadJobAlertException());
    });

    // Trả về đúng cấu trúc danh sách kỹ năng và kênh thông báo của từng cảnh báo.
    it('returns accurate skills and channels arrays in alert items', async () => {
      const result = await service.getJobAlerts(10, RoleName.FREELANCER);

      expect(result[0].skills).toEqual(['TypeScript', 'NodeJS']);
      expect(result[0].channels).toEqual(['IN_APP']);
    });
  });

  describe('UF-106 getJobAlertDetail', () => {
    // UF-106: Xem chi tiết thông báo việc làm thuộc sở hữu của Freelancer.
    it('returns alert detail when owned by freelancer', async () => {
      const result = await service.getJobAlertDetail(
        10,
        RoleName.FREELANCER,
        1,
      );

      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockAlert);
    });

    // Người dùng có vai trò khác Freelancer bị từ chối xem chi tiết cảnh báo.
    it('forbids non-freelancer role from viewing alert detail', async () => {
      await expect(
        service.getJobAlertDetail(10, RoleName.CLIENT, 1),
      ).rejects.toThrow(JobAlertOnlyForFreelancerException());
    });

    // Báo lỗi NotFound khi ID cảnh báo không tồn tại trong hệ thống.
    it('raises NotFound when alert id does not exist', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        service.getJobAlertDetail(10, RoleName.FREELANCER, 999),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Báo lỗi NotFound khi cảnh báo thuộc về Freelancer khác.
    it('raises NotFound when alert belongs to another freelancer', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        service.getJobAlertDetail(20, RoleName.FREELANCER, 1),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadJobAlertException.
    it('throws FailedToLoadJobAlertException on database error', async () => {
      repository.findByIdAndUserId.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db read error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.getJobAlertDetail(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(FailedToLoadJobAlertException());
    });

    // Xem danh sách việc làm phù hợp với tiêu chí của cảnh báo.
    it('returns matching jobs for the specified alert', async () => {
      const result = await service.getMatchingJobs(10, RoleName.FREELANCER, 1);

      expect(repository.findMatchingJobs).toHaveBeenCalledWith(
        10,
        mockAlert.keywords,
        mockAlert.skills,
        5,
      );
      expect(result).toHaveLength(1);
    });

    // Báo lỗi NotFound khi tìm kiếm việc làm phù hợp cho cảnh báo không tồn tại.
    it('raises NotFound when fetching matching jobs for non-existent alert', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        service.getMatchingJobs(10, RoleName.FREELANCER, 999),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Xử lý lỗi cơ sở dữ liệu khi tìm kiếm việc làm phù hợp.
    it('throws FailedToLoadJobAlertException when matching jobs query fails', async () => {
      repository.findMatchingJobs.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.getMatchingJobs(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(FailedToLoadJobAlertException());
    });
  });

  describe('UF-107 createJobAlert', () => {
    // UF-107: Tạo cảnh báo việc làm mới với đầy đủ thông tin hợp lệ.
    it('creates a new job alert successfully', async () => {
      const payload = {
        name: 'Backend Node Alert',
        keywords: 'NodeJS NestJS',
        skills: ['TypeScript', 'NodeJS'],
        frequency: 'DAILY' as const,
        channels: ['IN_APP' as const],
      };

      const result = await service.createJobAlert(
        10,
        RoleName.FREELANCER,
        payload,
      );

      expect(repository.countByUserId).toHaveBeenCalledWith(10);
      expect(repository.create).toHaveBeenCalledWith(10, payload);
      expect(result).toEqual(mockAlert);
    });

    // Người dùng không phải Freelancer không được phép tạo cảnh báo việc làm.
    it('forbids non-freelancer role from creating job alert', async () => {
      await expect(
        service.createJobAlert(10, RoleName.CLIENT, {
          name: 'Alert',
          keywords: 'test',
          skills: [],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(JobAlertOnlyForFreelancerException());
    });

    // Báo lỗi vượt quá giới hạn khi Freelancer đã có đủ 10 cảnh báo việc làm.
    it('throws JobAlertLimitExceededException when freelancer reaches 10 alerts', async () => {
      repository.countByUserId.mockResolvedValueOnce(MAX_JOB_ALERTS_PER_USER);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          name: '11th Alert',
          keywords: 'test',
          skills: [],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(JobAlertLimitExceededException());
    });

    // Cho phép tạo thành công khi Freelancer hiện có 9 cảnh báo (biên dưới cận trên).
    it('allows creation when freelancer currently has 9 alerts', async () => {
      repository.countByUserId.mockResolvedValueOnce(
        MAX_JOB_ALERTS_PER_USER - 1,
      );

      await service.createJobAlert(10, RoleName.FREELANCER, {
        name: '10th Alert',
        keywords: 'test',
        skills: [],
        frequency: 'DAILY',
        channels: ['IN_APP'],
      });

      expect(repository.create).toHaveBeenCalled();
    });

    // Báo lỗi trùng lặp khi tiêu chí từ khóa và kỹ năng giống hệt một cảnh báo đã có.
    it('throws JobAlertDuplicateCriteriaException on identical criteria', async () => {
      repository.findDuplicate.mockResolvedValueOnce(mockAlert);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          name: 'Duplicate Alert',
          keywords: 'NodeJS NestJS',
          skills: ['TypeScript', 'NodeJS'],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(JobAlertDuplicateCriteriaException());
    });

    // Phát hiện trùng lặp tiêu chí không phân biệt chữ hoa chữ thường.
    it('detects duplicate criteria case-insensitively', async () => {
      repository.findDuplicate.mockResolvedValueOnce(mockAlert);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          name: 'Case Insensitive Alert',
          keywords: 'nodejs nestjs',
          skills: ['typescript', 'nodejs'],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(JobAlertDuplicateCriteriaException());

      expect(repository.findDuplicate).toHaveBeenCalledWith(
        10,
        'nodejs nestjs',
        ['nodejs', 'typescript'],
      );
    });

    // Phát hiện trùng lặp tiêu chí khi thứ tự danh sách kỹ năng bị đảo ngược.
    it('detects duplicate criteria regardless of skill order', async () => {
      repository.findDuplicate.mockResolvedValueOnce(mockAlert);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          name: 'Reordered Skills Alert',
          keywords: 'NodeJS NestJS',
          skills: ['NodeJS', 'TypeScript'],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(JobAlertDuplicateCriteriaException());

      expect(repository.findDuplicate).toHaveBeenCalledWith(
        10,
        'nodejs nestjs',
        ['nodejs', 'typescript'],
      );
    });

    // Chấp nhận tên cảnh báo có độ dài 1 ký tự (biên dưới).
    it('accepts alert name of 1 character', async () => {
      const payload = {
        name: 'A',
        keywords: 'python',
        skills: [],
        frequency: 'DAILY' as const,
        channels: ['IN_APP' as const],
      };

      await service.createJobAlert(10, RoleName.FREELANCER, payload);

      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    // Chấp nhận tên cảnh báo có độ dài 100 ký tự (biên trên).
    it('accepts alert name of 100 characters', async () => {
      const payload = {
        name: 'B'.repeat(100),
        keywords: 'golang',
        skills: [],
        frequency: 'DAILY' as const,
        channels: ['IN_APP' as const],
      };

      await service.createJobAlert(10, RoleName.FREELANCER, payload);

      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    // Từ chối tên cảnh báo rỗng trong kiểm tra schema.
    it('rejects empty name in schema validation', () => {
      const parsed = CreateJobAlertBodySchema.safeParse({
        name: '',
        frequency: 'DAILY',
        channels: ['IN_APP'],
      });

      expect(parsed.success).toBe(false);
    });

    // Từ chối tên cảnh báo vượt quá 100 ký tự trong kiểm tra schema.
    it('rejects name exceeding 100 characters in schema validation', () => {
      const parsed = CreateJobAlertBodySchema.safeParse({
        name: 'X'.repeat(101),
        frequency: 'DAILY',
        channels: ['IN_APP'],
      });

      expect(parsed.success).toBe(false);
    });

    // Từ chối mảng kênh nhận thông báo rỗng trong kiểm tra schema.
    it('rejects empty channels array in schema validation', () => {
      const parsed = CreateJobAlertBodySchema.safeParse({
        name: 'Valid Name',
        frequency: 'DAILY',
        channels: [],
      });

      expect(parsed.success).toBe(false);
    });

    // Từ chối tần suất thông báo không hợp lệ trong kiểm tra schema.
    it('rejects invalid frequency enum in schema validation', () => {
      const parsed = CreateJobAlertBodySchema.safeParse({
        name: 'Valid Name',
        frequency: 'HOURLY',
        channels: ['IN_APP'],
      });

      expect(parsed.success).toBe(false);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToCreateJobAlertException.
    it('throws FailedToCreateJobAlertException on database error', async () => {
      repository.create.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2002',
          clientVersion: '1',
        }),
      );

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          name: 'Crash Alert',
          keywords: 'crash',
          skills: [],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toThrow(FailedToCreateJobAlertException());
    });
  });

  describe('UF-108 updateJobAlert', () => {
    // UF-108: Cập nhật thông tin cảnh báo việc làm thành công.
    it('updates job alert details successfully', async () => {
      const updatePayload = {
        name: 'Updated Job Alert',
        frequency: 'WEEKLY' as const,
      };

      const result = await service.updateJobAlert(
        10,
        RoleName.FREELANCER,
        1,
        updatePayload,
      );

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
      expect(result).toEqual(mockAlert);
    });

    // Người dùng không phải Freelancer không được phép cập nhật cảnh báo.
    it('forbids non-freelancer role from updating job alert', async () => {
      await expect(
        service.updateJobAlert(10, RoleName.CLIENT, 1, { name: 'Rename' }),
      ).rejects.toThrow(JobAlertOnlyForFreelancerException());
    });

    // Báo lỗi NotFound khi ID cảnh báo cần cập nhật không tồn tại.
    it('raises NotFound when updating non-existent job alert', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 999, { name: 'New' }),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Báo lỗi NotFound khi cảnh báo thuộc về Freelancer khác.
    it('raises NotFound when updating alert owned by another freelancer', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        service.updateJobAlert(20, RoleName.FREELANCER, 1, { name: 'Hack' }),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Báo lỗi trùng lặp khi cập nhật tiêu chí trùng với một cảnh báo khác của cùng người dùng.
    it('throws JobAlertDuplicateCriteriaException when updated criteria matches another alert', async () => {
      repository.findDuplicate.mockResolvedValueOnce({ ...mockAlert, id: 2 });

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 1, {
          keywords: 'React Native',
        }),
      ).rejects.toThrow(JobAlertDuplicateCriteriaException());
    });

    // Cho phép giữ nguyên tiêu chí của chính cảnh báo đang cập nhật (không báo trùng lặp).
    it('allows updating other fields without duplicate error against itself', async () => {
      repository.findDuplicate.mockResolvedValueOnce(null);

      await service.updateJobAlert(10, RoleName.FREELANCER, 1, {
        name: 'Renamed Same Criteria',
        keywords: 'NodeJS NestJS',
      });

      expect(repository.update).toHaveBeenCalled();
    });

    // Bật hoặc tắt trạng thái hoạt động (isActive) của cảnh báo việc làm.
    it('toggles isActive status of job alert successfully', async () => {
      await service.updateJobAlert(10, RoleName.FREELANCER, 1, {
        isActive: false,
      });

      expect(repository.update).toHaveBeenCalledWith(1, 10, {
        isActive: false,
      });
    });

    // Chấp nhận tên cập nhật có độ dài 1 ký tự (biên dưới).
    it('accepts updated alert name of 1 character', async () => {
      await service.updateJobAlert(10, RoleName.FREELANCER, 1, { name: 'X' });

      expect(repository.update).toHaveBeenCalledWith(1, 10, { name: 'X' });
    });

    // Chấp nhận tên cập nhật có độ dài 100 ký tự (biên trên).
    it('accepts updated alert name of 100 characters', async () => {
      const longName = 'Y'.repeat(100);

      await service.updateJobAlert(10, RoleName.FREELANCER, 1, {
        name: longName,
      });

      expect(repository.update).toHaveBeenCalledWith(1, 10, { name: longName });
    });

    // Từ chối tên cập nhật vượt quá 100 ký tự trong schema.
    it('rejects updated name exceeding 100 characters in schema validation', () => {
      const parsed = UpdateJobAlertBodySchema.safeParse({
        name: 'Z'.repeat(101),
      });

      expect(parsed.success).toBe(false);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToUpdateJobAlertException.
    it('throws FailedToUpdateJobAlertException on database error', async () => {
      repository.update.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 1, { name: 'Fail' }),
      ).rejects.toThrow(FailedToUpdateJobAlertException());
    });
  });

  describe('UF-109 deleteJobAlert', () => {
    // UF-109: Xóa cảnh báo việc làm thành công khi bản ghi tồn tại và thuộc sở hữu.
    it('deletes job alert successfully and returns success flag', async () => {
      const result = await service.deleteJobAlert(10, RoleName.FREELANCER, 1);

      expect(repository.delete).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ success: true });
    });

    // Người dùng không phải Freelancer không được phép xóa cảnh báo.
    it('forbids non-freelancer role from deleting job alert', async () => {
      await expect(
        service.deleteJobAlert(10, RoleName.CLIENT, 1),
      ).rejects.toThrow(JobAlertOnlyForFreelancerException());
    });

    // Báo lỗi NotFound khi ID cảnh báo không tồn tại trong hệ thống.
    it('raises NotFound when deleting non-existent alert', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(
        service.deleteJobAlert(10, RoleName.FREELANCER, 999),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Báo lỗi NotFound khi cảnh báo thuộc sở hữu của Freelancer khác.
    it('raises NotFound when deleting alert owned by another freelancer', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(
        service.deleteJobAlert(20, RoleName.FREELANCER, 1),
      ).rejects.toThrow(JobAlertNotFoundException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToDeleteJobAlertException.
    it('throws FailedToDeleteJobAlertException on database error', async () => {
      repository.delete.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('delete error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.deleteJobAlert(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(FailedToDeleteJobAlertException());
    });
  });
});
