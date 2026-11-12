import { RoleName, type GetMeResType } from "@shared/types";

/**
 * Danh sách các Module mặc định thuộc quyền kiểm soát của trang Quản trị Admin.
 */
export const ADMIN_MODULES = new Set([
  "ADMIN",
  "USERS",
  "ROLES",
  "PERMISSIONS",
  "FORUMS-ADMIN",
  "FORUMS_ADMIN",
]);

/**
 * Kiểm tra xem một permission string (dạng method + path hoặc chỉ path) có thuộc trang quản trị hay không.
 */
export function isAdministrativePermission(permission: string): boolean {
  if (!permission) return false;
  if (permission === "*") return true;

  // Tách method nếu có: "GET /api/users" -> "/api/users"
  const cleanPath = permission
    .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, "")
    .trim();

  return (
    cleanPath.startsWith("/api/admin") ||
    cleanPath.startsWith("/api/forums/admin") ||
    cleanPath.startsWith("/api/users") ||
    cleanPath.startsWith("/api/roles") ||
    cleanPath.startsWith("/api/permissions") ||
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

  const normalizedModules = new Set(userModules.map((m) => m.toUpperCase()));

  return requiredPermissions.some((req) => {
    // 1. Nếu req có chỉ định method (vd: "GET /api/forums/reports")
    const methodMatch = req.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
    if (methodMatch && methodMatch[1] && methodMatch[2]) {
      const method = methodMatch[1].toUpperCase();
      const path = methodMatch[2].trim();
      return hasActionPermission(userPermissions, method, path);
    }

    const reqUpper = req.toUpperCase();

    // 2. Khớp theo Module name (vd: 'USERS', 'ROLES')
    if (normalizedModules.has(reqUpper)) {
      return true;
    }

    // 3. Khớp theo Path / Route pattern
    return userPermissions.some((userPerm) => {
      if (userPerm === "*") return true;

      const userPath = userPerm
        .replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, "")
        .trim();

      // Khớp chính xác hoặc khớp tiền tố route con
      if (userPath === req || userPath.startsWith(`${req}/`)) {
        return true;
      }

      // Khớp route có tham số dạng :id
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

/**
 * Kiểm tra xem người dùng có quyền thực hiện một action (API endpoint) hay không.
 *
 * Hàm hỗ trợ hai kiểu dữ liệu đầu vào:
 * - GetMeResType: Đối tượng thông tin người dùng, bao gồm roles và permissions.
 * - string[]: Danh sách permissions trực tiếp.
 *
 * Quy tắc kiểm tra quyền:
 * 1. Người dùng không tồn tại thì từ chối quyền truy cập.
 * 2. Người dùng có role ADMIN thì được phép thực hiện mọi action.
 * 3. Người dùng có permission "*" thì được phép thực hiện mọi action.
 * 4. Permission phải khớp với HTTP method (nếu permission có khai báo method).
 * 5. API path phải khớp với permission path.
 * 6. Các tham số động trên URL (ví dụ :id, :userId) được xem là khớp với mọi giá trị tương ứng.
 *
 * @param userOrPermissions - Thông tin người dùng hoặc danh sách permissions.
 * @param method - HTTP method của API cần kiểm tra (GET, POST, PUT, PATCH, DELETE...).
 * @param path - Đường dẫn API cần kiểm tra.
 *
 * @returns true nếu người dùng có quyền thực hiện action, ngược lại trả về false.
 *
 * @example
 * hasActionPermission(user, "POST", "/admin/skills");
 * hasActionPermission(["POST /api/admin/skills"], "POST", "/admin/skills");
 * hasActionPermission(["*"], "DELETE", "/users/123");
 */
export function hasActionPermission(
  userOrPermissions: GetMeResType | string[] | null | undefined,
  method: string,
  path: string,
): boolean {
  // Không có thông tin người dùng hoặc danh sách quyền thì mặc định từ chối truy cập.
  if (!userOrPermissions) return false;

  // Khởi tạo danh sách quyền của người dùng.
  let permissions: string[] = [];

  // Kiểm tra đầu vào có phải là danh sách permissions trực tiếp hay không.
  if (Array.isArray(userOrPermissions)) {
    // Nếu đầu vào là mảng, sử dụng trực tiếp danh sách permissions được cung cấp.
    permissions = userOrPermissions;
  } else {
    // Lấy danh sách permissions của người dùng.
    // Nếu permissions không tồn tại hoặc null thì sử dụng mảng rỗng.
    permissions = userOrPermissions.permissions ?? [];
  }

  // Kiểm tra quyền wildcard (*).
  // Nếu người dùng có permission "*" thì được phép thực hiện mọi action.
  if (permissions.includes("*")) return true;

  // Chuẩn hóa HTTP method:
  // - Loại bỏ khoảng trắng ở đầu và cuối.
  // - Chuyển toàn bộ ký tự thành chữ in hoa.
  // Ví dụ: " post " -> "POST".
  const targetMethod = method.trim().toUpperCase();

  // Làm sạch API path cần kiểm tra:
  // - Loại bỏ khoảng trắng ở đầu và cuối.
  // - Loại bỏ query string bắt đầu từ dấu "?".
  // Ví dụ: "/admin/skills?page=1" -> "/admin/skills".
  const cleanTargetPath = path.trim().split("?")[0] || "";

  // Chuẩn hóa đường dẫn API:
  // - Nếu đã bắt đầu bằng "/api" thì giữ nguyên.
  // - Nếu bắt đầu bằng "/" thì thêm tiền tố "/api".
  // - Nếu không bắt đầu bằng "/" thì thêm "/api/".
  //
  // Ví dụ:
  // "/api/admin/skills" -> "/api/admin/skills"
  // "/admin/skills"     -> "/api/admin/skills"
  // "admin/skills"      -> "/api/admin/skills".
  const normalizedTargetPath = cleanTargetPath.startsWith("/api")
    ? cleanTargetPath
    : cleanTargetPath.startsWith("/")
      ? `/api${cleanTargetPath}`
      : `/api/${cleanTargetPath}`;

  // Tách đường dẫn thành từng phần để so sánh.
  // filter(Boolean) giúp loại bỏ các phần tử rỗng do dấu "/" tạo ra.
  //
  // Ví dụ:
  // "/api/admin/skills" -> ["api", "admin", "skills"].
  const targetParts = normalizedTargetPath.split("/").filter(Boolean);

  // Duyệt qua từng permission để tìm quyền phù hợp với action cần kiểm tra.
  return permissions.some((perm) => {
    // Nếu permission hiện tại là "*" thì cho phép thực hiện action.
    if (perm === "*") return true;

    // Phân tách HTTP method và API path từ permission.
    //
    // Ví dụ:
    // "POST /api/admin/skills"
    // -> match[1] = "POST"
    // -> match[2] = "/api/admin/skills"
    const match = perm.match(/^([A-Z]+)\s+(.+)$/i);
    // Action permission bắt buộc phải có HTTP method cụ thể (POST, GET, PATCH, DELETE)
    // Các chuỗi không có method (ví dụ: "/api/admin/skills") chỉ dùng cho route menu, không cấp quyền action.
    if (!match || !match[1] || !match[2]) {
      return false;
    }

    const permMethod = match[1].toUpperCase();
    const permPath = match[2];

    // Method của permission bắt buộc phải trùng với method của action đang kiểm tra.
    if (permMethod !== targetMethod) {
      return false;
    }

    // Làm sạch permission path:
    // - Loại bỏ khoảng trắng ở đầu và cuối.
    // - Loại bỏ query string nếu có.
    const cleanPermPath = permPath.trim().split("?")[0] || "";

    // Chuẩn hóa permission path theo cùng quy tắc với target path.
    // Mục đích là đảm bảo hai đường dẫn có cùng tiền tố "/api"
    // trước khi tiến hành so sánh.
    const normalizedPermPath = cleanPermPath.startsWith("/api")
      ? cleanPermPath
      : cleanPermPath.startsWith("/")
        ? `/api${cleanPermPath}`
        : `/api/${cleanPermPath}`;

    // Tách permission path thành từng phần để so sánh với target path.
    //
    // Ví dụ:
    // "/api/admin/skills/:id"
    // -> ["api", "admin", "skills", ":id"].
    const permParts = normalizedPermPath.split("/").filter(Boolean);

    // Hai đường dẫn phải có cùng số lượng thành phần.
    // Nếu số lượng khác nhau thì không thể xem là cùng một endpoint.
    //
    // Ví dụ:
    // "/api/admin/skills"    -> 3 phần
    // "/api/admin/skills/1"  -> 4 phần
    // -> Không khớp.
    if (permParts.length !== targetParts.length) {
      return false;
    }

    // So sánh từng thành phần tương ứng giữa permission path
    // và target path.
    return permParts.every((part, idx) => {
      // Nếu một trong hai thành phần là tham số động (bắt đầu bằng ":")
      // thì xem như khớp.
      //
      // Ví dụ:
      // Permission: "/api/users/:id"
      // Target:     "/api/users/123"
      // -> Khớp.
      //
      // Hoặc:
      // Permission: "/api/users/123"
      // Target:     "/api/users/:id"
      // -> Cũng được xem là khớp theo logic hiện tại.
      if (part.startsWith(":") || targetParts[idx]?.startsWith(":")) {
        return true;
      }

      // Nếu không phải tham số động thì hai thành phần
      // phải giống nhau hoàn toàn.
      return part === targetParts[idx];
    });
  });
}
