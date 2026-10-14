import { NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repo';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    softDelete: jest.fn(),
  };
  const service = new NotificationService(
    repository as unknown as NotificationRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('only marks a notification found for the current user', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.markRead(10, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.markRead).not.toHaveBeenCalled();
  });

  it('bulk marks unread notifications and returns the updated count', async () => {
    repository.markAllRead.mockResolvedValue({ count: 3 });

    await expect(service.markAllRead(10)).resolves.toEqual({
      message: '3 notification(s) marked as read.',
    });
  });

  it('soft deletes a notification owned by the current user', async () => {
    repository.findById.mockResolvedValue({ id: 7, userId: 10 });
    repository.softDelete.mockResolvedValue({ id: 7 });

    await service.delete(10, 7);

    expect(repository.softDelete).toHaveBeenCalledWith(7);
  });
});
