import { RoleName, type GetMeResType } from "@shared/types";

/**
 * Danh sách các Module mặc định thuộc quyền kiểm soát của trang Quản trị Admin.
 */
export const ADMIN_MODULES = new Set([
  "ADMIN",
  "EXPERT",
  "EXPERT-PROFILE",
  "USERS",
  "ROLES",
  "PERMISSIONS",
  "FORUMS-ADMIN",
  "FORUMS_ADMIN",
]);

function normalizeApiPath(path: string): string {
  const cleanTargetPath = path.trim().split("?")[0] || "";
  if (!cleanTargetPath) return "";
  return cleanTargetPath.startsWith("/api")
    ? cleanTargetPath
    : cleanTargetPath.startsWith("/")
      ? `/api${cleanTargetPath}`
      : `/api/${cleanTargetPath}`;
}

export function isMarketplaceRole(roleName?: string | null): boolean {
  return roleName === RoleName.CLIENT || roleName === RoleName.FREELANCER;
}

export function getPrimaryRoleName(
  user: GetMeResType | null | undefined,
): string | undefined {
  if (!user?.roles?.length) return undefined;
  return (
    user.roles.find((r) => r.isPrimary)?.name ?? user.roles[0]?.name
  );
}

export function isInternalAdminRole(
  user: GetMeResType | null | undefined,
): boolean {
  const roleName = getPrimaryRoleName(user);
  return Boolean(roleName && !isMarketplaceRole(roleName));
}

/**
 * Endpoint chỉ dành riêng cho Admin Portal (Client/Freelancer không bao giờ gọi).
 */
export function isStrictAdminEndpoint(path: string, method?: string): boolean {
  const cleanPath = normalizeApiPath(path);
  if (!cleanPath) return false;
  const upperMethod = method?.trim().toUpperCase();

  return (
    cleanPath === "/api/admin" ||
    cleanPath.startsWith("/api/admin/") ||
    cleanPath === "/api/expert/disputes" ||
    cleanPath.startsWith("/api/expert/disputes/") ||
    cleanPath === "/api/expert-profile" ||
    cleanPath.startsWith("/api/expert-profile/") ||
    cleanPath === "/api/forums/admin" ||
    cleanPath.startsWith("/api/forums/admin/") ||
    cleanPath === "/api/forums/reports" ||
    cleanPath.startsWith("/api/forums/reports/") ||
    cleanPath === "/api/users" ||
    cleanPath.startsWith("/api/users/") ||
    cleanPath === "/api/roles" ||
    cleanPath.startsWith("/api/roles/") ||
    cleanPath === "/api/permissions" ||
    cleanPath.startsWith("/api/permissions/") ||
    cleanPath.includes("/reindex") ||
    cleanPath.includes("/outbox") ||
    ((!upperMethod || upperMethod === "POST") &&
      (/^\/api\/payments\/disputes\/[^/]+\/settle\/?$/.test(cleanPath) ||
        cleanPath === "/api/payments/disputes/:disputeId/settle"))
  );
}

/**
 * Endpoint thuộc phạm vi quản trị động trong Admin Portal (bao gồm cả nút xóa bài/comment của Moderator).
 */
