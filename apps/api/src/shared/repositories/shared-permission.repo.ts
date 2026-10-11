import { Injectable } from '@nestjs/common';
import { HttpMethod } from '@prisma/client';
import { matchRoutePath } from '../helper/match-route-path';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class SharedPermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async roleHasPermission(
    roleId: number,
    method: string,
    path: string,
  ): Promise<boolean> {
    const httpMethod = method.toUpperCase() as HttpMethod;

    if (!Object.values(HttpMethod).includes(httpMethod)) {
      return false;
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        deletedAt: null,
        method: httpMethod,
        rolePermissions: {
          some: { roleId },
        },
      },
      select: { path: true },
    });

    return permissions.some((permission) =>
      matchRoutePath(permission.path, path),
    );
  }
}
