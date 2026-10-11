import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateSavedSearchBodyType,
  SavedSearchType,
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

  async findAllByUserId(userId: number): Promise<SavedSearchType[]> {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      select: savedSearchSelect,
      orderBy: { createdAt: 'desc' },
    }) as Promise<SavedSearchType[]>;
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
}
