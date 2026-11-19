import { isAdminPermissionPath } from "./admin-access";

export type PermissionScope = "ALL" | "ADMIN";

export interface ScopeDefinition {
  key: PermissionScope;
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  descriptionEn: string;
  badgeClass: string;
  dotColor: string;
}

export const SCOPE_DEFINITIONS: Record<
  Exclude<PermissionScope, "ALL">,
  ScopeDefinition
> = {
  ADMIN: {
    key: "ADMIN",
    labelVi: "Dashboard Quản trị",
    labelEn: "Admin Dashboard",
    descriptionVi: "Chỉ các chức năng thuộc cổng quản trị Admin Portal",
    descriptionEn: "Administrative features within Admin Portal only",
    badgeClass:
      "bg-[#0069D3]/10 text-[#0069D3] border-[#0069D3]/25 dark:bg-[#0069D3]/20 dark:text-blue-300 dark:border-blue-800",
    dotColor: "bg-[#0069D3]",
  },
};

export interface FeatureGroupDefinition {
  key: string;
  code: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  scope: Exclude<PermissionScope, "ALL">;
  order: number;
}

export const FEATURE_GROUPS = {
  ADMIN_KYC: {
    key: "ADMIN_KYC",
    code: "KYC (ADMIN)",
    titleVi: "Duyệt xác minh danh tính",
    titleEn: "Identity Verification (Admin)",
    descriptionVi:
      "Xem tài liệu căn cước công dân, phê duyệt hoặc từ chối yêu cầu KYC",
    descriptionEn:
      "Review ID documents, approve or reject identity verification requests",
    scope: "ADMIN",
    order: 10,
  },
  ADMIN_SKILLS: {
    key: "ADMIN_SKILLS",
    code: "SKILLS (ADMIN)",
    titleVi: "Quản lý kỹ năng",
    titleEn: "Skills Management (Admin)",
    descriptionVi:
      "Xem danh mục, tạo mới, cập nhật, xóa và khôi phục kỹ năng hệ thống",
    descriptionEn:
      "View, create, update, delete, and restore system skills catalog",
    scope: "ADMIN",
    order: 20,
  },
  ADMIN_JOB_CATEGORIES: {
    key: "ADMIN_JOB_CATEGORIES",
    code: "JOB CATEGORIES (ADMIN)",
    titleVi: "Danh mục việc làm",
    titleEn: "Job Categories (Admin)",
    descriptionVi:
      "Quản lý danh mục ngành nghề việc làm, chỉnh sửa, xóa và khôi phục",
    descriptionEn: "Manage job industry categories, edit, delete, and restore",
    scope: "ADMIN",
    order: 30,
  },
  ADMIN_BANNERS: {
    key: "ADMIN_BANNERS",
    code: "BANNERS (ADMIN)",
    titleVi: "Banner & Quảng cáo",
    titleEn: "Banners & Ads (Admin)",
    descriptionVi:
      "Quản lý banner hiển thị trang chủ, tải lên hình ảnh quảng cáo",
    descriptionEn: "Manage homepage banners, upload promotional images",
    scope: "ADMIN",
    order: 40,
  },
  ADMIN_DISPUTES: {
    key: "ADMIN_DISPUTES",
    code: "DISPUTES (ADMIN)",
    titleVi: "Phán quyết tranh chấp",
    titleEn: "Disputes Arbitration (Admin)",
    descriptionVi:
      "Xem chi tiết tranh chấp hợp đồng, đưa ra phán quyết và tất toán ký quỹ",
    descriptionEn:
      "Review contract disputes, issue binding decisions, and settle escrow",
    scope: "ADMIN",
    order: 50,
  },
  ADMIN_PROFILE_REVISIONS: {
    key: "ADMIN_PROFILE_REVISIONS",
    code: "PROFILE REVISIONS (ADMIN)",
    titleVi: "Duyệt thay đổi hồ sơ",
    titleEn: "Profile Revisions Review (Admin)",
    descriptionVi:
      "Xem xét, phê duyệt hoặc từ chối yêu cầu cập nhật hồ sơ",
    descriptionEn: "Review, approve, or reject profile update revisions",
    scope: "ADMIN",
    order: 60,
  },
  ADMIN_FORUMS: {
    key: "ADMIN_FORUMS",
    code: "FORUM MODERATION (ADMIN)",
    titleVi: "Kiểm duyệt diễn đàn",
    titleEn: "Forum Moderation (Admin)",
    descriptionVi:
      "Quản lý chuyên mục diễn đàn, duyệt bài, xóa nội dung vi phạm, xử lý báo cáo và thùng rác",
    descriptionEn:
      "Manage forum categories, approve posts, remove violating content, handle reports, and trash bin",
    scope: "ADMIN",
    order: 70,
  },
  ADMIN_USERS: {
    key: "ADMIN_USERS",
    code: "USERS (ADMIN)",
    titleVi: "Quản lý người dùng",
    titleEn: "User Management (Admin)",
    descriptionVi:
      "Xem danh sách tài khoản, tạo/khóa tài khoản, cập nhật hồ sơ người dùng",
    descriptionEn:
      "View user accounts, create/lock users, and update profile data",
    scope: "ADMIN",
    order: 80,
  },
  ADMIN_ROLES: {
    key: "ADMIN_ROLES",
    code: "ROLES (ADMIN)",
    titleVi: "Quản lý vai trò",
    titleEn: "Role Management (Admin)",
    descriptionVi:
      "Tạo, cập nhật vai trò quản trị và gán quyền hạn động trong Admin",
    descriptionEn:
      "Create, update administrative roles, and assign dynamic Admin permissions",
    scope: "ADMIN",
    order: 90,
  },
  ADMIN_PERMISSIONS: {
    key: "ADMIN_PERMISSIONS",
    code: "PERMISSIONS (ADMIN)",
    titleVi: "Quyền hệ thống",
    titleEn: "System Permissions (Admin)",
    descriptionVi: "Xem danh mục và chi tiết các quyền API thuộc Admin Portal",
    descriptionEn: "View Admin Portal API permissions catalog and endpoint details",
    scope: "ADMIN",
    order: 100,
  },
  ADMIN_AI_OPS: {
    key: "ADMIN_AI_OPS",
    code: "AI INDEXING (ADMIN)",
    titleVi: "Vận hành gợi ý AI",
    titleEn: "AI Indexing & Ops (Admin)",
    descriptionVi:
      "Đánh lại chỉ mục tìm kiếm và xử lý hàng đợi sự kiện gợi ý AI",
    descriptionEn:
      "Reindex search vector stores and process AI recommendation outbox",
    scope: "ADMIN",
    order: 110,
  },
} satisfies Record<string, FeatureGroupDefinition>;

