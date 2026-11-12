export type PermissionScope =
  | "ALL"
  | "ADMIN"
  | "CLIENT"
  | "FREELANCER"
  | "CONTRACTS"
  | "COMMON";

export interface ScopeDefinition {
  key: PermissionScope;
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  descriptionEn: string;
  badgeClass: string;
  dotColor: string;
}

export const SCOPE_DEFINITIONS: Record<Exclude<PermissionScope, "ALL">, ScopeDefinition> = {
  ADMIN: {
    key: "ADMIN",
    labelVi: "Dashboard Quản trị",
    labelEn: "Admin Dashboard",
    descriptionVi: "Dành cho Admin, CSKH, Ban vận hành nội bộ",
    descriptionEn: "For Admin, Support, and Internal Staff",
    badgeClass:
      "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-800",
    dotColor: "bg-purple-500",
  },
  CLIENT: {
    key: "CLIENT",
    labelVi: "Khách hàng (Client)",
    labelEn: "Client Portal",
    descriptionVi: "Đăng việc, quản lý ứng viên, hồ sơ doanh nghiệp",
    descriptionEn: "Post jobs, manage applicants, company profile",
    badgeClass:
      "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  FREELANCER: {
    key: "FREELANCER",
    labelVi: "Freelancer",
    labelEn: "Freelancer Portal",
    descriptionVi: "Hồ sơ, CV AI, xác minh KYC, tìm việc làm",
    descriptionEn: "Profile, AI CV, KYC verification, find work",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  CONTRACTS: {
    key: "CONTRACTS",
    labelVi: "Hợp đồng & Thanh toán",
    labelEn: "Contracts & Payments",
    descriptionVi: "Ký kết, milestone, ký quỹ Stripe & tranh chấp",
    descriptionEn: "Agreements, milestones, Stripe escrow & disputes",
    badgeClass:
      "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  COMMON: {
    key: "COMMON",
    labelVi: "Trang chủ & Dùng chung",
    labelEn: "Homepage & Platform",
    descriptionVi: "Chat, thông báo, diễn đàn, đổi vai trò, tài khoản",
    descriptionEn: "Chat, notifications, forum, role switch, account",
    badgeClass:
      "bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-800",
    dotColor: "bg-cyan-500",
  },
};

export interface ModuleMetadata {
  defaultScope: Exclude<PermissionScope, "ALL">;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

export const MODULE_CATALOG: Record<string, ModuleMetadata> = {
  ADMIN: {
    defaultScope: "ADMIN",
    titleVi: "Quản trị hệ thống",
    titleEn: "System Administration",
    descriptionVi: "Kỹ năng, banner, danh mục, duyệt hồ sơ, phán quyết",
    descriptionEn: "Skills, banners, categories, profile reviews, arbitration",
  },
  USERS: {
    defaultScope: "ADMIN",
    titleVi: "Quản lý người dùng",
    titleEn: "User Management",
    descriptionVi: "Danh sách tài khoản, hồ sơ người dùng & kỹ năng hệ thống",
    descriptionEn: "Account list, user profiles & skills catalog",
  },
  ROLES: {
    defaultScope: "ADMIN",
    titleVi: "Vai trò & Phân quyền",
    titleEn: "Roles & Permissions",
    descriptionVi: "Tạo, cập nhật vai trò và gán quyền hạn",
    descriptionEn: "Create, update roles and assign permissions",
  },
  PERMISSIONS: {
    defaultScope: "ADMIN",
    titleVi: "Quyền hệ thống",
    titleEn: "System Permissions",
    descriptionVi: "Xem danh mục và chi tiết các quyền API",
    descriptionEn: "View API permissions catalog and details",
  },
  "PROFILE-REVISIONS": {
    defaultScope: "ADMIN",
    titleVi: "Duyệt hồ sơ Expert",
    titleEn: "Expert Profile Revisions",
    descriptionVi: "Lịch sử và trạng thái duyệt hồ sơ chuyên gia",
    descriptionEn: "Expert profile review history and status",
  },
  "MANAGE-JOBS": {
    defaultScope: "CLIENT",
    titleVi: "Đăng & Quản lý việc làm",
    titleEn: "Job Postings Management",
    descriptionVi: "Đăng tin tuyển dụng, mở/đóng tin, bookmark việc làm",
    descriptionEn: "Post jobs, open/close postings, bookmark jobs",
  },
  JOBS: {
    defaultScope: "CLIENT",
    titleVi: "Ứng viên việc làm",
    titleEn: "Job Applicants",
    descriptionVi: "Xem danh sách đề xuất nộp cho công việc",
    descriptionEn: "View candidate proposals submitted for jobs",
  },
  CLIENTS: {
    defaultScope: "CLIENT",
    titleVi: "Hồ sơ công ty Client",
    titleEn: "Client Company Profile",
    descriptionVi: "Cập nhật thông tin doanh nghiệp / khách hàng",
    descriptionEn: "Update company profile and business details",
  },
  FAVORITES: {
    defaultScope: "CLIENT",
    titleVi: "Freelancer yêu thích",
    titleEn: "Favorite Freelancers",
    descriptionVi: "Lưu trữ và quản lý danh sách freelancer yêu thích",
    descriptionEn: "Save and manage favorite freelancer list",
  },
  FOLLOWING: {
    defaultScope: "CLIENT",
    titleVi: "Đang theo dõi",
    titleEn: "Following Freelancers",
    descriptionVi: "Theo dõi và nhận gợi ý các freelancer nổi bật",
    descriptionEn: "Follow and discover prominent freelancers",
  },
  PROFILES: {
    defaultScope: "FREELANCER",
    titleVi: "Hồ sơ & Kỹ năng Freelancer",
    titleEn: "Freelancer Profile & CV",
    descriptionVi: "Hồ sơ cá nhân, kỹ năng, portfolio, phân tích CV AI",
    descriptionEn: "Profile, skills, portfolios, AI CV extraction",
  },
  "IDENTITY-VERIFICATIONS": {
    defaultScope: "FREELANCER",
    titleVi: "Xác minh danh tính (KYC)",
    titleEn: "Identity Verification (KYC)",
    descriptionVi: "Tải CCCD, kiểm tra liveness và đối chiếu khuôn mặt AI",
    descriptionEn: "Upload ID card, liveness pose & AI verification check",
  },
  "JOB-ALERTS": {
    defaultScope: "FREELANCER",
    titleVi: "Thông báo việc làm",
    titleEn: "Job Alerts",
    descriptionVi: "Nhận thông báo tự động khi có việc làm phù hợp",
    descriptionEn: "Automated alerts for matching job opportunities",
  },
  "SAVED-SEARCHES": {
    defaultScope: "FREELANCER",
    titleVi: "Tìm kiếm đã lưu",
    titleEn: "Saved Searches",
    descriptionVi: "Lưu tiêu chí tìm kiếm việc làm và dự án",
    descriptionEn: "Save search criteria for jobs and projects",
  },
  PROPOSALS: {
    defaultScope: "CONTRACTS",
    titleVi: "Đề xuất & Báo giá",
    titleEn: "Proposals & Bids",
    descriptionVi: "Freelancer nộp báo giá, Client xem xét, phỏng vấn và chấp nhận",
    descriptionEn: "Freelancer bids, Client review, interview and accept",
  },
  CONTRACTS: {
    defaultScope: "CONTRACTS",
    titleVi: "Hợp đồng & Milestone",
    titleEn: "Contracts & Milestones",
    descriptionVi: "Ký kết hợp đồng, tạo mốc công việc, nộp bài, duyệt bài & PDF",
    descriptionEn: "Sign contracts, manage milestones, submit deliverables & PDF",
  },
  PAYMENTS: {
    defaultScope: "CONTRACTS",
    titleVi: "Thanh toán & Ký quỹ",
    titleEn: "Payments & Escrow",
    descriptionVi: "Ký quỹ milestone, giải ngân, hoàn tiền, kết nối Stripe",
    descriptionEn: "Escrow milestone funds, release, refund, Stripe connect",
  },
  DISPUTES: {
    defaultScope: "CONTRACTS",
    titleVi: "Tranh chấp & Khiếu nại",
    titleEn: "Disputes & Claims",
    descriptionVi: "Mở khiếu nại, nộp chứng cứ và giải quyết tranh chấp",
    descriptionEn: "Open dispute, submit evidence and resolve claims",
  },
  "EXPERT-PROFILE": {
    defaultScope: "CONTRACTS",
    titleVi: "Hồ sơ Chuyên gia (Expert)",
    titleEn: "Expert Profile",
    descriptionVi: "Cập nhật hồ sơ chuyên gia trọng tài",
    descriptionEn: "Update arbitration expert profile details",
  },
  AUTH: {
    defaultScope: "COMMON",
    titleVi: "Xác thực & Vai trò",
    titleEn: "Authentication & Roles",
    descriptionVi: "Thông tin cá nhân, chuyển đổi vai trò, đăng ký thêm vai trò",
    descriptionEn: "Profile data, switch active role, join role",
  },
  "ACCOUNT-PROFILE": {
    defaultScope: "COMMON",
    titleVi: "Tài khoản cá nhân",
    titleEn: "Account Profile",
    descriptionVi: "Xem và cập nhật thông tin tài khoản, đổi mật khẩu, avatar",
    descriptionEn: "View and update account info, change password, avatar",
  },
  SESSIONS: {
    defaultScope: "COMMON",
    titleVi: "Phiên đăng nhập",
    titleEn: "Active Sessions",
    descriptionVi: "Quản lý thiết bị đăng nhập và đăng xuất từ xa",
    descriptionEn: "Manage logged-in devices and remote sign out",
  },
  "SOCIAL-LINKS": {
    defaultScope: "COMMON",
    titleVi: "Mạng xã hội",
    titleEn: "Social Links",
    descriptionVi: "Liên kết tài khoản mạng xã hội (GitHub, LinkedIn...)",
    descriptionEn: "Social profile links (GitHub, LinkedIn...)",
  },
  CONVERSATIONS: {
    defaultScope: "COMMON",
    titleVi: "Trò chuyện & Nhắn tin",
    titleEn: "Chat & Messaging",
    descriptionVi: "Hội thoại realtime, gửi tin nhắn, file đính kèm",
    descriptionEn: "Realtime chat, send messages, file attachments",
  },
  NOTIFICATIONS: {
    defaultScope: "COMMON",
    titleVi: "Thông báo hệ thống",
    titleEn: "Notifications",
    descriptionVi: "Xem và đánh dấu đã đọc các thông báo hoạt động",
    descriptionEn: "View and mark activity notifications as read",
  },
  REVIEWS: {
    defaultScope: "COMMON",
    titleVi: "Đánh giá & Phản hồi",
    titleEn: "Reviews & Feedback",
    descriptionVi: "Đánh giá sao cho hợp đồng và phản hồi nhận xét",
    descriptionEn: "Rate completed contracts and submit review responses",
  },
  FORUMS: {
    defaultScope: "COMMON",
    titleVi: "Diễn đàn cộng đồng",
    titleEn: "Community Forum",
    descriptionVi: "Đăng bài viết, bình luận, tương tác like và báo cáo vi phạm",
    descriptionEn: "Create posts, comments, likes and moderation reports",
  },
  RECOMMENDATIONS: {
    defaultScope: "COMMON",
    titleVi: "Gợi ý thông minh (AI)",
    titleEn: "AI Recommendations",
    descriptionVi: "Danh sách việc làm & ứng viên phù hợp do AI đề xuất",
    descriptionEn: "AI matching jobs and candidates recommendations",
  },
};

/**
 * Phân loại chính xác một quyền vào đúng Scope nghiệp vụ.
 * Ưu tiên nhận diện các route nội bộ của Admin (ví dụ: /api/forums/admin/*, /api/admin/*, /api/users/*, reindex/outbox).
 */
export function getPermissionScope(permission: {
  module?: string | null;
  path: string;
}): Exclude<PermissionScope, "ALL"> {
  const path = permission.path || "";
  const mod = (permission.module || "").toUpperCase();

  // 1. Tuyệt đối thuộc Admin Portal
  if (
    path.startsWith("/api/admin") ||
    path.startsWith("/api/forums/admin") ||
    path.includes("/reindex") ||
    path.includes("/outbox") ||
    mod === "ADMIN" ||
    mod === "USERS" ||
    mod === "ROLES" ||
    mod === "PERMISSIONS"
  ) {
    return "ADMIN";
  }

  // 2. Tra cứu catalog theo module
  const catalog = MODULE_CATALOG[mod];
  if (catalog) {
    return catalog.defaultScope;
  }

  return "COMMON";
}

/**
 * Lấy tiêu đề và mô tả thân thiện của Module theo ngôn ngữ.
 */
export function getModuleDisplayInfo(moduleName: string, locale: string = "vi") {
  const norm = (moduleName || "").toUpperCase();
  const meta = MODULE_CATALOG[norm];

  if (meta) {
    return {
      title: locale === "vi" ? meta.titleVi : meta.titleEn,
      description: locale === "vi" ? meta.descriptionVi : meta.descriptionEn,
      scope: meta.defaultScope,
    };
  }

  return {
    title: norm,
    description: "",
    scope: "COMMON" as const,
  };
}