export function isAdminPermissionPath(path: string, method?: string): boolean {
  if (isStrictAdminEndpoint(path, method)) {
    return true;
  }

  const cleanPath = normalizeApiPath(path);
  const upperMethod = method?.trim().toUpperCase();
  if (!upperMethod || upperMethod === "DELETE") {
    if (
      /^\/api\/forums\/posts\/[^/]+\/?$/.test(cleanPath) ||
      /^\/api\/forums\/posts\/[^/]+\/comments\/[^/]+\/?$/.test(cleanPath)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Kiểm tra xem một permission string (dạng method + path hoặc chỉ path) có thuộc trang quản trị hay không.
 */
export function isAdministrativePermission(permission: string): boolean {
  if (!permission) return false;
  if (permission === "*") return true;

  const match = permission.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
  if (match && match[1] && match[2]) {
    return isAdminPermissionPath(match[2], match[1]);
  }

  return isAdminPermissionPath(permission);
}

export function isSelfAccountOrSessionApi(path: string): boolean {
  const cleanPath = normalizeApiPath(path);
  return (
    cleanPath === "/api/auth" ||
    cleanPath.startsWith("/api/auth/") ||
    cleanPath === "/api/account-profile" ||
    cleanPath.startsWith("/api/account-profile/") ||
    cleanPath === "/api/sessions" ||
    cleanPath.startsWith("/api/sessions/")
  );
}

/**
 * Quy tắc phân quyền hardcode cho Client & Freelancer (không dùng RBAC động ở Admin).
 */
export function isHardcodedMarketplaceAllowed(
  roleName: string,
  method: string,
  path: string,
): boolean {
  const cleanPath = normalizeApiPath(path);
  if (!cleanPath) return false;

  if (isStrictAdminEndpoint(cleanPath, method)) {
    return false;
  }

  if (
    cleanPath === "/api/expert-profile" ||
    cleanPath.startsWith("/api/expert-profile/") ||
    cleanPath === "/api/expert" ||
    cleanPath.startsWith("/api/expert/")
  ) {
    return false;
  }

  if (roleName === RoleName.CLIENT) {
    if (
      cleanPath === "/api/identity-verifications" ||
      cleanPath.startsWith("/api/identity-verifications/") ||
      cleanPath === "/api/job-alerts" ||
      cleanPath.startsWith("/api/job-alerts/") ||
      cleanPath.includes("/bookmark")
    ) {
      return false;
    }
    return true;
  }

  if (roleName === RoleName.FREELANCER) {
    if (
      cleanPath === "/api/favorites" ||
      cleanPath.startsWith("/api/favorites/") ||
      cleanPath === "/api/following" ||
      cleanPath.startsWith("/api/following/")
    ) {
      return false;
    }

    if (
      (cleanPath === "/api/manage-jobs" ||
        cleanPath.startsWith("/api/manage-jobs/")) &&
      !cleanPath.includes("/bookmark") &&
      !cleanPath.includes("/check-language")
    ) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Kiểm tra xem người dùng có quyền bước vào cổng quản trị /admin hay không.
 */
export function canAccessAdminPortal(
  user: GetMeResType | null | undefined,
): boolean {
  if (!user || user.isBanned) {
    return false;
  }

  const primaryRole = getPrimaryRoleName(user);
  if (isMarketplaceRole(primaryRole)) {
    return false;
  }

  if (user.roles?.some((r) => r.name === RoleName.ADMIN)) {
    return true;
  }

  if (user.permissions?.includes("*")) {
    return true;
  }

  const hasAdminPermission = user.permissions?.some((p) =>
    isAdministrativePermission(p),
  );
  if (hasAdminPermission) {
    return true;
  }

  const hasAdminModule = user.permissionModules?.some((mod) =>
    ADMIN_MODULES.has(mod.toUpperCase()),
  );
  if (hasAdminModule) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem user có quyền truy cập vào một mục menu hoặc một route hay không.
 */
export function hasMenuPermission(
  userPermissions: string[] = [],
  userModules: string[] = [],
  requiredPermissions?: string[],
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (userPermissions.includes("*")) {
    return true;
  }

  const normalizedModules = new Set(userModules.map((m) => m.toUpperCase()));

  return requiredPermissions.some((req) => {
    const methodMatch = req.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
    if (methodMatch && methodMatch[1] && methodMatch[2]) {
      const method = methodMatch[1].toUpperCase();
      const path = methodMatch[2].trim();
      return hasActionPermission(userPermissions, method, path);
    }

    const reqUpper = req.toUpperCase();

    if (normalizedModules.has(reqUpper)) {
      return true;
    }

    return userPermissions.some((userPerm) => {
      if (userPerm === "*") return true;

      const userPath = userPerm
        .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, "")
        .trim();

      if (userPath === req || userPath.startsWith(`${req}/`)) {
        return true;
      }

      const baseReq = req.split("/:")[0];
      const basePath = userPath.split("/:")[0];
      if (
        baseReq &&
        basePath &&
        baseReq.length > 5 &&
        (baseReq === basePath || basePath.startsWith(baseReq))
      ) {
        return true;
      }

      return false;
    });
  });
}

function matchPermissionArray(
  permissions: string[],
  method: string,
  path: string,
): boolean {
  if (permissions.includes("*")) return true;

  const targetMethod = method.trim().toUpperCase();
  const normalizedTargetPath = normalizeApiPath(path);
  const targetParts = normalizedTargetPath.split("/").filter(Boolean);

  return permissions.some((perm) => {
    if (perm === "*") return true;

    const match = perm.match(/^([A-Z]+)\s+(.+)$/i);
    if (!match || !match[1] || !match[2]) {
      return false;
    }

    const permMethod = match[1].toUpperCase();
    const permPath = match[2];

    if (permMethod !== targetMethod) {
      return false;
    }

    const normalizedPermPath = normalizeApiPath(permPath);
    const permParts = normalizedPermPath.split("/").filter(Boolean);

    if (permParts.length !== targetParts.length) {
      return false;
    }

    return permParts.every((part, idx) => {
      if (part.startsWith(":") || targetParts[idx]?.startsWith(":")) {
        const param = part.startsWith(":") ? part : targetParts[idx];
        const actual = part.startsWith(":") ? targetParts[idx] : part;
        const reservedSegments = new Set([
          "my",
          "me",
          "stats",
          "trash",
          "skills",
          "bookmarks",
          "upload-image",
          "reindex",
          "outbox",
          "skills-catalog",
          "discover",
          "suggestions",
          "portfolios",
          "cv",
          "analysis",
          "documents",
          "status",
          "ai-check",
          "liveness-pose",
          "matching-jobs",
          "slug",
        ]);
        if (
          param &&
          actual &&
          param.startsWith(":") &&
          reservedSegments.has(actual.toLowerCase())
        ) {
          return false;
        }
        return true;
      }

      return part === targetParts[idx];
    });
  });
}

/**
 * Kiểm tra quyền thực hiện một action:
 * - Client / Freelancer: áp dụng quy tắc hardcode cố định theo role.
 * - Admin / Expert / Custom role:
 *   + Self-service auth/account-profile/sessions luôn hợp lệ.
 *   + Các API nghiệp vụ ngoài Admin Portal bị từ chối.
 *   + ADMIN gốc có toàn quyền trong Admin Portal; Expert & Custom role kiểm tra động theo permissions.
 */
export function hasActionPermission(
  userOrPermissions: GetMeResType | string[] | null | undefined,
  method: string,
  path: string,
): boolean {
  if (!userOrPermissions) return false;

  if (Array.isArray(userOrPermissions)) {
    return matchPermissionArray(userOrPermissions, method, path);
  }

  if (userOrPermissions.isBanned) return false;

  const primaryRole = getPrimaryRoleName(userOrPermissions);
  const normalizedPath = normalizeApiPath(path);

  if (primaryRole === RoleName.CLIENT || primaryRole === RoleName.FREELANCER) {
    return isHardcodedMarketplaceAllowed(primaryRole, method, normalizedPath);
  }

  if (isSelfAccountOrSessionApi(normalizedPath)) {
    return true;
  }

  if (!isAdminPermissionPath(normalizedPath, method)) {
    return false;
  }

  if (primaryRole === RoleName.ADMIN) {
    return true;
  }

  return matchPermissionArray(
    userOrPermissions.permissions ?? [],
    method,
    normalizedPath,
  );
}
