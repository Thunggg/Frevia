import { RoleName, type GetMeResType } from "@shared/types";

/**
 * Danh sách các Module mặc định thuộc quyền kiểm soát của trang Quản trị Admin.
 */
export const ADMIN_MODULES = new Set([
  "ADMIN",
  "USERS",
  "ROLES",
  "PERMISSIONS",
  "CATEGORIES",
  "COMMENTS",
  "MODERATION",
  "REPORTS",
  "POSTS",
  "TRASH",
  "DISPUTES",
  "PROFILE-REVISIONS",
]);

/**
 * Kiểm tra xem một permission string (dạng method + path hoặc chỉ path) có thuộc trang quản trị hay không.
 */
export function isAdministrativePermission(permission: string): boolean {
  if (!permission) return false;
  if (permission === "*") return true;

  // Tách method nếu có: "GET /api/users" -> "/api/users"
  const cleanPath = permission.replace(
    /^(GET|POST|PUT|PATCH|DELETE)\s+/i,
    "",
  ).trim();

  return (
    cleanPath.startsWith("/api/admin") ||
    cleanPath.startsWith("/api/forums/admin") ||
    cleanPath.startsWith("/api/users") ||
    cleanPath.startsWith("/api/roles") ||
    cleanPath.startsWith("/api/permissions") ||
    cleanPath.startsWith("/api/disputes") ||
    cleanPath.includes("/reindex") ||
    cleanPath.includes("/outbox")
  );
}

/**
 * Kiểm tra xem người dùng có quyền bước vào cổng quản trị /admin hay không.
 *
 * Tiêu chí:
 * 1. Role ADMIN luôn được phép vào.
 * 2. Bất kỳ role nào (CSKH, Expert, Support...) chỉ cần sở hữu ít nhất 1 quyền thuộc trang quản trị
 *    là tự động được phép vào mà không cần sửa code.
 * 3. Client, Freelancer thuần túy (không có quyền quản trị) sẽ bị chặn.
 */
export function canAccessAdminPortal(
  user: GetMeResType | null | undefined,
): boolean {
  if (!user || user.isBanned) {
    return false;
  }

  // 1. Role ADMIN
  if (user.roles?.some((r) => r.name === RoleName.ADMIN)) {
    return true;
  }

  // 2. Wildcard permission
  if (user.permissions?.includes("*")) {
    return true;
  }

  // 3. Có ít nhất 1 permission thuộc phạm vi quản trị
  const hasAdminPermission = user.permissions?.some((p) =>
    isAdministrativePermission(p),
  );
  if (hasAdminPermission) {
    return true;
  }

  // 4. Có ít nhất 1 module thuộc admin modules
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
 *
 * @param userPermissions Danh sách permissions của user (từ getMe)
 * @param userModules Danh sách module của user (từ getMe)
 * @param requiredPermissions Danh sách quyền/module mà menu yêu cầu (chỉ cần match 1)
 */
export function hasMenuPermission(
  userPermissions: string[] = [],
  userModules: string[] = [],
  requiredPermissions?: string[],
): boolean {
  // Mục menu không yêu cầu quyền đặc biệt (dùng chung cho ai vào được admin, vd: Dashboard)
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Admin hoặc tài khoản có wildcard '*' được thấy toàn bộ menu
  if (userPermissions.includes("*")) {
    return true;
  }

  const normalizedModules = new Set(
    userModules.map((m) => m.toUpperCase()),
  );

  return requiredPermissions.some((req) => {
    const reqUpper = req.toUpperCase();

    // 1. Khớp theo Module name (vd: 'USERS', 'DISPUTES', 'ROLES')
    if (normalizedModules.has(reqUpper)) {
      return true;
    }

    // 2. Khớp theo Path / Route pattern
    return userPermissions.some((userPerm) => {
      if (userPerm === "*") return true;

      const userPath = userPerm
        .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, "")
        .trim();

      // Khớp chính xác hoặc khớp tiền tố route
      if (userPath === req || userPath.startsWith(`${req}/`) || req.startsWith(`${userPath}/`)) {
        return true;
      }

      // Khớp route có tham số dạng :id
      const baseReq = req.split("/:")[0];
      const basePath = userPath.split("/:")[0];
      if (baseReq && basePath && (baseReq === basePath || baseReq.startsWith(basePath))) {
        return true;
      }

      return false;
    });
  });
}

