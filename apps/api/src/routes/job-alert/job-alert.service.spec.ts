import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { JobAlertRepository } from './job-alert.repo';
import { JobAlertService } from './job-alert.service';

describe('JobAlertService', () => {
  const repository = {
    findAllByUserId: jest.fn(),
    findByIdAndUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const service = new JobAlertService(
    repository as unknown as JobAlertRepository,
  );

  const mockAlert = {
    id: 1,
    userId: 10,
    keywords: 'NodeJS NestJS',
    skills: ['TypeScript', 'NodeJS'],
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('role checks', () => {
    it('throws ForbiddenException if user is not a freelancer', async () => {
      await expect(
        service.getJobAlerts(10, RoleName.CLIENT),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.getJobAlertDetail(10, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.createJobAlert(10, RoleName.CLIENT, {
          keywords: 'test',
          skills: [],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.updateJobAlert(10, RoleName.CLIENT, 1, { keywords: 'updated' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        service.deleteJobAlert(10, RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getJobAlerts', () => {
    it('returns job alerts for freelancer', async () => {
      repository.findAllByUserId.mockResolvedValue([mockAlert]);

      const result = await service.getJobAlerts(10, RoleName.FREELANCER);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockAlert]);
    });
  });

  describe('getJobAlertDetail', () => {
    it('returns alert detail when found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(mockAlert);

      const result = await service.getJobAlertDetail(
        10,
        RoleName.FREELANCER,
        1,
      );

      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockAlert);
    });

    it('throws NotFoundException when alert not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.getJobAlertDetail(10, RoleName.FREELANCER, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createJobAlert', () => {
    it('creates and returns job alert', async () => {
      const createData = { keywords: 'React', skills: ['Frontend'] };
      repository.create.mockResolvedValue({
        ...mockAlert,
        ...createData,
      });

      const result = await service.createJobAlert(
        10,
        RoleName.FREELANCER,
        createData,
      );

      expect(repository.create).toHaveBeenCalledWith(10, createData);
      expect(result.keywords).toBe('React');
    });
  });

  describe('updateJobAlert', () => {
    it('updates and returns job alert when found', async () => {
      const updateData = { keywords: 'Fullstack' };
      repository.update.mockResolvedValue({
        ...mockAlert,
        keywords: 'Fullstack',
      });

      const result = await service.updateJobAlert(
        10,
        RoleName.FREELANCER,
        1,
        updateData,
      );

      expect(repository.update).toHaveBeenCalledWith(1, 10, updateData);
      expect(result.keywords).toBe('Fullstack');
    });

    it('throws NotFoundException if alert to update does not exist', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 999, {
          keywords: 'Fullstack',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteJobAlert', () => {
    it('deletes job alert and returns success', async () => {
      repository.delete.mockResolvedValue(true);

      const result = await service.deleteJobAlert(10, RoleName.FREELANCER, 1);

      expect(repository.delete).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ success: true });
    });

    it('throws NotFoundException if alert to delete does not exist', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(
        service.deleteJobAlert(10, RoleName.FREELANCER, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
