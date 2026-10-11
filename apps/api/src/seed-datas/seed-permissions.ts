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

/** Module gán cho Freelancer / Client (Admin nhận tất cả). */
const freelancerModules = [
  'AUTH',
  'SESSIONS',
  'JOBS',
  'MANAGE-JOBS',
  'CONTRACTS',
  'CONVERSATIONS',
  'FORUMS',
  'PROFILES',
  'IDENTITY-VERIFICATIONS',
  'SOCIAL-LINKS',
];
const clientModules = [
  'AUTH',
  'SESSIONS',
  'JOBS',
  'MANAGE-JOBS',
  'CONTRACTS',
  'CONVERSATIONS',
  'FORUMS',
  'CLIENTS',
  'SOCIAL-LINKS',
  'FAVORITES',
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

      const segments = path.split('/').filter(Boolean);
      // Bỏ global prefix `api` khi lấy module (vd /api/roles → ROLE/ROLES)
      const moduleSegment =
        segments[0]?.toLowerCase() === 'api' ? segments[1] : segments[0];
      const moduleName = String(moduleSegment ?? 'APP')
        .toUpperCase()
        .replace(/:/g, '');

      return {
        path,
        method,
        name: `${method} ${path}`,
        module: moduleName,
      };
    })
    .filter((item: AvailableRoute | undefined): item is AvailableRoute =>
      Boolean(item),
    );

  console.log(`Discovered ${availableRoutes.length} routes from Nest router`);

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
  }

  if (!changed) {
    console.log('No records need updating or deleting.');
  }

  const updatedPermissionInDb = await prisma.permission.findMany({
    where: { deletedAt: null },
  });

  const adminPermissionIds = updatedPermissionInDb.map((item) => item.id);

  const freelancerPermissionIds = updatedPermissionInDb
    .filter((item) => freelancerModules.includes(item.module ?? ''))
    .map((item) => item.id);

  const clientPermissionIds = updatedPermissionInDb
    .filter((item) => clientModules.includes(item.module ?? ''))
    .map((item) => item.id);

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
