import { Injectable } from '@nestjs/common';
import {
  PermissionDetailResponseType,
  PermissionFilterType,
  PermissionListItemType,
} from '@shared/types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionNotFoundException } from './permissions.error';

const permissionSelect = {
  id: true,
  name: true,
  path: true,
  method: true,
  module: true,
  createdAt: true,
} as const;

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: PermissionFilterType): Promise<{
    permissions: PermissionListItemType[];
    total: number;
    modules: string[];
  }> {
    const { page, limit, search, method, module, sortBy, order } = filter;

    const where: Prisma.PermissionWhereInput = {
      deletedAt: null,
      ...(method && { method }),
      ...(module && {
        module: { equals: module, mode: Prisma.QueryMode.insensitive },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { path: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { module: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [permissions, total, moduleRows] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        select: permissionSelect,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where: { deletedAt: null, module: { not: null } },
        select: { module: true },
        distinct: ['module'],
        orderBy: { module: 'asc' },
      }),
    ]);

    return {
      permissions,
      total,
      modules: moduleRows
        .map((row) => row.module)
        .filter((value): value is string => Boolean(value)),
    };
  }

  async findById(id: number): Promise<PermissionDetailResponseType> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
      select: permissionSelect,
    });

    if (!permission) {
      throw PermissionNotFoundException();
    }

    return permission;
  }
}
