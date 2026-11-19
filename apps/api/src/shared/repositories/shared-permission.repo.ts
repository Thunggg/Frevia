import { Injectable, Optional } from '@nestjs/common';
import { HttpMethod } from '@prisma/client';
import { matchRoutePath } from '../helper/match-route-path';
import { CacheService } from '../services/cache.service';
import { PrismaService } from '../services/prisma.service';

export const ROLE_PERMISSIONS_CACHE_PREFIX = 'rbac:role-perms:';
const ROLE_PERMISSIONS_CACHE_TTL_SECONDS = 60;

@Injectable()
export class SharedPermissionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  async roleHasPermission(
    roleId: number,
    method: string,
    path: string,
  ): Promise<boolean> {
    const httpMethod = method.toUpperCase() as HttpMethod;

    if (!Object.values(HttpMethod).includes(httpMethod)) {
      return false;
    }

    const loadPaths = async (): Promise<string[]> => {
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
      return permissions.map((permission) => permission.path);
    };

    const paths = this.cacheService
      ? await this.cacheService.wrap(
          `${ROLE_PERMISSIONS_CACHE_PREFIX}${roleId}:${httpMethod}`,
          loadPaths,
          ROLE_PERMISSIONS_CACHE_TTL_SECONDS,
        )
      : await loadPaths();

    return paths.some((permissionPath) => matchRoutePath(permissionPath, path));
  }
}
