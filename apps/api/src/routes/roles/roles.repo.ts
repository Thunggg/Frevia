import { Injectable } from '@nestjs/common';
import { RoleListItemType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

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
}
