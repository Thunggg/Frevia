import { NestFactory } from '@nestjs/core';
import { PrismaPg } from '@prisma/adapter-pg';
import { HttpMethod, PrismaClient } from '@prisma/client';
import { RoleName } from '@shared/types';
import 'dotenv/config';
import { AppModule } from '../app.module';

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
 * Module gán theo role (Admin nhận tất cả).
 *
 * Profile / account surfaces:
 * - PROFILES: freelancer profile + skills + portfolios (`/api/profiles/...`)
 * - CLIENTS: client company profile (`/api/clients/...`)
 * - IDENTITY-VERIFICATIONS: freelancer KYC docs
 * - SOCIAL-LINKS: both roles
 * - FAVORITES: client saved freelancers (`/api/favorites/freelancers`)
 *
 * Cross-read: CLIENT cũng có PROFILES, FREELANCER cũng có CLIENTS
 * (GET public vẫn bypass guard; module đủ cho các thao tác auth-required).
 */
const freelancerModules = [
  'AUTH',
  'SESSIONS',
  'JOBS',
  'SAVED-SEARCHES',
  'MANAGE-JOBS',
  'PROPOSALS',
  'CONTRACTS',
  'CONVERSATIONS',
  'FORUMS',
  'PROFILES',
  'CLIENTS',
  'IDENTITY-VERIFICATIONS',
  'SOCIAL-LINKS',
  'NOTIFICATIONS',
];

const clientModules = [
  'AUTH',
  'SESSIONS',
  'JOBS',
  'SAVED-SEARCHES',
  'MANAGE-JOBS',
  'CONTRACTS',
  'CONVERSATIONS',
  'FORUMS',
  'CLIENTS',
  'PROFILES',
  'SOCIAL-LINKS',
  'FAVORITES',
  'FOLLOWING',
  'NOTIFICATIONS',
];

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

  if (permissionIds.length === 0) return;

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
  // Bỏ global prefix `api` khi lấy module (vd /api/roles → ROLES)
  const moduleSegment =
    segments[0]?.toLowerCase() === 'api' ? segments[1] : segments[0];

  return String(moduleSegment ?? 'APP')
    .toUpperCase()
    .replace(/:/g, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  // Phải khớp main.ts — không có prefix thì seed ra /permissions,
  // trong khi request thật tế là /api/permissions → PermissionGuard 403.
  app.setGlobalPrefix('api');
  await app.init();

  const server = app.getHttpAdapter().getInstance();
  const router = server.router;

  const permissionInDB = await prisma.permission.findMany({
    where: { deletedAt: null },
  });

  const availableRoutes: AvailableRoute[] = router.stack
    .map((layer: { route?: { path: string; stack: { method: string }[] } }) => {
      if (!layer.route) return undefined;

      const path = layer.route.path as string;
      const method = String(
        layer.route.stack[0]?.method ?? '',
      ).toUpperCase() as HttpMethod;

      if (!Object.values(HttpMethod).includes(method)) return undefined;

      return {
        path,
        method,
        name: `${method} ${path}`,
        module: resolveModule(path),
      };
    })
    .filter((item: AvailableRoute | undefined): item is AvailableRoute =>
      Boolean(item),
    );

  console.log(`Discovered ${availableRoutes.length} routes from Nest router`);

  const profileRelated = availableRoutes.filter((route) =>
    [
      'PROFILES',
      'CLIENTS',
      'IDENTITY-VERIFICATIONS',
      'SOCIAL-LINKS',
      'FAVORITES',
      'FOLLOWING',
      'NOTIFICATIONS',
    ].includes(route.module),
  );
  console.log(
    `Profile-related routes (${profileRelated.length}):`,
    profileRelated.map((route) => route.name).sort(),
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

  // Permission trong DB không còn route → xóa
  const permissionToDelete = permissionInDB.filter(
    (item) => !availableRoutesMap[`${item.method}-${item.path}`],
  );

  if (permissionToDelete.length > 0) {
    changed = true;
    const deleted = await prisma.permission.deleteMany({
      where: { id: { in: permissionToDelete.map((item) => item.id) } },
    });
    console.log('Deleted permissions:', deleted.count);
  }

  // Route mới chưa có trong DB → tạo
  const permissionToCreate = availableRoutes.filter(
    (item) => !permissionInDBMap[`${item.method}-${item.path}`],
  );

  if (permissionToCreate.length > 0) {
    changed = true;
    const created = await prisma.permission.createMany({
      data: permissionToCreate,
      skipDuplicates: true,
    });
    console.log('Created permissions:', created.count);
    for (const route of permissionToCreate) {
      console.log(`  + ${route.name} [${route.module}]`);
    }
  }

  // Permission đã có nhưng name/module lệch → cập nhật
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

  const freelancerPermissionIds = updatedPermissionInDb
    .filter(
      (item) =>
        freelancerModules.includes(item.module ?? '') &&
        !(item.path ?? '').startsWith('/api/admin/'),
    )
    .map((item) => item.id);

  const clientPermissionIds = updatedPermissionInDb
    .filter(
      (item) =>
        clientModules.includes(item.module ?? '') &&
        !(item.path ?? '').startsWith('/api/admin/'),
    )
    .map((item) => item.id);

  const freelancerProfileCount = updatedPermissionInDb.filter(
    (item) =>
      freelancerModules.includes(item.module ?? '') &&
      [
        'PROFILES',
        'CLIENTS',
        'IDENTITY-VERIFICATIONS',
        'SOCIAL-LINKS',
      ].includes(item.module ?? ''),
  ).length;

  const clientProfileCount = updatedPermissionInDb.filter(
    (item) =>
      clientModules.includes(item.module ?? '') &&
      ['PROFILES', 'CLIENTS', 'SOCIAL-LINKS', 'FAVORITES'].includes(
        item.module ?? '',
      ),
  ).length;

  console.log(
    `Freelancer profile-related permissions: ${freelancerProfileCount}`,
  );
  console.log(`Client profile-related permissions: ${clientProfileCount}`);

  await Promise.all([
    updateRolePermissions(adminPermissionIds, RoleName.ADMIN),
    updateRolePermissions(freelancerPermissionIds, RoleName.FREELANCER),
    updateRolePermissions(clientPermissionIds, RoleName.CLIENT),
  ]);

  await app.close();
}

bootstrap()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
