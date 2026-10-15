import { Injectable } from '@nestjs/common';
import { AdvertisementBanner, BannerPosition } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy các banner active (chưa soft-delete) hợp lệ theo vị trí hiển thị
  async findActiveByPosition(
    position: BannerPosition,
  ): Promise<AdvertisementBanner[]> {
    const now = new Date();

    return this.prisma.advertisementBanner.findMany({
      where: {
        position,
        isActive: true,
        deletedAt: null,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { id: 'desc' },
    });
  }
}
