import { Injectable } from '@nestjs/common';
import { PermissionDetailResponseType, PermissionListItemType } from '@shared/types';
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
}
