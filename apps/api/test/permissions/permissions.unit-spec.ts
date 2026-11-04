import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PermissionFilterType } from '@shared/types';
import { PermissionNotFoundException } from '../../src/routes/permissions/permissions.error';
import { PermissionsRepository } from '../../src/routes/permissions/permissions.repo';
import { PermissionsService } from '../../src/routes/permissions/permissions.service';

describe('Manage Permission (UF-48 to UF-49)', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const service = new PermissionsService(
    repository as unknown as PermissionsRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  const listUsersPermission = {
    id: 1,
    name: 'List users',
    path: '/users',
    method: 'GET',
    module: 'Users',
    createdAt,
  };

  const defaultFilter: PermissionFilterType = {
    page: 1,
    limit: 20,
    sortBy: 'id',
    order: 'asc',
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-48 getPermissions', () => {
    // UF-48: Trả về danh sách quyền kèm thông tin phân trang mặc định (trang 1, 20 bản ghi).
    it('returns the permission list with default pagination metadata', async () => {
      repository.findAll.mockResolvedValue({
        permissions: [listUsersPermission],
        total: 45,
        modules: ['Users'],
      });

      const result = await service.getPermissions(defaultFilter);

      expect(result.permissions).toEqual([listUsersPermission]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
      expect(result.modules).toEqual(['Users']);
    });

    // Bộ lọc theo module được chuyển nguyên vẹn xuống repository.
    it('forwards the module filter to the repository', async () => {
      const filter: PermissionFilterType = {
        ...defaultFilter,
        module: 'Users',
      };
      repository.findAll.mockResolvedValue({
        permissions: [listUsersPermission],
        total: 1,
        modules: ['Users', 'Roles'],
      });

      await service.getPermissions(filter);

      expect(repository.findAll).toHaveBeenCalledWith(filter);
    });

    // Bộ lọc theo phương thức HTTP POST được chuyển xuống repository và kết quả được giữ nguyên.
    it('forwards the HTTP method filter and returns the matching permissions', async () => {
      const filter: PermissionFilterType = { ...defaultFilter, method: 'POST' };
      const createUserPermission = {
        ...listUsersPermission,
        id: 2,
        name: 'Create user',
        method: 'POST',
      };
      repository.findAll.mockResolvedValue({
        permissions: [createUserPermission],
        total: 1,
        modules: ['Users'],
      });

      const result = await service.getPermissions(filter);

      expect(repository.findAll).toHaveBeenCalledWith(filter);
      expect(result.permissions[0]?.method).toBe('POST');
    });

    // Từ khóa tìm kiếm được chuyển nguyên vẹn xuống repository.
    it('forwards the search keyword to the repository', async () => {
      const filter: PermissionFilterType = {
        ...defaultFilter,
        search: '/api/auth',
      };
      repository.findAll.mockResolvedValue({
        permissions: [],
        total: 0,
        modules: [],
      });

      await service.getPermissions(filter);

      expect(repository.findAll).toHaveBeenCalledWith(filter);
    });

    // Trang vượt quá dữ liệu trả về mảng rỗng nhưng vẫn giữ metadata phân trang.
    it('returns an empty list with pagination metadata when the page exceeds the data', async () => {
      repository.findAll.mockResolvedValue({
        permissions: [],
        total: 5,
        modules: ['Users'],
      });

      const result = await service.getPermissions({
        ...defaultFilter,
        page: 9,
        limit: 10,
      });

      expect(result.permissions).toEqual([]);
      expect(result.pagination).toEqual({
        page: 9,
        limit: 10,
        total: 5,
        totalPages: 1,
      });
    });

    // Mọi lỗi từ repository được chuyển thành FailedToLoadPermissionsException (500).
    it('throws InternalServerErrorException when loading permissions fails', async () => {
      repository.findAll.mockRejectedValue(new Error('Database query failed'));

      await expect(
        service.getPermissions(defaultFilter),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-49 getPermissionById', () => {
    // UF-49: Trả về chi tiết quyền khi ID tồn tại.
    it('returns the permission detail when the ID exists', async () => {
      repository.findById.mockResolvedValue(listUsersPermission);

      const result = await service.getPermissionById(1);

      expect(result).toEqual(listUsersPermission);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    // Lỗi 404 từ repository được giữ nguyên khi ID không tồn tại.
    it('rethrows NotFoundException when the permission ID does not exist', async () => {
      repository.findById.mockRejectedValue(PermissionNotFoundException());

      await expect(service.getPermissionById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi không phải Prisma (BadRequestException) được ném lại nguyên vẹn.
    it('rethrows a non-Prisma BadRequestException without wrapping it', async () => {
      repository.findById.mockRejectedValue(new BadRequestException());

      await expect(service.getPermissionById(-1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    // Lỗi không phải Prisma (ForbiddenException) được ném lại nguyên vẹn.
    it('rethrows a non-Prisma ForbiddenException without wrapping it', async () => {
      repository.findById.mockRejectedValue(new ForbiddenException());

      await expect(service.getPermissionById(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Lỗi Prisma được chuyển thành FailedToLoadPermissionDetailException (500).
    it('throws InternalServerErrorException when Prisma fails to load the permission', async () => {
      repository.findById.mockRejectedValue(
        new PrismaClientKnownRequestError('Query timeout', {
          code: 'P1008',
          clientVersion: '6.0.0',
        }),
      );

      await expect(service.getPermissionById(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    // Chi tiết quyền trả về đủ các trường path, method và module.
    it('returns the path, method and module of the permission', async () => {
      repository.findById.mockResolvedValue({
        ...listUsersPermission,
        id: 15,
        path: '/roles/:id/permissions',
        method: 'PUT',
        module: 'Roles',
      });

      const result = await service.getPermissionById(15);

      expect(result).toMatchObject({
        path: '/roles/:id/permissions',
        method: 'PUT',
        module: 'Roles',
      });
    });
  });
});
