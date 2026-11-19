import { NestFactory } from '@nestjs/core';
import { PrismaPg } from '@prisma/adapter-pg';
import { HttpMethod, PrismaClient } from '@prisma/client';
import { RoleName, getPermissionName } from '@shared/types';
import 'dotenv/config';
import { AppModule } from '../app.module';
import { IS_PUBLIC_KEY } from '../shared/decorators/auth.decorator';
import { isAdminPermissionPath } from '../shared/helper/admin-permission';

if (!process.env.DIRECT_URL) {
  console.log('Cannot find DB URL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
});

/**
 * Chi luu va phan quyen dong cho cac endpoint thuoc pham vi Admin Portal.
 * Quyen cua CLIENT / FREELANCER / Homepage duoc hardcode theo role.
 */
const expertDefaultRoutes = new Set([
  'GET /api/admin/disputes',
  'GET /api/admin/disputes/:id',
  'POST /api/admin/disputes/:id/decision',
  'POST /api/admin/disputes/:id/final-decision',
]);

type AvailableRoute = {
  path: string;
  method: HttpMethod;
  name: string;
  module: string;
};

async function updateRolePermissions(
  permissionIds: number[],
  roleName: string,
) {
  const role = await prisma.role.findFirst({
    where: { name: roleName, deletedAt: null },
  });

  if (!role) {
    console.log(`Role not found: ${roleName}`);
    return;
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: role.id },
  });

  if (permissionIds.length === 0) {
    console.log(`Updated role ${roleName}: 0 permissions (hardcoded)`);
    return;
  }

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    })),
    skipDuplicates: true,
  });

  console.log(`Updated role ${roleName}: ${permissionIds.length} permissions`);
}

function resolveModule(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const moduleSegment =
    segments[0]?.toLowerCase() === 'api' ? segments[1] : segments[0];

  return String(moduleSegment ?? 'APP')
    .toUpperCase()
    .replace(/:/g, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.init();

  const server = app.getHttpAdapter().getInstance();
  const router = server.router;

  const permissionInDB = await prisma.permission.findMany({
    where: { deletedAt: null },
  });

  const availableRoutes: AvailableRoute[] = router.stack
    .map(
      (layer: {
        route?: {
          path: string;
          stack: { method: string; handle?: unknown }[];
        };
      }) => {
        if (!layer.route) return undefined;

        const path = layer.route.path as string;
        const method = String(
          layer.route.stack[0]?.method ?? '',
        ).toUpperCase() as HttpMethod;

        if (!Object.values(HttpMethod).includes(method)) return undefined;

        const isPublic = layer.route.stack.some((s) =>
          Boolean(
            s?.handle &&
              Reflect.getMetadata(IS_PUBLIC_KEY, s.handle as object),
          ),
        );
        if (isPublic) return undefined;

        // Chi seed cac permission thuoc Admin Portal de quan tri va gan quyen dong.
        if (!isAdminPermissionPath(path, method)) return undefined;

        return {
          path,
          method,
          name: getPermissionName(method, path, 'en'),
          module: resolveModule(path),
        };
      },
    )
    .filter((item: AvailableRoute | undefined): item is AvailableRoute =>
      Boolean(item),
    );

  console.log(
    `Discovered ${availableRoutes.length} Admin Portal routes from Nest router`,
  );

  let changed = false;

  const permissionInDBMap = permissionInDB.reduce<
    Record<string, (typeof permissionInDB)[number]>
  >((acc, item) => {
    acc[`${item.method}-${item.path}`] = item;
    return acc;
  }, {});

  const availableRoutesMap = availableRoutes.reduce<
    Record<string, AvailableRoute>
  >((acc, item) => {
    acc[`${item.method}-${item.path}`] = item;
    return acc;
  }, {});

  // Permission cu khong con thuoc Admin Portal hoac da bi xoa route -> don sach khoi DB.
  const permissionToDelete = permissionInDB.filter(
    (item) => !availableRoutesMap[`${item.method}-${item.path}`],
  );

  if (permissionToDelete.length > 0) {
    changed = true;
    const idsToDelete = permissionToDelete.map((item) => item.id);
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: idsToDelete } },
    });
    const deleted = await prisma.permission.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log('Deleted non-admin/stale permissions:', deleted.count);
  }

  const permissionToCreate = availableRoutes.filter(
    (item) => !permissionInDBMap[`${item.method}-${item.path}`],
  );

  if (permissionToCreate.length > 0) {
    changed = true;
    const created = await prisma.permission.createMany({
      data: permissionToCreate,
      skipDuplicates: true,
    });
    console.log('Created admin permissions:', created.count);
    for (const route of permissionToCreate) {
      console.log(`  + ${route.name} [${route.module}]`);
    }
  }

  const permissionToUpdate = availableRoutes.filter((route) => {
    const existing = permissionInDBMap[`${route.method}-${route.path}`];
    if (!existing) return false;
    return existing.name !== route.name || existing.module !== route.module;
  });

  if (permissionToUpdate.length > 0) {
    changed = true;
    for (const route of permissionToUpdate) {
      await prisma.permission.updateMany({
        where: {
          method: route.method,
          path: route.path,
          deletedAt: null,
        },
        data: {
          name: route.name,
          module: route.module,
        },
      });
      console.log(`  ~ ${route.name} [${route.module}]`);
    }
    console.log('Updated permissions:', permissionToUpdate.length);
  }

  if (!changed) {
    console.log('No permission records need creating, updating, or deleting.');
  }

  const updatedPermissionInDb = await prisma.permission.findMany({
    where: { deletedAt: null },
  });

  const adminPermissionIds = updatedPermissionInDb.map((item) => item.id);
  const expertPermissionIds = updatedPermissionInDb
    .filter((item) => expertDefaultRoutes.has(`${item.method} ${item.path}`))
    .map((item) => item.id);

  await Promise.all([
    updateRolePermissions(adminPermissionIds, RoleName.ADMIN),
    updateRolePermissions([], RoleName.FREELANCER),
    updateRolePermissions([], RoleName.CLIENT),
    updateRolePermissions(expertPermissionIds, RoleName.EXPERT),
  ]);

  await app.close();
}

bootstrap()
  .catch((error) => {
    console.error('Seed permissions failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
