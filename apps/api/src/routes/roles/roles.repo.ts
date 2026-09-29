import { Injectable } from '@nestjs/common';
import {
  CreateRoleBodyType,
  CreateRoleResponseType,
  RoleDetailResponseType,
  RoleListItemType,
  UpdateRoleBodyType,
  UpdateRoleResponseType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { RoleNotFoundException } from './roles.error';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleListItemType[]> {
    return this.prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
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
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    if (!role) {
      throw RoleNotFoundException();
    }

    return role;
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
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });
  }

  async createRole(body: CreateRoleBodyType): Promise<CreateRoleResponseType> {
    return this.prisma.role.create({
      data: {
        name: body.name,
        description: body.description ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });
  }

  async updateRole(
    id: number,
    body: UpdateRoleBodyType,
  ): Promise<UpdateRoleResponseType> {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });
  }
}
