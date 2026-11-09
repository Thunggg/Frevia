import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BannerAdminQueryType } from '@shared/types';
import {
  BannerAdminNotFoundException,
  BannerPositionTakenException,
} from '../../src/routes/banners-admin/banners-admin.error';
import { BannersAdminRepository } from '../../src/routes/banners-admin/banners-admin.repo';
import { BannersAdminService } from '../../src/routes/banners-admin/banners-admin.service';
import { CloudinaryService } from '../../src/shared/services/cloudinary.service';

describe('Banners Management (UF-68 to UF-72)', () => {
  const repository = {
    listBanners: jest.fn(),
    getBannerDetail: jest.fn(),
    createBanner: jest.fn(),
    updateBanner: jest.fn(),
    deleteBanner: jest.fn(),
  };

  const service = new BannersAdminService(
    repository as unknown as BannersAdminRepository,
    {} as unknown as CloudinaryService,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const headerBanner = {
    id: 1,
    title: 'Summer Sale',
    imageUrl: 'https://cdn.frevia.com/banners/summer.png',
    linkUrl: 'https://frevia.com/summer',
    position: 'GLOBAL_HEADER' as const,
    startDate: null,
    endDate: null,
    isActive: true,
    createdAt,
    updatedAt,
  };

  const defaultQuery: BannerAdminQueryType = {
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'desc',
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-68 listBanners', () => {
    // UF-68: Trả về danh sách banner kèm phân trang với tham số mặc định.
    it('returns the banner list with default pagination', async () => {
      const response = {
        banners: [headerBanner],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.listBanners.mockResolvedValue(response);

      const result = await service.listBanners(defaultQuery);

      expect(result).toEqual(response);
      expect(repository.listBanners).toHaveBeenCalledWith(defaultQuery);
    });

    // Tham số phân trang tùy chỉnh (trang 2, 5 bản ghi) được chuyển nguyên vẹn xuống repository.
    it('forwards custom pagination parameters to the repository', async () => {
      const query: BannerAdminQueryType = {
        ...defaultQuery,
        page: 2,
        limit: 5,
      };
      repository.listBanners.mockResolvedValue({
        banners: [],
        pagination: { page: 2, limit: 5, total: 6, totalPages: 2 },
      });

      await service.listBanners(query);

      expect(repository.listBanners).toHaveBeenCalledWith(query);
    });

    // Từ khóa tìm kiếm theo tiêu đề được chuyển nguyên vẹn xuống repository.
    it('forwards the title search keyword to the repository', async () => {
      const query: BannerAdminQueryType = { ...defaultQuery, search: 'Summer' };
      repository.listBanners.mockResolvedValue({
        banners: [headerBanner],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await service.listBanners(query);

      expect(repository.listBanners).toHaveBeenCalledWith(query);
      expect(result.banners[0]?.title).toBe('Summer Sale');
    });

    // Bộ lọc vị trí GLOBAL_HEADER được chuyển nguyên vẹn xuống repository.
    it('forwards the position filter to the repository', async () => {
      const query: BannerAdminQueryType = {
        ...defaultQuery,
        position: 'GLOBAL_HEADER',
      };
      repository.listBanners.mockResolvedValue({
        banners: [headerBanner],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.listBanners(query);

      expect(repository.listBanners).toHaveBeenCalledWith(query);
    });

    // Giới hạn tối đa 100 bản ghi mỗi trang được chuyển nguyên vẹn xuống repository.
    it('forwards the maximum page size of 100 to the repository', async () => {
      const query: BannerAdminQueryType = { ...defaultQuery, limit: 100 };
      repository.listBanners.mockResolvedValue({
        banners: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
      });

      const result = await service.listBanners(query);

      expect(result.pagination.limit).toBe(100);
    });

    // Lỗi kết nối cơ sở dữ liệu được chuyển thành FailedToLoadBannerListException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.listBanners.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.listBanners(defaultQuery)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-69 getBannerDetail', () => {
    // UF-69: Trả về chi tiết banner khi ID tồn tại.
    it('returns the banner detail when the ID exists', async () => {
      repository.getBannerDetail.mockResolvedValue(headerBanner);

      const result = await service.getBannerDetail(1);

      expect(result).toEqual(headerBanner);
      expect(repository.getBannerDetail).toHaveBeenCalledWith(1);
    });

    // Repository trả về null thì service ném NotFoundException.
    it('throws NotFoundException when the banner does not exist', async () => {
      repository.getBannerDetail.mockResolvedValue(null);

      await expect(service.getBannerDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID biên không hợp lệ (0) cũng trả về NotFoundException.
    it('throws NotFoundException when the banner ID is zero', async () => {
      repository.getBannerDetail.mockResolvedValue(null);

      await expect(service.getBannerDetail(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi kết nối cơ sở dữ liệu được chuyển thành FailedToLoadBannerDetailException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.getBannerDetail.mockRejectedValue(
        new Error('Connection error'),
      );

      await expect(service.getBannerDetail(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-70 createBanner', () => {
    // UF-70: Tạo banner mới với đầy đủ tiêu đề, ảnh, liên kết, vị trí và thời gian.
    it('creates a banner when all fields are valid', async () => {
      const body = {
        title: 'Summer Sale',
        imageUrl: 'https://cdn.frevia.com/banners/summer.png',
        linkUrl: 'https://frevia.com/summer',
        position: 'HOME_HERO' as const,
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T00:00:00.000Z'),
        isActive: true,
      };
      repository.createBanner.mockResolvedValue({ ...headerBanner, ...body });

      const result = await service.createBanner(body);

      expect(result.position).toBe('HOME_HERO');
      expect(repository.createBanner).toHaveBeenCalledWith(body);
    });

    // Vị trí đã có banner đang hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the position is already occupied', async () => {
      repository.createBanner.mockRejectedValue(BannerPositionTakenException());

      await expect(
        service.createBanner({
          title: 'Another',
          position: 'GLOBAL_HEADER',
          isActive: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Tạo banner chỉ với các trường bắt buộc và vị trí mặc định.
    it('creates a banner with only the required fields and the default position', async () => {
      repository.createBanner.mockResolvedValue({
        ...headerBanner,
        imageUrl: null,
        linkUrl: null,
      });

      const result = await service.createBanner({
        title: 'Minimal',
        position: 'GLOBAL_HEADER',
        isActive: true,
      });

      expect(result.position).toBe('GLOBAL_HEADER');
    });

    // Tiêu đề chỉ có một ký tự (giá trị biên nhỏ nhất) vẫn tạo được banner.
    it('creates a banner when the title has a single character', async () => {
      repository.createBanner.mockResolvedValue({
        ...headerBanner,
        title: 'A',
      });

      const result = await service.createBanner({
        title: 'A',
        position: 'FOOTER',
        isActive: true,
      });

      expect(result.title).toBe('A');
    });

    // Lỗi ghi cơ sở dữ liệu được chuyển thành FailedToCreateBannerException (500).
    it('throws InternalServerErrorException when the database insert fails', async () => {
      repository.createBanner.mockRejectedValue(new Error('Insert failure'));

      await expect(
        service.createBanner({
          title: 'Broken',
          position: 'FOOTER',
          isActive: true,
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-71 updateBanner', () => {
    // UF-71: Cập nhật tiêu đề và liên kết của banner đang tồn tại.
    it('updates the banner title and link URL', async () => {
      repository.updateBanner.mockResolvedValue({
        ...headerBanner,
        title: 'Winter Sale',
        linkUrl: 'https://frevia.com/winter',
      });

      const result = await service.updateBanner(1, {
        title: 'Winter Sale',
        linkUrl: 'https://frevia.com/winter',
      });

      expect(result.title).toBe('Winter Sale');
      expect(repository.updateBanner).toHaveBeenCalledWith(1, {
        title: 'Winter Sale',
        linkUrl: 'https://frevia.com/winter',
      });
    });

    // Đổi sang vị trí còn trống thành công.
    it('moves the banner to an unoccupied position', async () => {
      repository.updateBanner.mockResolvedValue({
        ...headerBanner,
        position: 'FOOTER',
      });

      const result = await service.updateBanner(1, { position: 'FOOTER' });

      expect(result.position).toBe('FOOTER');
    });

    // Đổi sang vị trí đã có banner khác bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the target position is already taken', async () => {
      repository.updateBanner.mockRejectedValue(BannerPositionTakenException());

      await expect(
        service.updateBanner(1, { position: 'HOME_HERO' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // ID banner không tồn tại trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the banner ID does not exist', async () => {
      repository.updateBanner.mockRejectedValue(BannerAdminNotFoundException());

      await expect(
        service.updateBanner(999999, { title: 'Ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi cập nhật cơ sở dữ liệu được chuyển thành FailedToUpdateBannerException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.updateBanner.mockRejectedValue(new Error('Update failure'));

      await expect(
        service.updateBanner(1, { title: 'Broken' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-72 deleteBanner', () => {
    // UF-72: Xóa cứng banner đang tồn tại và trả về thông báo xóa thành công.
    it('deletes an existing banner and returns the confirmation message', async () => {
      repository.deleteBanner.mockResolvedValue({
        message: 'Banner deleted successfully',
      });

      const result = await service.deleteBanner(1);

      expect(result).toEqual({ message: 'Banner deleted successfully' });
      expect(repository.deleteBanner).toHaveBeenCalledWith(1);
    });

    // ID banner không tồn tại làm repository lỗi và service trả về FailedToDeleteBannerException (500).
    it('throws InternalServerErrorException when the banner ID does not exist', async () => {
      repository.deleteBanner.mockRejectedValue(new Error('Record not found'));

      await expect(service.deleteBanner(999999)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    // Lỗi xóa trong cơ sở dữ liệu được chuyển thành FailedToDeleteBannerException (500).
    it('throws InternalServerErrorException when the database delete fails', async () => {
      repository.deleteBanner.mockRejectedValue(new Error('Delete failure'));

      await expect(service.deleteBanner(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
