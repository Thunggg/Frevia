import { HttpMethod, Prisma } from '@prisma/client';
import { RoleName } from '@shared/types';

function normalizePath(path: string): string {
  const clean = (path.trim().split('?')[0] || '').replace(/\/+$/, '');
  if (!clean) return '';
  return clean.startsWith('/api')
    ? clean
    : clean.startsWith('/')
      ? `/api${clean}`
      : `/api/${clean}`;
}

/**
 * Prisma filter matching ONLY Admin Portal permissions so non-admin (Homepage/Client/Freelancer)
 * permissions are excluded from Admin Roles & Permissions management.
 */
export const ADMIN_PERMISSION_PRISMA_WHERE: Prisma.PermissionWhereInput = {
  OR: [
    { path: { startsWith: '/api/admin' } },
    { path: { startsWith: '/api/expert/disputes' } },
    { path: { startsWith: '/api/expert-profile' } },
    { path: { startsWith: '/api/forums/admin' } },
    { path: { equals: '/api/forums/reports' } },
    { path: { startsWith: '/api/forums/reports/' } },
    {
      AND: [
        { method: HttpMethod.DELETE },
        { path: { equals: '/api/forums/posts/:postId' } },
      ],
    },
    {
      AND: [
        { method: HttpMethod.DELETE },
        { path: { equals: '/api/forums/posts/:postId/comments/:commentId' } },
      ],
    },
    { path: { startsWith: '/api/users' } },
    { path: { startsWith: '/api/roles' } },
    { path: { startsWith: '/api/permissions' } },
    { path: { contains: '/reindex' } },
    { path: { contains: '/outbox' } },
    {
      AND: [
        { method: HttpMethod.POST },
        { path: { startsWith: '/api/payments/disputes/' } },
        { path: { endsWith: '/settle' } },
      ],
    },
  ],
};

/**
 * Endpoints strictly exclusive to the Admin Portal (never accessible by Client/Freelancer).
 */
export function isStrictAdminEndpoint(path: string, method?: string): boolean {
  const normalized = normalizePath(path);
  if (!normalized) return false;

  const upperMethod = method?.trim().toUpperCase();

  return (
    normalized === '/api/admin' ||
    normalized.startsWith('/api/admin/') ||
    normalized === '/api/expert/disputes' ||
    normalized.startsWith('/api/expert/disputes/') ||
    normalized === '/api/expert-profile' ||
    normalized.startsWith('/api/expert-profile/') ||
    normalized === '/api/forums/admin' ||
    normalized.startsWith('/api/forums/admin/') ||
    normalized === '/api/forums/reports' ||
    normalized.startsWith('/api/forums/reports/') ||
    normalized === '/api/users' ||
    normalized.startsWith('/api/users/') ||
    normalized === '/api/roles' ||
    normalized.startsWith('/api/roles/') ||
    normalized === '/api/permissions' ||
    normalized.startsWith('/api/permissions/') ||
    normalized.includes('/reindex') ||
    normalized.includes('/outbox') ||
    ((!upperMethod || upperMethod === 'POST') &&
      /^\/api\/payments\/disputes\/[^/]+\/settle\/?$/.test(normalized))
  );
}

/**
 * Checks whether an endpoint/permission belongs to the dynamic Admin RBAC catalog.
 * Includes strict admin endpoints plus shared forum delete endpoints used by Admin moderation.
 */
export function isAdminPermissionPath(path: string, method?: string): boolean {
  if (isStrictAdminEndpoint(path, method)) {
    return true;
  }

  const normalized = normalizePath(path);
  const upperMethod = method?.trim().toUpperCase();
  if (!upperMethod || upperMethod === 'DELETE') {
    if (
      /^\/api\/forums\/posts\/[^/]+\/?$/.test(normalized) ||
      /^\/api\/forums\/posts\/[^/]+\/comments\/[^/]+\/?$/.test(normalized)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Self-service auth, account profile (password/avatar), and session endpoints
 * available to all authenticated roles without dynamic permission toggles.
 * Note: `/api/auth/switch-role` and `/api/auth/join-role` are strictly restricted
 * to marketplace roles (Client & Freelancer) and excluded here.
 */
export function isSelfAccountOrSessionPath(path: string): boolean {
  const normalized = normalizePath(path);
  if (
    normalized === '/api/auth/switch-role' ||
    normalized === '/api/auth/join-role'
  ) {
    return false;
  }

  return (
    normalized === '/api/auth' ||
    normalized.startsWith('/api/auth/') ||
    normalized === '/api/account-profile' ||
    normalized.startsWith('/api/account-profile/') ||
    normalized === '/api/sessions' ||
    normalized.startsWith('/api/sessions/')
  );
}

/**
 * Hardcoded API access rules for marketplace roles (Client & Freelancer).
 * Marketplace permissions are fixed in code instead of dynamically configurable in Admin RBAC.
 */
export function isHardcodedMarketplaceAllowed(
  roleName: string,
  method: string,
  path: string,
): boolean {
  const normalized = normalizePath(path);
  if (!normalized) return false;

  if (isStrictAdminEndpoint(normalized, method)) {
    return false;
  }

  if (
    normalized === '/api/expert-profile' ||
    normalized.startsWith('/api/expert-profile/') ||
    normalized === '/api/expert' ||
    normalized.startsWith('/api/expert/')
  ) {
    return false;
  }

  if (roleName === RoleName.CLIENT) {
    if (
      normalized === '/api/job-alerts' ||
      normalized.startsWith('/api/job-alerts/') ||
      normalized.includes('/bookmark')
    ) {
      return false;
    }
    return true;
  }

  if (roleName === RoleName.FREELANCER) {
    if (
      normalized === '/api/favorites' ||
      normalized.startsWith('/api/favorites/') ||
      normalized === '/api/following' ||
      normalized.startsWith('/api/following/')
    ) {
      return false;
    }

    if (
      (normalized === '/api/manage-jobs' ||
        normalized.startsWith('/api/manage-jobs/')) &&
      !normalized.includes('/bookmark') &&
      !normalized.includes('/check-language')
    ) {
      return false;
    }

    return true;
  }

  return false;
}
