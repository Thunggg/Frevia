import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ManageSessionMessage, SessionFilterType } from '@shared/types';
import {
  SessionAlreadyExpiredException,
  SessionNotFoundException,
} from '../../src/routes/sessions/sessions.error';
import { SessionsRepository } from '../../src/routes/sessions/sessions.repo';
import { SessionsService } from '../../src/routes/sessions/sessions.service';

describe('Session Management (UF-50 to UF-52)', () => {
  const repository = {
    findAllByUserId: jest.fn(),
    findByIdForUser: jest.fn(),
    deleteActiveByIdForUser: jest.fn(),
  };

  const service = new SessionsService(
    repository as unknown as SessionsRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const expiresAt = new Date('2026-12-31T00:00:00.000Z');

  const currentSession = {
    id: 101,
    userId: 10,
    deviceInfo: 'Chrome on Windows',
    ipAddress: '192.168.1.10',
    expiresAt,
    createdAt,
    isCurrent: true,
  };
  const remoteSession = {
    ...currentSession,
    id: 102,
    deviceInfo: 'Safari on iPhone',
    ipAddress: '192.168.1.25',
    isCurrent: false,
  };

  const defaultFilter: SessionFilterType = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
  };

  const prismaError = () =>
    new PrismaClientKnownRequestError('Prisma failure', {
      code: 'P1001',
      clientVersion: '6.0.0',
    });

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-50 getMySessions', () => {
    // UF-50: Trả về danh sách phiên của người dùng có một phiên đang hoạt động kèm phân trang.
    it('returns the session list with pagination when the user has one active session', async () => {
      repository.findAllByUserId.mockResolvedValue({
        sessions: [currentSession],
        total: 1,
      });

      const result = await service.getMySessions(10, defaultFilter, 101);

      expect(result.sessions).toEqual([currentSession]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    // Trả về nhiều phiên đăng nhập trên các thiết bị khác nhau.
    it('returns every session when the user is logged in on multiple devices', async () => {
      repository.findAllByUserId.mockResolvedValue({
        sessions: [currentSession, remoteSession],
        total: 2,
      });

      const result = await service.getMySessions(10, defaultFilter, 101);

      expect(result.sessions).toHaveLength(2);
    });

    // Không có phiên nào thì trả về mảng rỗng và totalPages = 0.
    it('returns an empty list with zero total pages when the user has no session', async () => {
      repository.findAllByUserId.mockResolvedValue({ sessions: [], total: 0 });

      const result = await service.getMySessions(10, defaultFilter);

      expect(result.sessions).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // userId, bộ lọc và currentSessionId được chuyển nguyên vẹn xuống repository.
    it('forwards the user ID, filter and current session ID to the repository', async () => {
      repository.findAllByUserId.mockResolvedValue({
        sessions: [currentSession, remoteSession],
        total: 2,
      });
      const filter: SessionFilterType = { ...defaultFilter, search: 'Chrome' };

      const result = await service.getMySessions(10, filter, 101);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, filter, 101);
      expect(result.sessions.find((item) => item.id === 101)?.isCurrent).toBe(
        true,
      );
    });

    // Tổng số trang được tính bằng cách làm tròn lên total / limit.
    it('calculates total pages by rounding up total divided by limit', async () => {
      repository.findAllByUserId.mockResolvedValue({
        sessions: [currentSession],
        total: 25,
      });

      const result = await service.getMySessions(10, defaultFilter, 101);

      expect(result.pagination.totalPages).toBe(3);
    });

    // Mọi lỗi từ repository được chuyển thành FailedToLoadSessionsException (500).
    it('throws InternalServerErrorException when loading sessions fails', async () => {
      repository.findAllByUserId.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getMySessions(10, defaultFilter),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-51 getMySessionById', () => {
    // UF-51: Trả về chi tiết phiên thuộc người dùng hiện tại.
    it('returns the session detail when the session belongs to the user', async () => {
      repository.findByIdForUser.mockResolvedValue(currentSession);

      const result = await service.getMySessionById(101, 10, 101);

      expect(result).toEqual(currentSession);
    });

    // Phiên thuộc người dùng khác thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the session belongs to another user', async () => {
      repository.findByIdForUser.mockRejectedValue(SessionNotFoundException());

      await expect(
        service.getMySessionById(102, 99, 101),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // ID phiên không tồn tại thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the session ID does not exist', async () => {
      repository.findByIdForUser.mockRejectedValue(SessionNotFoundException());

      await expect(
        service.getMySessionById(9999, 10, 101),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // id, userId và currentSessionId được chuyển nguyên vẹn xuống repository.
    it('forwards the session ID, user ID and current session ID to the repository', async () => {
      repository.findByIdForUser.mockResolvedValue(remoteSession);

      const result = await service.getMySessionById(102, 10, 101);

      expect(repository.findByIdForUser).toHaveBeenCalledWith(102, 10, 101);
      expect(result.isCurrent).toBe(false);
    });

    // Lỗi Prisma được chuyển thành FailedToLoadSessionDetailException (500).
    it('throws InternalServerErrorException when Prisma fails to load the session', async () => {
      repository.findByIdForUser.mockRejectedValue(prismaError());

      await expect(
        service.getMySessionById(101, 10, 101),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    // Lỗi không phải Prisma (BadRequestException) được ném lại nguyên vẹn.
    it('rethrows a non-Prisma BadRequestException without wrapping it', async () => {
      repository.findByIdForUser.mockRejectedValue(new BadRequestException());

      await expect(service.getMySessionById(0, 10, 101)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('UF-52 revokeMySession', () => {
    // UF-52: Thu hồi phiên ở thiết bị khác và trả về loggedOut = false.
    it('revokes a remote session and returns loggedOut as false', async () => {
      repository.deleteActiveByIdForUser.mockResolvedValue(undefined);

      const result = await service.revokeMySession(102, 10, 101);

      expect(repository.deleteActiveByIdForUser).toHaveBeenCalledWith(102, 10);
      expect(result).toEqual({
        message: ManageSessionMessage.SESSION_REVOKED,
        loggedOut: false,
      });
    });

    // Thu hồi chính phiên đang dùng thì trả về loggedOut = true.
    it('returns loggedOut as true when the revoked session is the current one', async () => {
      repository.deleteActiveByIdForUser.mockResolvedValue(undefined);

      const result = await service.revokeMySession(101, 10, 101);

      expect(result.loggedOut).toBe(true);
    });

    // Phiên thuộc người dùng khác thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the session belongs to another user', async () => {
      repository.deleteActiveByIdForUser.mockRejectedValue(
        SessionNotFoundException(),
      );

      await expect(
        service.revokeMySession(102, 99, 101),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Phiên đã hết hạn thì lỗi 400 từ repository được giữ nguyên.
    it('rethrows BadRequestException when the session is already expired', async () => {
      repository.deleteActiveByIdForUser.mockRejectedValue(
        SessionAlreadyExpiredException(),
      );

      await expect(
        service.revokeMySession(102, 10, 101),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // Không truyền currentSessionId thì loggedOut luôn là false.
    it('returns loggedOut as false when no current session ID is provided', async () => {
      repository.deleteActiveByIdForUser.mockResolvedValue(undefined);

      const result = await service.revokeMySession(101, 10);

      expect(result.loggedOut).toBe(false);
    });

    // Lỗi Prisma khi xóa phiên được chuyển thành FailedToRevokeSessionException (500).
    it('throws InternalServerErrorException when Prisma fails to delete the session', async () => {
      repository.deleteActiveByIdForUser.mockRejectedValue(prismaError());

      await expect(
        service.revokeMySession(102, 10, 101),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