/**
 * Kiểm tra một permission từ API có thuộc danh mục quyền Admin Portal gán động hay không.
 */
export function isAssignableAdminPermission(permission: {
  path: string;
  method?: string;
}): boolean {
  return isAdminPermissionPath(permission.path, permission.method);
}

/**
 * Phân loại chính xác một quyền Admin vào Cụm chức năng (Feature Group).
 */
export function getPermissionFeatureGroup(permission: {
  path: string;
  method?: string;
  module?: string | null;
}): FeatureGroupDefinition {
  const path = permission.path || "";
  const method = (permission.method || "").toUpperCase();
  const mod = (permission.module || "").toUpperCase();

  if (path.startsWith("/api/admin/identity-verifications")) {
    return FEATURE_GROUPS.ADMIN_KYC;
  }
  if (path.startsWith("/api/admin/skills")) {
    return FEATURE_GROUPS.ADMIN_SKILLS;
  }
  if (path.startsWith("/api/admin/job-categories")) {
    return FEATURE_GROUPS.ADMIN_JOB_CATEGORIES;
  }
  if (path.startsWith("/api/admin/banners")) {
    return FEATURE_GROUPS.ADMIN_BANNERS;
  }
  if (
    path.startsWith("/api/admin/disputes") ||
    path.startsWith("/api/expert/disputes") ||
    path.startsWith("/api/expert-profile") ||
    (path.startsWith("/api/payments/disputes/") && path.endsWith("/settle"))
  ) {
    return FEATURE_GROUPS.ADMIN_DISPUTES;
  }
  if (path.startsWith("/api/admin/profile-revisions")) {
    return FEATURE_GROUPS.ADMIN_PROFILE_REVISIONS;
  }
  if (
    path.startsWith("/api/forums/admin") ||
    path === "/api/forums/reports" ||
    path.startsWith("/api/forums/reports/") ||
    ((!method || method === "DELETE") &&
      (path === "/api/forums/posts/:postId" ||
        path === "/api/forums/posts/:postId/comments/:commentId"))
  ) {
    return FEATURE_GROUPS.ADMIN_FORUMS;
  }
  if (path.startsWith("/api/users") || mod === "USERS") {
    return FEATURE_GROUPS.ADMIN_USERS;
  }
  if (path.startsWith("/api/roles") || mod === "ROLES") {
    return FEATURE_GROUPS.ADMIN_ROLES;
  }
  if (path.startsWith("/api/permissions") || mod === "PERMISSIONS") {
    return FEATURE_GROUPS.ADMIN_PERMISSIONS;
  }
  if (path.includes("/reindex") || path.includes("/outbox")) {
    return FEATURE_GROUPS.ADMIN_AI_OPS;
  }

  return {
    key: mod || "ADMIN",
    code: mod || "ADMIN",
    titleVi: mod || "Chức năng quản trị",
    titleEn: mod || "Admin Features",
    descriptionVi: "Các quyền API thuộc cổng quản trị Admin",
    descriptionEn: "Admin Portal API permissions",
    scope: "ADMIN",
    order: 999,
  };
}

export function getPermissionScope(permission: {
  path: string;
  method?: string;
  module?: string | null;
}): Exclude<PermissionScope, "ALL"> {
  return getPermissionFeatureGroup(permission).scope;
}

export function getAllFeatureGroups(
  scope?: PermissionScope,
): FeatureGroupDefinition[] {
  const all = Object.values(FEATURE_GROUPS).sort((a, b) => a.order - b.order);
  if (!scope || scope === "ALL") {
    return all;
  }
  return all.filter((g) => g.scope === scope);
}
