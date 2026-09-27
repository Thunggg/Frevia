import { Injectable } from '@nestjs/common';
import { ForumCategoryType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

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
}
