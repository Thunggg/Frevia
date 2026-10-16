import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BannerAdminDeleteResponseType,
  BannerAdminDetailResponseType,
  BannerAdminListResponseType,
  BannerAdminQueryType,
  BannerCreateBodyType,
  BannerUpdateBodyType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  BannerAdminNotFoundException,
  BannerPositionTakenException,
} from './banners-admin.error';

const bannerListSelect = {
  id: true,
  title: true,
  imageUrl: true,
  linkUrl: true,
  position: true,
  startDate: true,
  endDate: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class BannersAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách banner: phân trang + tìm kiếm (title) + lọc vị trí + lọc soft-deleted + sort
  async listBanners(
    query: BannerAdminQueryType,
  ): Promise<BannerAdminListResponseType> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search?.trim();
    const showDeleted =
      query.deleted === 'true'
        ? true
        : query.deleted === 'false'
          ? false
          : undefined;

    const sortBy = query.sortBy ?? 'id';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.AdvertisementBannerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const where: Prisma.AdvertisementBannerWhereInput = {
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.position ? { position: query.position } : {}),
      ...(showDeleted !== undefined
        ? { deletedAt: showDeleted ? { not: null } : null }
        : {}),
    };

    const [banners, total] = await this.prisma.$transaction([
      this.prisma.advertisementBanner.findMany({
        where,
        select: bannerListSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.advertisementBanner.count({ where }),
    ]);

    return {
      banners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Chi tiết 1 banner
  async getBannerDetail(
    id: number,
  ): Promise<BannerAdminDetailResponseType | null> {
    return this.prisma.advertisementBanner.findUnique({
      where: { id },
      select: bannerListSelect,
    });
  }

  // Tạo banner mới (mỗi position chỉ được 1 banner active)
  async createBanner(
    data: BannerCreateBodyType,
  ): Promise<BannerAdminDetailResponseType> {
    const position = data.position ?? 'GLOBAL_HEADER';

    const existing = await this.prisma.advertisementBanner.findFirst({
      where: { position, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      throw BannerPositionTakenException();
    }

    return this.prisma.advertisementBanner.create({
      data: {
        title: data.title.trim(),
        imageUrl: data.imageUrl ?? null,
        linkUrl: data.linkUrl ?? null,
        position,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isActive: data.isActive ?? true,
      },
      select: bannerListSelect,
    });
  }

  // Cập nhật banner (nếu đổi position, kiểm tra position mới chưa bị chiếm bởi banner active khác)
  async updateBanner(
    id: number,
    data: BannerUpdateBodyType,
  ): Promise<BannerAdminDetailResponseType> {
    const banner = await this.prisma.advertisementBanner.findFirst({
      where: { id },
      select: { id: true, position: true },
    });

    if (!banner) {
      throw BannerAdminNotFoundException();
    }

    const newPosition = data.position ?? banner.position;

    if (data.position !== undefined && data.position !== banner.position) {
      const existing = await this.prisma.advertisementBanner.findFirst({
        where: { position: newPosition, deletedAt: null, id: { not: id } },
        select: { id: true },
      });

      if (existing) {
        throw BannerPositionTakenException();
      }
    }

    return this.prisma.advertisementBanner.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: bannerListSelect,
    });
  }

  // Xóa banner (soft delete: set deletedAt)
  async deleteBanner(id: number): Promise<BannerAdminDeleteResponseType> {
    const banner = await this.prisma.advertisementBanner.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!banner) {
      throw BannerAdminNotFoundException();
    }

    await this.prisma.advertisementBanner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Banner deleted successfully' };
  }

  // Khôi phục banner đã soft-delete (chỉ những banner đang bị xóa mới restore được)
  async restoreBanner(id: number): Promise<BannerAdminDetailResponseType> {
    const result = await this.prisma.advertisementBanner.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      throw BannerAdminNotFoundException();
    }

    const updated = await this.prisma.advertisementBanner.findUnique({
      where: { id },
      select: bannerListSelect,
    });

    if (!updated) {
      throw BannerAdminNotFoundException();
    }

    return updated;
  }
}
