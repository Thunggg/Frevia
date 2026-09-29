import { Injectable } from '@nestjs/common';
import { RoleDetailResponseType, RoleListItemType } from '@shared/types';
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
}
