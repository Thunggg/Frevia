// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

/**
 * ForumService - Xử lý business logic cho module Forum
 * Chứa các method tương tác với database thông qua PrismaService
 */
@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * UC-04.1: View Forum Categories
   * Lấy danh sách tất cả các category đang active
   * @returns Danh sách forum categories
   */
  async getForumCategories() {
    // Lấy các category đang active và chưa bị xóa
    const categories = await this.prisma.forumCategory.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc', // Sắp xếp theo tên tăng dần
      },
    });

    return { data: categories };
  }
}
