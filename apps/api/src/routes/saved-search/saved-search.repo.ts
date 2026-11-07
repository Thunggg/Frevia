import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateSavedSearchBodyType,
  GetSavedSearchesQueryType,
  SavedSearchType,
  UpdateSavedSearchBodyType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const savedSearchSelect = {
  id: true,
  userId: true,
  name: true,
  searchParams: true,
  createdAt: true,
} satisfies Prisma.SavedSearchSelect;

@Injectable()
export class SavedSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(
    userId: number,
    query?: GetSavedSearchesQueryType,
  ): Promise<SavedSearchType[]> {
    const where: Prisma.SavedSearchWhereInput = { userId };
    if (query?.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }
    const orderBy: Prisma.SavedSearchOrderByWithRelationInput = {
      createdAt: query?.order === 'asc' ? 'asc' : 'desc',
    };

    return this.prisma.savedSearch.findMany({
      where,
      select: savedSearchSelect,
      orderBy,
    }) as Promise<SavedSearchType[]>;
  }

  async countByUserId(userId: number): Promise<number> {
    return this.prisma.savedSearch.count({
      where: { userId },
    });
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<SavedSearchType | null> {
    return this.prisma.savedSearch.findFirst({
      where: { id, userId },
      select: savedSearchSelect,
    }) as Promise<SavedSearchType | null>;
  }

  async create(
    userId: number,
    data: CreateSavedSearchBodyType,
  ): Promise<SavedSearchType> {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: data.name,
        searchParams: data.searchParams as Prisma.InputJsonValue,
      },
      select: savedSearchSelect,
    }) as Promise<SavedSearchType>;
  }

  async update(
    id: number,
    userId: number,
    data: UpdateSavedSearchBodyType,
  ): Promise<SavedSearchType | null> {
    const updateData: Prisma.SavedSearchUpdateInput = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.searchParams !== undefined) {
      updateData.searchParams = data.searchParams as Prisma.InputJsonValue;
    }

    const result = await this.prisma.savedSearch.updateMany({
      where: { id, userId },
      data: updateData,
    });
    if (!result.count) return null;
    return this.findByIdAndUserId(id, userId);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.prisma.savedSearch.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}
