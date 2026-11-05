import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { SkillAdminQueryType } from '@shared/types';
import {
  SkillAdminNotFoundException,
  SkillNameAlreadyExistsException,
} from '../../src/routes/skills-admin/skills-admin.error';
import { SkillsAdminRepository } from '../../src/routes/skills-admin/skills-admin.repo';
import { SkillsAdminService } from '../../src/routes/skills-admin/skills-admin.service';

describe('Skill Management (UF-73 to UF-78)', () => {
  const repository = {
    listSkills: jest.fn(),
    getSkillDetail: jest.fn(),
    createSkill: jest.fn(),
    updateSkill: jest.fn(),
    deleteSkill: jest.fn(),
    restoreSkill: jest.fn(),
  };

  const service = new SkillsAdminService(
    repository as unknown as SkillsAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const reactSkill = {
    id: 1,
    name: 'React',
    slug: 'react',
    description: 'React library',
    deletedAt: null,
    createdAt,
    updatedAt,
    jobCount: 4,
  };

  const defaultQuery: SkillAdminQueryType = {
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'desc',
  };

  const uniqueViolation = () =>
    new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-73 listSkills', () => {
    // UF-73: Trả về danh sách kỹ năng kèm jobCount và phân trang mặc định.
    it('returns the skill list with job counts and default pagination', async () => {
      const response = {
        skills: [reactSkill],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.listSkills.mockResolvedValue(response);

      const result = await service.listSkills(defaultQuery);

      expect(result).toEqual(response);
      expect(repository.listSkills).toHaveBeenCalledWith(defaultQuery);
    });

    // Từ khóa tìm kiếm (tên, slug, mô tả) được chuyển nguyên vẹn xuống repository.
    it('forwards the search keyword to the repository', async () => {
      const query: SkillAdminQueryType = { ...defaultQuery, search: 'react' };
      repository.listSkills.mockResolvedValue({
        skills: [reactSkill],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.listSkills(query);

      expect(repository.listSkills).toHaveBeenCalledWith(query);
    });

    // Bộ lọc deleted = false chỉ lấy kỹ năng đang hoạt động.
    it('forwards the active-only filter to the repository', async () => {
      const query: SkillAdminQueryType = { ...defaultQuery, deleted: 'false' };
      repository.listSkills.mockResolvedValue({
        skills: [reactSkill],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.listSkills(query);

      expect(repository.listSkills).toHaveBeenCalledWith(query);
    });

    // Bộ lọc deleted = true chỉ lấy kỹ năng đã xóa mềm.
    it('forwards the soft-deleted filter to the repository', async () => {
      const query: SkillAdminQueryType = { ...defaultQuery, deleted: 'true' };
      repository.listSkills.mockResolvedValue({
        skills: [{ ...reactSkill, deletedAt: updatedAt }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await service.listSkills(query);

      expect(result.skills[0]?.deletedAt).toEqual(updatedAt);
    });

    // Giới hạn tối đa 100 bản ghi mỗi trang được chuyển nguyên vẹn xuống repository.
    it('forwards the maximum page size of 100 to the repository', async () => {
      const query: SkillAdminQueryType = { ...defaultQuery, limit: 100 };
      repository.listSkills.mockResolvedValue({
        skills: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
      });

      const result = await service.listSkills(query);

      expect(result.pagination.limit).toBe(100);
    });

    // Lỗi kết nối cơ sở dữ liệu được chuyển thành FailedToLoadSkillListException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.listSkills.mockRejectedValue(new Error('Connection failure'));

      await expect(service.listSkills(defaultQuery)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-74 getSkillDetail', () => {
    // UF-74: Trả về chi tiết kỹ năng kèm jobCount khi ID tồn tại.
    it('returns the skill detail when the ID exists', async () => {
      repository.getSkillDetail.mockResolvedValue(reactSkill);

      const result = await service.getSkillDetail(1);

      expect(result).toEqual(reactSkill);
      expect(repository.getSkillDetail).toHaveBeenCalledWith(1);
    });

    // Repository trả về null thì service ném NotFoundException.
    it('throws NotFoundException when the skill does not exist', async () => {
      repository.getSkillDetail.mockResolvedValue(null);

      await expect(service.getSkillDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID biên không hợp lệ (0) cũng trả về NotFoundException.
    it('throws NotFoundException when the skill ID is zero', async () => {
      repository.getSkillDetail.mockResolvedValue(null);

      await expect(service.getSkillDetail(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi timeout cơ sở dữ liệu được chuyển thành FailedToLoadSkillDetailException (500).
    it('throws InternalServerErrorException when the database times out', async () => {
      repository.getSkillDetail.mockRejectedValue(new Error('Timeout'));

      await expect(service.getSkillDetail(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-75 createSkill', () => {
    // UF-75: Tạo kỹ năng mới với tên duy nhất và nhận lại slug cùng jobCount = 0.
    it('creates a skill with a generated slug and zero job count', async () => {
      repository.createSkill.mockResolvedValue({
        ...reactSkill,
        id: 2,
        name: 'Vue',
        slug: 'vue',
        jobCount: 0,
      });

      const result = await service.createSkill({
        name: 'Vue',
        description: 'Vue framework',
      });

      expect(result.slug).toBe('vue');
      expect(result.jobCount).toBe(0);
    });

    // Tên kỹ năng trùng (không phân biệt hoa thường) bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the skill name already exists', async () => {
      repository.createSkill.mockRejectedValue(
        SkillNameAlreadyExistsException(),
      );

      await expect(
        service.createSkill({ name: 'react', description: null }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi P2002 do race condition được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.createSkill.mockRejectedValue(uniqueViolation());

      await expect(
        service.createSkill({ name: 'React', description: null }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Tên kỹ năng có dấu và ký tự đặc biệt vẫn được tạo và chuyển nguyên vẹn xuống repository.
    it('forwards a skill name with accents and special characters to the repository', async () => {
      repository.createSkill.mockResolvedValue({
        ...reactSkill,
        id: 3,
        name: 'Lập trình C++',
        slug: 'lap-trinh-c',
        jobCount: 0,
      });

      const result = await service.createSkill({ name: 'Lập trình C++' });

      expect(repository.createSkill).toHaveBeenCalledWith({
        name: 'Lập trình C++',
      });
      expect(result.slug).toBe('lap-trinh-c');
    });

    // Lỗi ghi cơ sở dữ liệu được chuyển thành FailedToCreateSkillException (500).
    it('throws InternalServerErrorException when the database insert fails', async () => {
      repository.createSkill.mockRejectedValue(new Error('Insert failure'));

      await expect(
        service.createSkill({ name: 'Broken', description: null }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-76 updateSkill', () => {
    // UF-76: Cập nhật tên và mô tả kỹ năng, slug được tạo lại.
    it('updates the skill and returns the regenerated slug', async () => {
      repository.updateSkill.mockResolvedValue({
        ...reactSkill,
        name: 'React.js',
        slug: 'react-js',
      });

      const result = await service.updateSkill(1, {
        name: 'React.js',
        description: 'Updated',
      });

      expect(result.slug).toBe('react-js');
      expect(repository.updateSkill).toHaveBeenCalledWith(1, {
        name: 'React.js',
        description: 'Updated',
      });
    });

    // Tên mới trùng với kỹ năng khác bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the new name belongs to another skill', async () => {
      repository.updateSkill.mockRejectedValue(
        SkillNameAlreadyExistsException(),
      );

      await expect(
        service.updateSkill(1, { name: 'Vue' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi P2002 khi cập nhật được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.updateSkill.mockRejectedValue(uniqueViolation());

      await expect(
        service.updateSkill(1, { name: 'Vue' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // ID kỹ năng không tồn tại trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the skill ID does not exist', async () => {
      repository.updateSkill.mockRejectedValue(SkillAdminNotFoundException());

      await expect(
        service.updateSkill(999999, { name: 'Ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi cập nhật cơ sở dữ liệu được chuyển thành FailedToUpdateSkillException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.updateSkill.mockRejectedValue(new Error('Update failure'));

      await expect(
        service.updateSkill(1, { name: 'Broken' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-77 deleteSkill', () => {
    // UF-77: Xóa mềm kỹ năng đang hoạt động và trả về thông báo xóa thành công.
    it('soft-deletes an active skill and returns the confirmation message', async () => {
      repository.deleteSkill.mockResolvedValue({
        message: 'Skill deleted successfully',
      });

      const result = await service.deleteSkill(1);

      expect(result).toEqual({ message: 'Skill deleted successfully' });
      expect(repository.deleteSkill).toHaveBeenCalledWith(1);
    });

    // Kỹ năng đang gán cho freelancer vẫn được xóa mềm và trả về cùng thông báo.
    it('returns the confirmation message when the skill is assigned to freelancers', async () => {
      repository.deleteSkill.mockResolvedValue({
        message: 'Skill deleted successfully',
      });

      const result = await service.deleteSkill(4);

      expect(result.message).toBe('Skill deleted successfully');
    });

    // ID kỹ năng không tồn tại trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the skill ID does not exist', async () => {
      repository.deleteSkill.mockRejectedValue(SkillAdminNotFoundException());

      await expect(service.deleteSkill(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi giao dịch cơ sở dữ liệu được chuyển thành FailedToDeleteSkillException (500).
    it('throws InternalServerErrorException when the database transaction fails', async () => {
      repository.deleteSkill.mockRejectedValue(
        new Error('Transaction failure'),
      );

      await expect(service.deleteSkill(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-78 restoreSkill', () => {
    // UF-78: Khôi phục kỹ năng đã xóa mềm bằng cách đặt deletedAt về null.
    it('restores a soft-deleted skill with deletedAt reset to null', async () => {
      repository.restoreSkill.mockResolvedValue(reactSkill);

      const result = await service.restoreSkill(1);

      expect(result.deletedAt).toBeNull();
      expect(repository.restoreSkill).toHaveBeenCalledWith(1);
    });

    // Kỹ năng đang hoạt động (chưa xóa) trả về NotFoundException.
    it('rethrows NotFoundException when the skill is already active', async () => {
      repository.restoreSkill.mockRejectedValue(SkillAdminNotFoundException());

      await expect(service.restoreSkill(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Tên trùng với kỹ năng đang hoạt động được tạo trong lúc bị xóa bị từ chối bằng ConflictException.
    it('rethrows ConflictException when an active skill already uses the same name', async () => {
      repository.restoreSkill.mockRejectedValue(
        SkillNameAlreadyExistsException(),
      );

      await expect(service.restoreSkill(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // ID kỹ năng không tồn tại trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the skill ID does not exist', async () => {
      repository.restoreSkill.mockRejectedValue(SkillAdminNotFoundException());

      await expect(service.restoreSkill(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi cập nhật cơ sở dữ liệu được chuyển thành FailedToRestoreSkillException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.restoreSkill.mockRejectedValue(new Error('Update failure'));

      await expect(service.restoreSkill(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
