import { Injectable } from '@nestjs/common';
import {
  CreatePermissionBodyType,
  CreatePermissionResponseType,
  PermissionDetailResponseType,
  PermissionListItemType,
} from '@shared/types';
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

  async findAll(): Promise<PermissionListItemType[]> {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: permissionSelect,
      orderBy: { id: 'asc' },
    });
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

  async findActiveByName(
    name: string,
    excludeId?: number,
  ): Promise<PermissionListItemType | null> {
    return this.prisma.permission.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: permissionSelect,
    });
  }

  async createPermission(
    body: CreatePermissionBodyType,
    createdById: number,
  ): Promise<CreatePermissionResponseType> {
    return this.prisma.permission.create({
      data: {
        name: body.name,
        path: body.path,
        method: body.method,
        module: body.module ?? '',
        createdById,
      },
      select: permissionSelect,
    });
  }
}
