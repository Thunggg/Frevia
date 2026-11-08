import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateSavedSearchBodySchema,
  MAX_SAVED_SEARCHES_PER_USER,
  type SavedSearchType,
  UpdateSavedSearchBodySchema,
} from '@shared/types';

import {
  FailedToCreateSavedSearchException,
  FailedToLoadSavedSearchException,
  SavedSearchLimitExceededException,
  SavedSearchNotFoundException,
} from '../../src/routes/saved-search/saved-search.error';
import { SavedSearchRepository } from '../../src/routes/saved-search/saved-search.repo';
import { SavedSearchService } from '../../src/routes/saved-search/saved-search.service';

describe('Saved Searches (UF-100 to UF-104)', () => {
  let repository: {
    countByUserId: jest.Mock;
    findAllByUserId: jest.Mock;
    findByIdAndUserId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  let service: SavedSearchService;

  const mockSavedSearch: SavedSearchType = {
    id: 1,
    userId: 10,
    name: 'React Developer Jobs',
    searchParams: { keyword: 'react', minBudget: 500, maxBudget: 2000 },
    createdAt: new Date('2026-03-01T10:00:00Z'),
  };

  beforeEach(() => {
    repository = {
      countByUserId: jest.fn().mockResolvedValue(0),
      findAllByUserId: jest.fn().mockResolvedValue([mockSavedSearch]),
      findByIdAndUserId: jest.fn().mockResolvedValue(mockSavedSearch),
      create: jest.fn().mockResolvedValue(mockSavedSearch),
      update: jest.fn().mockResolvedValue(mockSavedSearch),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new SavedSearchService(
      repository as unknown as SavedSearchRepository,
    );

    jest.clearAllMocks();
  });

  describe('UF-100 getSavedSearches', () => {
    // UF-100: Lấy danh sách tìm kiếm đã lưu của người dùng thành công.
    it('returns saved searches for the authenticated user', async () => {
      const result = await service.getSavedSearches(10);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, undefined);
      expect(result).toEqual([mockSavedSearch]);
    });

    // Lọc danh sách tìm kiếm đã lưu theo từ khóa tìm kiếm.
    it('filters saved searches by search keyword query', async () => {
      const query = { search: 'React', order: 'desc' as const };

      await service.getSavedSearches(10, query);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, query);
    });

    // Sắp xếp danh sách tìm kiếm đã lưu theo thứ tự tăng dần (asc).
    it('sorts saved searches in ascending order', async () => {
      const query = { order: 'asc' as const };

      await service.getSavedSearches(10, query);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, query);
    });

    // Trả về mảng rỗng khi người dùng chưa có tìm kiếm đã lưu nào.
    it('returns empty array when user has no saved searches', async () => {
      repository.findAllByUserId.mockResolvedValueOnce([]);

      const result = await service.getSavedSearches(10);

      expect(result).toEqual([]);
    });

    // Trả về mảng rỗng khi từ khóa tìm kiếm không khớp bản ghi nào.
    it('returns empty array when keyword query matches no saved searches', async () => {
      repository.findAllByUserId.mockResolvedValueOnce([]);

      const result = await service.getSavedSearches(10, {
        search: 'NonExistentSearch',
        order: 'desc',
      });

      expect(result).toEqual([]);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadSavedSearchException.
    it('throws FailedToLoadSavedSearchException on database error', async () => {
      repository.findAllByUserId.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('database read failure', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(service.getSavedSearches(10)).rejects.toThrow(
        FailedToLoadSavedSearchException(),
      );
    });
  });

  describe('UF-101 getSavedSearchDetail', () => {
    // UF-101: Xem chi tiết tìm kiếm đã lưu thuộc sở hữu của người dùng.
    it('returns saved search detail when owned by user', async () => {
      const result = await service.getSavedSearchDetail(10, 1);

      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockSavedSearch);
    });

    // Trả về đúng cấu trúc searchParams chứa các tiêu chí lọc phức tạp.
    it('returns correct searchParams with complex filter criteria', async () => {
      const complexSearch: SavedSearchType = {
        ...mockSavedSearch,
        searchParams: {
          keyword: 'NestJS Fullstack',
          skills: ['TypeScript', 'Docker', 'PostgreSQL'],
          minBudget: 1000,
          maxBudget: 5000,
          experienceLevel: 'EXPERT',
        },
      };
      repository.findByIdAndUserId.mockResolvedValueOnce(complexSearch);

      const result = await service.getSavedSearchDetail(10, 1);

      expect(result.searchParams).toEqual(complexSearch.searchParams);
    });

    // Báo lỗi NotFound khi ID tìm kiếm không tồn tại trong hệ thống.
    it('raises NotFound when saved search id does not exist', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(service.getSavedSearchDetail(10, 999)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    // Báo lỗi NotFound khi tìm kiếm đã lưu thuộc về người dùng khác.
    it('raises NotFound when saved search belongs to another user', async () => {
      repository.findByIdAndUserId.mockResolvedValueOnce(null);

      await expect(service.getSavedSearchDetail(20, 1)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadSavedSearchException.
    it('throws FailedToLoadSavedSearchException on database error', async () => {
      repository.findByIdAndUserId.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db read failure', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(service.getSavedSearchDetail(10, 1)).rejects.toThrow(
        FailedToLoadSavedSearchException(),
      );
    });
  });

  describe('UF-102 createSavedSearch', () => {
    // UF-102: Tạo tìm kiếm đã lưu mới với tên và tiêu chí hợp lệ.
    it('creates a new saved search successfully', async () => {
      const payload = {
        name: 'Fullstack React Jobs',
        searchParams: { keyword: 'react', sort: 'newest' },
      };

      const result = await service.createSavedSearch(10, payload);

      expect(repository.countByUserId).toHaveBeenCalledWith(10);
      expect(repository.create).toHaveBeenCalledWith(10, payload);
      expect(result).toEqual(mockSavedSearch);
    });

    // Chấp nhận tên có độ dài tối thiểu 1 ký tự (biên dưới).
    it('accepts name of exactly 1 character', async () => {
      const payload = {
        name: 'A',
        searchParams: {},
      };

      await service.createSavedSearch(10, payload);

      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    // Chấp nhận tên có độ dài tối đa 100 ký tự (biên trên).
    it('accepts name of exactly 100 characters', async () => {
      const payload = {
        name: 'A'.repeat(100),
        searchParams: {},
      };

      await service.createSavedSearch(10, payload);

      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    // Từ chối tên rỗng trong kiểm tra schema validation.
    it('rejects empty name in schema validation', () => {
      const parsed = CreateSavedSearchBodySchema.safeParse({
        name: '',
        searchParams: {},
      });

      expect(parsed.success).toBe(false);
    });

    // Từ chối tên vượt quá 100 ký tự trong kiểm tra schema validation.
    it('rejects name exceeding 100 characters in schema validation', () => {
      const parsed = CreateSavedSearchBodySchema.safeParse({
        name: 'A'.repeat(101),
        searchParams: {},
      });

      expect(parsed.success).toBe(false);
    });

    // Báo lỗi vượt quá giới hạn khi người dùng đã đạt tối đa 30 tìm kiếm đã lưu.
    it('throws SavedSearchLimitExceededException when user reaches 30 searches', async () => {
      repository.countByUserId.mockResolvedValueOnce(
        MAX_SAVED_SEARCHES_PER_USER,
      );

      await expect(
        service.createSavedSearch(10, {
          name: 'Extra Search',
          searchParams: {},
        }),
      ).rejects.toThrow(SavedSearchLimitExceededException());
      expect(repository.create).not.toHaveBeenCalled();
    });

    // Cho phép tạo thành công khi người dùng hiện có 29 tìm kiếm đã lưu (biên dưới cận trên).
    it('allows creation when user currently has 29 saved searches', async () => {
      repository.countByUserId.mockResolvedValueOnce(
        MAX_SAVED_SEARCHES_PER_USER - 1,
      );

      await service.createSavedSearch(10, {
        name: '30th Search',
        searchParams: {},
      });

      expect(repository.create).toHaveBeenCalledWith(10, {
        name: '30th Search',
        searchParams: {},
      });
    });

    // Lưu trữ chính xác đối tượng searchParams chứa nhiều bộ lọc.
    it('stores complex searchParams filters correctly', async () => {
      const payload = {
        name: 'DevOps & Cloud Search',
        searchParams: {
          keyword: 'Kubernetes AWS',
          budgetMin: 2000,
          budgetMax: 5000,
          jobType: 'FIXED_PRICE',
        },
      };

      await service.createSavedSearch(10, payload);

      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToCreateSavedSearchException.
    it('throws FailedToCreateSavedSearchException on database error', async () => {
      repository.create.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db insert failure', {
          code: 'P2002',
          clientVersion: '1',
        }),
      );

      await expect(
        service.createSavedSearch(10, {
          name: 'Failing Search',
          searchParams: {},
        }),
      ).rejects.toThrow(FailedToCreateSavedSearchException());
    });
  });

  describe('UF-103 updateSavedSearch', () => {
    // UF-103: Cập nhật đồng thời tên và tiêu chí tìm kiếm thành công.
    it('updates both name and searchParams successfully', async () => {
      const updatePayload = {
        name: 'Updated React Fullstack',
        searchParams: { keyword: 'nextjs', budget: 1000 },
      };

      const result = await service.updateSavedSearch(10, 1, updatePayload);

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
      expect(result).toEqual(mockSavedSearch);
    });

    // Cập nhật chỉ riêng tên tìm kiếm đã lưu.
    it('updates only name of saved search successfully', async () => {
      const updatePayload = { name: 'Renamed Search' };

      await service.updateSavedSearch(10, 1, updatePayload);

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
    });

    // Cập nhật chỉ riêng đối tượng searchParams.
    it('updates only searchParams successfully', async () => {
      const updatePayload = { searchParams: { keyword: 'vuejs' } };

      await service.updateSavedSearch(10, 1, updatePayload);

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
    });

    // Báo lỗi NotFound khi bản ghi cần cập nhật không tồn tại hoặc không thuộc sở hữu.
    it('raises NotFound when saved search does not exist or not owned', async () => {
      repository.update.mockResolvedValueOnce(null);

      await expect(
        service.updateSavedSearch(10, 999, { name: 'New Title' }),
      ).rejects.toThrow(SavedSearchNotFoundException());
    });

    // Chấp nhận tên mới có độ dài 1 ký tự (biên dưới).
    it('accepts updated name of 1 character', async () => {
      const updatePayload = { name: 'Z' };

      await service.updateSavedSearch(10, 1, updatePayload);

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
    });

    // Chấp nhận tên mới có độ dài 100 ký tự (biên trên).
    it('accepts updated name of 100 characters', async () => {
      const updatePayload = { name: 'B'.repeat(100) };

      await service.updateSavedSearch(10, 1, updatePayload);

      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
    });

    // Từ chối tên cập nhật rỗng trong kiểm tra schema.
    it('rejects empty name in update schema validation', () => {
      const parsed = UpdateSavedSearchBodySchema.safeParse({ name: '' });

      expect(parsed.success).toBe(false);
    });

    // Từ chối tên cập nhật vượt quá 100 ký tự trong kiểm tra schema.
    it('rejects name exceeding 100 characters in update schema validation', () => {
      const parsed = UpdateSavedSearchBodySchema.safeParse({
        name: 'C'.repeat(101),
      });

      expect(parsed.success).toBe(false);
    });

    // Báo lỗi NotFound khi bản ghi cần cập nhật thuộc về người dùng khác.
    it('raises NotFound when updating search owned by another user', async () => {
      repository.update.mockResolvedValueOnce(null);

      await expect(
        service.updateSavedSearch(20, 1, { name: 'Hacked Name' }),
      ).rejects.toThrow(SavedSearchNotFoundException());
    });
  });

  describe('UF-104 deleteSavedSearch', () => {
    // UF-104: Xóa tìm kiếm đã lưu thành công khi bản ghi tồn tại và thuộc sở hữu.
    it('deletes saved search successfully', async () => {
      await expect(service.deleteSavedSearch(10, 1)).resolves.toBeUndefined();

      expect(repository.delete).toHaveBeenCalledWith(1, 10);
    });

    // Báo lỗi NotFound khi ID bản ghi không tồn tại trong hệ thống.
    it('raises NotFound when deleting non-existent saved search', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(service.deleteSavedSearch(10, 999)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    // Báo lỗi NotFound khi bản ghi thuộc sở hữu của người dùng khác.
    it('raises NotFound when deleting saved search owned by another user', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(service.deleteSavedSearch(20, 1)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    // Báo lỗi NotFound khi thực hiện xóa lại bản ghi đã bị xóa trước đó.
    it('raises NotFound when deleting already deleted saved search', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(service.deleteSavedSearch(10, 1)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    // Xử lý lỗi cơ sở dữ liệu khi gọi repository.delete.
    it('propagates database error when repository delete throws', async () => {
      repository.delete.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('delete constraint error', {
          code: 'P2003',
          clientVersion: '1',
        }),
      );

      await expect(service.deleteSavedSearch(10, 1)).rejects.toThrow(
        'delete constraint error',
      );
    });
  });
});
