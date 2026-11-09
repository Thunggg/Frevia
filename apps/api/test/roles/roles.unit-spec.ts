import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ManageRoleMessage } from '@shared/types';
import { RoleNotFoundException } from '../../src/routes/roles/roles.error';
import { RolesRepository } from '../../src/routes/roles/roles.repo';
import { RolesService } from '../../src/routes/roles/roles.service';

describe('Role Management (UF-42 to UF-47)', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActiveByName: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    softDeleteRole: jest.fn(),
    countAssignedUsers: jest.fn(),
    findActivePermissionIds: jest.fn(),
    replaceRolePermissions: jest.fn(),
  };

  const service = new RolesService(repository as unknown as RolesRepository);

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  const adminRoleItem = {
    id: 1,
    name: 'Admin',
    description: 'System administrator',
    createdAt,
  };
  const customRoleItem = {
    id: 10,
    name: 'Support Agent',
    description: 'Handles user tickets',
    createdAt,
  };
  const permissionItem = {
    id: 1,
    name: 'List users',
    path: '/users',
    method: 'GET',
    module: 'Users',
    createdAt,
  };
  const customRoleDetail = { ...customRoleItem, permissions: [permissionItem] };

  const prismaError = (code: string) =>
    new PrismaClientKnownRequestError('Prisma failure', {
      code,
      clientVersion: '6.0.0',
    });

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-42 getRoles', () => {
    // UF-42: Trả về toàn bộ danh sách vai trò đang hoạt động từ repository.
    it('returns the full list of active roles', async () => {
      repository.findAll.mockResolvedValue([adminRoleItem, customRoleItem]);

      const result = await service.getRoles();

      expect(result).toEqual([adminRoleItem, customRoleItem]);
    });

    // Mỗi phần tử vai trò chỉ gồm id, name, description và createdAt.
    it('returns role items that contain only the summary fields', async () => {
      repository.findAll.mockResolvedValue([customRoleItem]);

      const result = await service.getRoles();

      expect(Object.keys(result[0] ?? {}).sort()).toEqual([
        'createdAt',
        'description',
        'id',
        'name',
      ]);
    });

    // Danh sách trả về chứa cả vai trò hệ thống lẫn vai trò tùy chỉnh.
    it('keeps system roles and custom roles in the same response', async () => {
      repository.findAll.mockResolvedValue([adminRoleItem, customRoleItem]);

      const result = await service.getRoles();

      expect(result.map((role) => role.name)).toEqual([
        'Admin',
        'Support Agent',
      ]);
    });

    // Trả về mảng rỗng khi bảng role chưa có bản ghi nào.
    it('returns an empty array when no role exists', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getRoles();

      expect(result).toEqual([]);
    });

    // Gọi repository.findAll đúng một lần và không truyền tham số.
    it('calls the repository findAll once without arguments', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.getRoles();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(repository.findAll).toHaveBeenCalledWith();
    });

    // Mọi lỗi từ repository (kể cả lỗi phân quyền) đều bị chuyển thành lỗi 500.
    it('wraps an authorization error from the repository into InternalServerErrorException', async () => {
      repository.findAll.mockRejectedValue(new ForbiddenException());

      await expect(service.getRoles()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    // Lỗi truy vấn cơ sở dữ liệu được chuyển thành FailedToLoadRolesException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.findAll.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.getRoles()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-43 getRoleById', () => {
    // UF-43: Lấy chi tiết vai trò hệ thống kèm danh sách quyền hạn.
    it('returns the system role detail with its permissions', async () => {
      const adminDetail = { ...adminRoleItem, permissions: [permissionItem] };
      repository.findById.mockResolvedValue(adminDetail);

      const result = await service.getRoleById(1);

      expect(result).toEqual(adminDetail);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    // Lấy chi tiết vai trò tùy chỉnh kèm danh sách quyền hạn.
    it('returns the custom role detail with its permissions', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);

      const result = await service.getRoleById(10);

      expect(result.permissions).toHaveLength(1);
    });

    // Lỗi 404 do repository ném ra được giữ nguyên khi ID không tồn tại.
    it('rethrows NotFoundException when the role ID does not exist', async () => {
      repository.findById.mockRejectedValue(RoleNotFoundException());

      await expect(service.getRoleById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID biên không hợp lệ (0) cũng trả về lỗi 404 từ repository.
    it('rethrows NotFoundException when the role ID is zero', async () => {
      repository.findById.mockRejectedValue(RoleNotFoundException());

      await expect(service.getRoleById(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi không phải Prisma (ví dụ ForbiddenException) được ném lại nguyên vẹn.
    it('rethrows a non-Prisma error without wrapping it', async () => {
      repository.findById.mockRejectedValue(new ForbiddenException());

      await expect(service.getRoleById(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Lỗi Prisma được chuyển thành FailedToLoadRoleDetailException (500).
    it('throws InternalServerErrorException when Prisma fails to load the role', async () => {
      repository.findById.mockRejectedValue(prismaError('P1001'));

      await expect(service.getRoleById(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-44 createRole', () => {
    // UF-44: Tạo vai trò mới khi tên chưa tồn tại.
    it('creates a custom role when the name is unique', async () => {
      repository.findActiveByName.mockResolvedValue(null);
      repository.createRole.mockResolvedValue(customRoleItem);

      const result = await service.createRole({
        name: 'Support Agent',
        description: 'Handles user tickets',
      });

      expect(result).toEqual(customRoleItem);
      expect(repository.createRole).toHaveBeenCalledWith({
        name: 'Support Agent',
        description: 'Handles user tickets',
      });
    });

    // Tên trùng với vai trò đang hoạt động bị từ chối bằng ConflictException.
    it('throws ConflictException when an active role has the same name', async () => {
      repository.findActiveByName.mockResolvedValue(customRoleItem);

      await expect(
        service.createRole({ name: 'Support Agent', description: null }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.createRole).not.toHaveBeenCalled();
    });

    // Tên trùng tên vai trò hệ thống (Client) bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the name matches a system role', async () => {
      await expect(
        service.createRole({ name: 'Client', description: null }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.createRole).not.toHaveBeenCalled();
    });

    // Tên dài đúng 50 ký tự vẫn được tạo thành công.
    it('creates a role when the name has exactly 50 characters', async () => {
      const boundaryName = 'R'.repeat(50);
      repository.findActiveByName.mockResolvedValue(null);
      repository.createRole.mockResolvedValue({
        ...customRoleItem,
        name: boundaryName,
      });

      const result = await service.createRole({
        name: boundaryName,
        description: null,
      });

      expect(result.name).toBe(boundaryName);
    });

    // Việc so sánh tên vai trò hệ thống không phân biệt hoa thường.
    it('throws ForbiddenException when the system role name differs only by case', async () => {
      await expect(
        service.createRole({ name: ' ADMIN ', description: null }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Lỗi trùng khóa duy nhất P2002 khi race condition được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.findActiveByName.mockResolvedValue(null);
      repository.createRole.mockRejectedValue(prismaError('P2002'));

      await expect(
        service.createRole({ name: 'Support Agent', description: null }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi Prisma khác khi tạo vai trò được chuyển thành FailedToCreateRoleException (500).
    it('throws InternalServerErrorException when Prisma fails to insert the role', async () => {
      repository.findActiveByName.mockResolvedValue(null);
      repository.createRole.mockRejectedValue(prismaError('P1001'));

      await expect(
        service.createRole({ name: 'Moderator', description: null }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-45 updateRole', () => {
    // UF-45: Cập nhật tên và mô tả của vai trò tùy chỉnh thành công.
    it('updates a custom role when the new name is unique', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActiveByName.mockResolvedValue(null);
      repository.updateRole.mockResolvedValue({
        ...customRoleItem,
        name: 'Senior Support',
      });

      const result = await service.updateRole(10, { name: 'Senior Support' });

      expect(result.name).toBe('Senior Support');
      expect(repository.findActiveByName).toHaveBeenCalledWith(
        'Senior Support',
        10,
      );
    });

    // Vai trò mục tiêu là vai trò hệ thống thì bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the target role is a system role', async () => {
      repository.findById.mockResolvedValue({
        ...adminRoleItem,
        permissions: [],
      });

      await expect(
        service.updateRole(1, { description: 'Changed' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateRole).not.toHaveBeenCalled();
    });

    // ID vai trò không tồn tại thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the target role does not exist', async () => {
      repository.findById.mockRejectedValue(RoleNotFoundException());

      await expect(
        service.updateRole(999, { name: 'Ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Tên mới trùng với vai trò khác bị từ chối bằng ConflictException.
    it('throws ConflictException when the new name belongs to another role', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActiveByName.mockResolvedValue({
        ...customRoleItem,
        id: 12,
      });

      await expect(
        service.updateRole(10, { name: 'Content Editor' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Đổi tên thành tên vai trò hệ thống bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when renaming a role to a system role name', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);

      await expect(
        service.updateRole(10, { name: 'Freelancer' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Chỉ cập nhật mô tả thì không kiểm tra trùng tên.
    it('skips the duplicate name lookup when only the description changes', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.updateRole.mockResolvedValue({
        ...customRoleItem,
        description: 'New description',
      });

      const result = await service.updateRole(10, {
        description: 'New description',
      });

      expect(repository.findActiveByName).not.toHaveBeenCalled();
      expect(result.description).toBe('New description');
    });

    // Lỗi P2002 khi cập nhật được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActiveByName.mockResolvedValue(null);
      repository.updateRole.mockRejectedValue(prismaError('P2002'));

      await expect(
        service.updateRole(10, { name: 'Race Name' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi Prisma khác khi cập nhật được chuyển thành FailedToUpdateRoleException (500).
    it('throws InternalServerErrorException when Prisma fails to update the role', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActiveByName.mockResolvedValue(null);
      repository.updateRole.mockRejectedValue(prismaError('P2025'));

      await expect(
        service.updateRole(10, { name: 'Broken Update' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-46 deleteRole', () => {
    // UF-46: Xóa mềm vai trò tùy chỉnh khi chưa gán cho người dùng nào.
    it('soft-deletes a custom role when no user is assigned to it', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.countAssignedUsers.mockResolvedValue(0);
      repository.softDeleteRole.mockResolvedValue(undefined);

      const result = await service.deleteRole(10);

      expect(repository.softDeleteRole).toHaveBeenCalledWith(10);
      expect(result).toEqual({ message: ManageRoleMessage.ROLE_DELETED });
    });

    // Vai trò hệ thống không được phép xóa.
    it('throws ForbiddenException when deleting a system role', async () => {
      repository.findById.mockResolvedValue({
        ...adminRoleItem,
        permissions: [],
      });

      await expect(service.deleteRole(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.softDeleteRole).not.toHaveBeenCalled();
    });

    // Vai trò đang được gán cho người dùng thì không được xóa.
    it('throws ConflictException when the role is assigned to at least one user', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.countAssignedUsers.mockResolvedValue(2);

      await expect(service.deleteRole(10)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.softDeleteRole).not.toHaveBeenCalled();
    });

    // ID vai trò không tồn tại thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the role does not exist', async () => {
      repository.findById.mockRejectedValue(RoleNotFoundException());

      await expect(service.deleteRole(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Vai trò Expert cũng được coi là vai trò hệ thống và không thể xóa.
    it('throws ForbiddenException when deleting the Expert system role', async () => {
      repository.findById.mockResolvedValue({
        ...adminRoleItem,
        id: 4,
        name: 'Expert',
        permissions: [],
      });

      await expect(service.deleteRole(4)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Lỗi Prisma khi xóa được chuyển thành FailedToDeleteRoleException (500).
    it('throws InternalServerErrorException when Prisma fails to delete the role', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.countAssignedUsers.mockResolvedValue(0);
      repository.softDeleteRole.mockRejectedValue(prismaError('P2003'));

      await expect(service.deleteRole(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-47 setRolePermissions', () => {
    // UF-47: Gán lại danh sách quyền cho vai trò và trả về chi tiết sau cập nhật.
    it('replaces the role permissions and returns the updated role detail', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActivePermissionIds.mockResolvedValue([1, 2]);
      repository.replaceRolePermissions.mockResolvedValue(undefined);

      const result = await service.setRolePermissions(10, {
        permissionIds: [1, 2],
      });

      expect(repository.replaceRolePermissions).toHaveBeenCalledWith(
        10,
        [1, 2],
      );
      expect(result).toEqual(customRoleDetail);
    });

    // Các permissionId trùng lặp được loại bỏ trước khi kiểm tra và lưu.
    it('deduplicates permission IDs before validating and saving them', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActivePermissionIds.mockResolvedValue([1, 2]);

      await service.setRolePermissions(10, { permissionIds: [1, 2, 1, 2] });

      expect(repository.findActivePermissionIds).toHaveBeenCalledWith([1, 2]);
      expect(repository.replaceRolePermissions).toHaveBeenCalledWith(
        10,
        [1, 2],
      );
    });

    // Mảng rỗng thu hồi toàn bộ quyền của vai trò.
    it('revokes all permissions when the permissionIds array is empty', async () => {
      repository.findById.mockResolvedValue({
        ...customRoleItem,
        permissions: [],
      });
      repository.findActivePermissionIds.mockResolvedValue([]);

      const result = await service.setRolePermissions(10, {
        permissionIds: [],
      });

      expect(repository.replaceRolePermissions).toHaveBeenCalledWith(10, []);
      expect(result.permissions).toEqual([]);
    });

    // Danh sách chứa permissionId không tồn tại bị từ chối bằng BadRequestException.
    it('throws BadRequestException when a permission ID does not exist', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActivePermissionIds.mockResolvedValue([1]);

      await expect(
        service.setRolePermissions(10, { permissionIds: [1, 999] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.replaceRolePermissions).not.toHaveBeenCalled();
    });

    // Vai trò không tồn tại thì lỗi 404 từ repository được giữ nguyên.
    it('rethrows NotFoundException when the role does not exist', async () => {
      repository.findById.mockRejectedValue(RoleNotFoundException());

      await expect(
        service.setRolePermissions(999, { permissionIds: [1] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi Prisma khi lưu quyền được chuyển thành FailedToSetRolePermissionsException (500).
    it('throws InternalServerErrorException when the permission transaction fails', async () => {
      repository.findById.mockResolvedValue(customRoleDetail);
      repository.findActivePermissionIds.mockResolvedValue([1]);
      repository.replaceRolePermissions.mockRejectedValue(prismaError('P2034'));

      await expect(
        service.setRolePermissions(10, { permissionIds: [1] }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
