import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import { JobAlertRepository } from './job-alert.repo';
import { JobAlertService } from './job-alert.service';

describe('JobAlertService (UC-23)', () => {
  const repository = {
    countByUserId: jest.fn(),
    findDuplicate: jest.fn(),
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
    name: 'React Alert',
    keywords: 'NodeJS NestJS',
    skills: ['TypeScript', 'NodeJS'],
    frequency: 'DAILY',
    channels: ['IN_APP'],
    isActive: true,
    lastSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.countByUserId.mockResolvedValue(0);
    repository.findDuplicate.mockResolvedValue(null);
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
          frequency: 'DAILY',
          channels: ['IN_APP'],
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

  describe('UC-23.01: View Job Alert List', () => {
    it('returns job alerts for freelancer', async () => {
      repository.findAllByUserId.mockResolvedValue([mockAlert]);

      const result = await service.getJobAlerts(10, RoleName.FREELANCER);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockAlert]);
    });
  });

  describe('UC-23.02: View Job Alert Detail', () => {
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

  describe('UC-23.03: Create Job Alert', () => {
    it('creates and returns job alert with new fields', async () => {
      const createData = {
        name: 'Frontend Alert',
        keywords: 'React',
        skills: ['Frontend'],
        frequency: 'INSTANT' as const,
        channels: ['IN_APP' as const, 'EMAIL' as const],
      };
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
      expect(result.frequency).toBe('INSTANT');
    });

    it('throws BadRequestException when user has already reached 10 alerts limit', async () => {
      repository.countByUserId.mockResolvedValue(10);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          keywords: 'Over limit',
          skills: [],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when alert criteria already exists', async () => {
      repository.findDuplicate.mockResolvedValue(mockAlert);

      await expect(
        service.createJobAlert(10, RoleName.FREELANCER, {
          keywords: 'NodeJS NestJS',
          skills: ['TypeScript', 'NodeJS'],
          frequency: 'DAILY',
          channels: ['IN_APP'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('UC-23.04: Update Job Alert', () => {
    it('updates and returns job alert when found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(mockAlert);
      const updateData = {
        name: 'Updated Name',
        keywords: 'Fullstack',
        frequency: 'WEEKLY' as const,
        isActive: false,
      };
      repository.update.mockResolvedValue({
        ...mockAlert,
        ...updateData,
      });

      const result = await service.updateJobAlert(
        10,
        RoleName.FREELANCER,
        1,
        updateData,
      );

      expect(repository.update).toHaveBeenCalledWith(1, 10, updateData);
      expect(result.keywords).toBe('Fullstack');
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException if alert to update does not exist', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 999, {
          keywords: 'Fullstack',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException if updated criteria duplicates another alert', async () => {
      repository.findByIdAndUserId.mockResolvedValue(mockAlert);
      repository.findDuplicate.mockResolvedValue({ ...mockAlert, id: 2 });

      await expect(
        service.updateJobAlert(10, RoleName.FREELANCER, 1, {
          keywords: 'Duplicate Keyword',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('UC-23.05: Delete Job Alert', () => {
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
