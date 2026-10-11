import { Injectable } from '@nestjs/common';
import {
  CreateRoleBodyType,
  CreateRoleResponseType,
  PermissionListItemType,
  RoleDetailResponseType,
  RoleListItemType,
  UpdateRoleBodyType,
  UpdateRoleResponseType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { RoleNotFoundException } from './roles.error';

const roleListSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
} as const;

const permissionSelect = {
  id: true,
  name: true,
  path: true,
  method: true,
  module: true,
  createdAt: true,
} as const;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleListItemType[]> {
    return this.prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      select: roleListSelect,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findById(id: number): Promise<RoleDetailResponseType> {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        ...roleListSelect,
        rolePermissions: {
          where: {
            permission: {
              deletedAt: null,
            },
          },
          select: {
            permission: {
              select: permissionSelect,
            },
          },
        },
      },
    });

    if (!role) {
      throw RoleNotFoundException();
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map(
        (item) => item.permission as PermissionListItemType,
      ),
    };
  }

  async findActiveByName(
    name: string,
    excludeId?: number,
  ): Promise<RoleListItemType | null> {
    return this.prisma.role.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: roleListSelect,
    });
  }

  async createRole(body: CreateRoleBodyType): Promise<CreateRoleResponseType> {
    return this.prisma.role.create({
      data: {
        name: body.name,
        description: body.description ?? null,
      },
      select: roleListSelect,
    });
  }

  async updateRole(
    id: number,
    body: UpdateRoleBodyType,
  ): Promise<UpdateRoleResponseType> {
    return this.prisma.role.update({
      where: { id, deletedAt: null },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
      },
      select: roleListSelect,
    });
  }

  async softDeleteRole(id: number): Promise<void> {
    await this.prisma.role.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countAssignedUsers(roleId: number): Promise<number> {
    return this.prisma.userRole.count({
      where: { roleId },
    });
  }

  async findActivePermissionIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: { id: true },
    });

    return permissions.map((item) => item.id);
  }

  async replaceRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      ...(permissionIds.length > 0
        ? [
            this.prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }
}
