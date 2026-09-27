import { Injectable } from '@nestjs/common';
import { ForumCategoryType, ForumPostFilterType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { ForumCategoryNotFoundException } from './forums.error';

@Injectable()
export class ForumRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách tất cả forum categories đang active
  async getForumCategories(): Promise<
    // Chỉ lấy các trường id, name, description, createdAt, updatedAt
    Pick<
      ForumCategoryType,
      'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
    >[]
  > {
    return this.prisma.forumCategory.findMany({
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
        // Sắp xếp theo name tăng dần (bảng chữ cái)
        name: 'asc',
      },
    });
  }

  async getForumCategoryById(
    id: number,
  ): Promise<
    Pick<
      ForumCategoryType,
      'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
    >
  > {
    // DÙng findFirst để tìm kiếm forum category theo id và deletedAt = null (chỉ lấy các category đang active)
    const forumCategory = await this.prisma.forumCategory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!forumCategory) {
      throw ForumCategoryNotFoundException();
    }

    return forumCategory;
  }

  async getForumPostLists(filter: ForumPostFilterType) {
    // filter chứa các thông tin để lọc danh sách forum posts theo categoryId, userId, page, limit
    const { page, limit, categoryId, userId } = filter;
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      // Nếu categoryId hoặc userId được truyền vào thì thêm điều kiện lọc vào where
      ...(categoryId !== undefined && {
        categoryId,
      }),
      ...(userId !== undefined && {
        userId,
      }),
    };
    // Sử dụng transaction để thực hiện 2 truy vấn cùng lúc: lấy danh sách forum posts và đếm tổng số forum posts thỏa mãn điều kiện lọc
    // tính tổng số forum để hiển thị thông tin phân trang
    const [posts, total] = await this.prisma.$transaction([
      this.prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          categoryId: true,
          userId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.forumPost.count({
        where,
      }),
    ]);
    return {
      posts,
      total,
    };
  }
}
