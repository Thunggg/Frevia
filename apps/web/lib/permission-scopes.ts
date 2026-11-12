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
  // ── ADMIN SCOPE ──
  ADMIN_KYC: {
    key: "ADMIN_KYC",
    code: "KYC (ADMIN)",
    titleVi: "Duyệt xác minh danh tính",
    titleEn: "Identity Verification (Admin)",
    descriptionVi: "Xem tài liệu căn cước công dân, phê duyệt hoặc từ chối yêu cầu KYC",
    descriptionEn: "Review ID documents, approve or reject identity verification requests",
    scope: "ADMIN",
    order: 10,
  },
  ADMIN_SKILLS: {
    key: "ADMIN_SKILLS",
    code: "SKILLS (ADMIN)",
    titleVi: "Quản lý kỹ năng",
    titleEn: "Skills Management (Admin)",
    descriptionVi: "Xem danh mục, tạo mới, cập nhật, xóa và khôi phục kỹ năng hệ thống",
    descriptionEn: "View, create, update, delete, and restore system skills catalog",
    scope: "ADMIN",
    order: 20,
  },
  ADMIN_JOB_CATEGORIES: {
    key: "ADMIN_JOB_CATEGORIES",
    code: "JOB CATEGORIES (ADMIN)",
    titleVi: "Danh mục việc làm",
    titleEn: "Job Categories (Admin)",
    descriptionVi: "Quản lý danh mục ngành nghề việc làm, chỉnh sửa, xóa và khôi phục",
    descriptionEn: "Manage job industry categories, edit, delete, and restore",
    scope: "ADMIN",
    order: 30,
  },
  ADMIN_BANNERS: {
    key: "ADMIN_BANNERS",
    code: "BANNERS (ADMIN)",
    titleVi: "Banner & Quảng cáo",
    titleEn: "Banners & Ads (Admin)",
    descriptionVi: "Quản lý banner hiển thị trang chủ, tải lên hình ảnh quảng cáo",
    descriptionEn: "Manage homepage banners, upload promotional images",
    scope: "ADMIN",
    order: 40,
  },
  ADMIN_DISPUTES: {
    key: "ADMIN_DISPUTES",
    code: "DISPUTES (ADMIN)",
    titleVi: "Phán quyết tranh chấp",
    titleEn: "Disputes Arbitration (Admin)",
    descriptionVi: "Xem chi tiết tranh chấp hợp đồng và đưa ra quyết định phán quyết",
    descriptionEn: "Review contract disputes and issue final binding arbitration decisions",
    scope: "ADMIN",
    order: 50,
  },
  ADMIN_PROFILE_REVISIONS: {
    key: "ADMIN_PROFILE_REVISIONS",
    code: "EXPERT REVISIONS (ADMIN)",
    titleVi: "Duyệt hồ sơ Chuyên gia",
    titleEn: "Expert Profile Revisions (Admin)",
    descriptionVi: "Xem xét, phê duyệt hoặc từ chối hồ sơ đăng ký của chuyên gia thẩm định",
    descriptionEn: "Review, approve, or reject arbitration expert registration profiles",
    scope: "ADMIN",
    order: 60,
  },
  ADMIN_FORUMS: {
    key: "ADMIN_FORUMS",
    code: "FORUM MODERATION (ADMIN)",
    titleVi: "Kiểm duyệt diễn đàn",
    titleEn: "Forum Moderation (Admin)",
    descriptionVi: "Quản lý chuyên mục diễn đàn, duyệt bài, xử lý báo cáo vi phạm và thùng rác",
    descriptionEn: "Manage forum categories, approve posts, handle reports, and trash bin",
    scope: "ADMIN",
    order: 70,
  },
  ADMIN_USERS: {
    key: "ADMIN_USERS",
    code: "USERS (ADMIN)",
    titleVi: "Quản lý người dùng",
    titleEn: "User Management (Admin)",
    descriptionVi: "Xem danh sách tài khoản, tạo/khóa tài khoản, cập nhật hồ sơ người dùng",
    descriptionEn: "View user accounts, create/lock users, and update profile data",
    scope: "ADMIN",
    order: 80,
  },
  ADMIN_ROLES: {
    key: "ADMIN_ROLES",
    code: "ROLES (ADMIN)",
    titleVi: "Quản lý vai trò",
    titleEn: "Role Management (Admin)",
    descriptionVi: "Tạo, cập nhật vai trò người dùng và gán quyền hạn hệ thống",
    descriptionEn: "Create, update user roles, and assign system permissions",
    scope: "ADMIN",
    order: 90,
  },
  ADMIN_PERMISSIONS: {
    key: "ADMIN_PERMISSIONS",
    code: "PERMISSIONS (ADMIN)",
    titleVi: "Quyền hệ thống",
    titleEn: "System Permissions (Admin)",
    descriptionVi: "Xem danh mục và chi tiết các quyền API hệ thống",
    descriptionEn: "View system API permissions catalog and endpoint details",
    scope: "ADMIN",
    order: 100,
  },
  ADMIN_AI_OPS: {
    key: "ADMIN_AI_OPS",
    code: "AI INDEXING (ADMIN)",
    titleVi: "Vận hành gợi ý AI",
    titleEn: "AI Indexing & Ops (Admin)",
    descriptionVi: "Đánh lại chỉ mục tìm kiếm và xử lý hàng đợi sự kiện gợi ý AI",
    descriptionEn: "Reindex search vector stores and process AI recommendation outbox",
    scope: "ADMIN",
    order: 110,
  },

  // ── CONTRACTS & PAYMENTS SCOPE ──
  CONTRACTS: {
    key: "CONTRACTS",
    code: "CONTRACTS",
    titleVi: "Hợp đồng",
    titleEn: "Contracts",
    descriptionVi: "Tạo hợp đồng, chỉnh sửa điều khoản, ký số, hủy/hoàn thành và xuất PDF",
    descriptionEn: "Create contracts, edit terms, digital sign, cancel, complete, and export PDF",
    scope: "CONTRACTS",
    order: 200,
  },
  MILESTONES: {
    key: "MILESTONES",
    code: "MILESTONES",
    titleVi: "Mốc công việc & Sản phẩm",
    titleEn: "Milestones & Deliverables",
    descriptionVi: "Quản lý milestone, cập nhật tiến độ, nộp sản phẩm, duyệt bài và tài liệu đính kèm",
    descriptionEn: "Manage milestones, track progress, submit deliverables, approve work, and files",
    scope: "CONTRACTS",
    order: 210,
  },
  PAYMENTS_ESCROW: {
    key: "PAYMENTS_ESCROW",
    code: "ESCROW & WALLET",
    titleVi: "Thanh toán & Ký quỹ",
    titleEn: "Escrow & Platform Payments",
    descriptionVi: "Ký quỹ milestone, giải ngân thanh toán, hoàn tiền, số dư ví và phí sàn",
    descriptionEn: "Fund milestone escrow, release payments, refund, wallet balance, and fees",
    scope: "CONTRACTS",
    order: 220,
  },
  PAYMENTS_STRIPE: {
    key: "PAYMENTS_STRIPE",
    code: "STRIPE CONNECT",
    titleVi: "Phương thức & Cổng thanh toán Stripe",
    titleEn: "Stripe & Payment Methods",
    descriptionVi: "Liên kết tài khoản Stripe Connect, quản lý thẻ lưu trữ và Stripe Customer Portal",
    descriptionEn: "Stripe Connect onboarding, saved payment methods, and Customer Portal",
    scope: "CONTRACTS",
    order: 230,
  },
  PAYMENTS_WITHDRAWAL: {
    key: "PAYMENTS_WITHDRAWAL",
    code: "WITHDRAWALS",
    titleVi: "Rút tiền & Chi trả",
    titleEn: "Withdrawals & Payouts",
    descriptionVi: "Tạo yêu cầu rút tiền về tài khoản ngân hàng, lịch sử chi trả và xử lý rút tiền",
    descriptionEn: "Request bank withdrawals, view payout history, and process payouts",
    scope: "CONTRACTS",
    order: 240,
  },
  DISPUTES: {
    key: "DISPUTES",
    code: "DISPUTES",
    titleVi: "Tranh chấp & Khiếu nại",
    titleEn: "Disputes & Claims",
    descriptionVi: "Mở khiếu nại tranh chấp hợp đồng, gửi phản hồi, cung cấp chứng cứ và hòa giải",
    descriptionEn: "Open contract disputes, submit evidence, dispute responses, and resolution",
    scope: "CONTRACTS",
    order: 250,
  },
  EXPERT_PROFILE: {
    key: "EXPERT_PROFILE",
    code: "EXPERT PROFILE",
    titleVi: "Hồ sơ Chuyên gia (Expert)",
    titleEn: "Expert Profile",
    descriptionVi: "Cập nhật hồ sơ năng lực chuyên môn và trạng thái duyệt chuyên gia thẩm định",
    descriptionEn: "Update arbitration expert credentials, bio, and revision status",
    scope: "CONTRACTS",
    order: 260,
  },

  // ── CLIENT SCOPE ──
  MANAGE_JOBS: {
    key: "MANAGE_JOBS",
    code: "JOB POSTINGS",
    titleVi: "Đăng & Quản lý việc làm",
    titleEn: "Job Postings Management",
    descriptionVi: "Đăng việc mới, chỉnh sửa tin tuyển dụng, đóng/mở nhận hồ sơ, bookmark việc làm",
    descriptionEn: "Post new jobs, edit postings, open/close hiring, and bookmark jobs",
    scope: "CLIENT",
    order: 300,
  },
  PROPOSALS: {
    key: "PROPOSALS",
    code: "PROPOSALS & BIDS",
    titleVi: "Đề xuất & Báo giá",
    titleEn: "Proposals & Bids",
    descriptionVi: "Xem danh sách đề xuất nộp cho công việc, phỏng vấn, chấp nhận hoặc từ chối báo giá",
    descriptionEn: "Review job proposals, interview candidates, accept or decline proposals",
    scope: "CLIENT",
    order: 310,
  },
  JOBS_APPLICANTS: {
    key: "JOBS_APPLICANTS",
    code: "APPLICANTS & SEARCH",
    titleVi: "Ứng viên & Tìm kiếm việc",
    titleEn: "Applicants & Job Search",
    descriptionVi: "Xem chi tiết công việc, duyệt danh sách ứng viên và tìm kiếm theo ngành nghề",
    descriptionEn: "View job details, candidate proposals, and browse by job category",
    scope: "CLIENT",
    order: 320,
  },
  CLIENTS: {
    key: "CLIENTS",
    code: "CLIENT PROFILE",
    titleVi: "Hồ sơ doanh nghiệp (Client)",
    titleEn: "Client Company Profile",
    descriptionVi: "Cập nhật thông tin công ty, quy mô doanh nghiệp và thông tin liên hệ tuyển dụng",
    descriptionEn: "Update company profile, business size, and hiring contact information",
    scope: "CLIENT",
    order: 330,
  },
  FAVORITES_FOLLOWING: {
    key: "FAVORITES_FOLLOWING",
    code: "SAVED TALENT",
    titleVi: "Freelancer đã lưu & Theo dõi",
    titleEn: "Saved & Followed Talents",
    descriptionVi: "Lưu danh sách freelancer ưa thích và theo dõi hồ sơ nhân tài nổi bật",
    descriptionEn: "Bookmark favorite freelancers and follow outstanding talents",
    scope: "CLIENT",
    order: 340,
  },

  // ── FREELANCER SCOPE ──
  PROFILES: {
    key: "PROFILES",
    code: "FREELANCER PROFILE",
    titleVi: "Hồ sơ & CV Freelancer",
    titleEn: "Freelancer Profile & CV",
    descriptionVi: "Cập nhật hồ sơ cá nhân, danh mục kỹ năng, dự án portfolio và phân tích CV bằng AI",
    descriptionEn: "Manage personal profile, skills catalog, portfolios, and AI CV extraction",
    scope: "FREELANCER",
    order: 400,
  },
  IDENTITY_VERIFICATIONS: {
    key: "IDENTITY_VERIFICATIONS",
    code: "KYC VERIFICATION",
    titleVi: "Xác minh danh tính (KYC)",
    titleEn: "Identity Verification (KYC)",
    descriptionVi: "Tải ảnh căn cước công dân, quét khuôn mặt liveness và đối chiếu danh tính AI",
    descriptionEn: "Upload ID documents, facial liveness pose check, and AI verification",
    scope: "FREELANCER",
    order: 410,
  },
  JOB_ALERTS: {
    key: "JOB_ALERTS",
    code: "JOB ALERTS",
    titleVi: "Thông báo việc làm",
    titleEn: "Job Alerts",
    descriptionVi: "Cài đặt nhận thông báo việc làm tự động theo tiêu chí và kỹ năng phù hợp",
    descriptionEn: "Set up automatic job alerts matching skills and preferred criteria",
    scope: "FREELANCER",
    order: 420,
  },
  SAVED_SEARCHES: {
    key: "SAVED_SEARCHES",
    code: "SAVED SEARCHES",
    titleVi: "Tìm kiếm đã lưu",
    titleEn: "Saved Searches",
    descriptionVi: "Lưu bộ lọc và từ khóa tìm kiếm việc làm để truy cập nhanh",
    descriptionEn: "Save search filters and keywords for quick job exploration",
    scope: "FREELANCER",
    order: 430,
  },

  // ── COMMON SCOPE ──
  AUTH: {
    key: "AUTH",
    code: "AUTHENTICATION",
    titleVi: "Xác thực & Vai trò",
    titleEn: "Authentication & Roles",
    descriptionVi: "Đăng nhập, đăng ký tài khoản, xác thực OTP, đổi vai trò hoạt động, làm mới token",
    descriptionEn: "Login, registration, OTP verification, switch active role, token refresh",
    scope: "COMMON",
    order: 500,
  },
  ACCOUNT_PROFILE: {
    key: "ACCOUNT_PROFILE",
    code: "ACCOUNT PROFILE",
    titleVi: "Tài khoản cá nhân",
    titleEn: "Account Profile",
    descriptionVi: "Xem và cập nhật thông tin cá nhân, thay đổi mật khẩu, tải lên ảnh đại diện",
    descriptionEn: "View and update account information, change password, upload avatar",
    scope: "COMMON",
    order: 510,
  },
  SESSIONS: {
    key: "SESSIONS",
    code: "ACTIVE SESSIONS",
    titleVi: "Phiên đăng nhập",
    titleEn: "Active Sessions",
    descriptionVi: "Xem danh sách thiết bị đang đăng nhập và đăng xuất phiên từ xa",
    descriptionEn: "View logged-in devices and remotely revoke active sessions",
    scope: "COMMON",
    order: 520,
  },
  CONVERSATIONS: {
    key: "CONVERSATIONS",
    code: "MESSAGING",
    titleVi: "Trò chuyện & Nhắn tin",
    titleEn: "Chat & Messaging",
    descriptionVi: "Trò chuyện trực tuyến realtime, gửi tin nhắn văn bản và tệp tin đính kèm",
    descriptionEn: "Realtime messaging, send text messages, and file attachments",
    scope: "COMMON",
    order: 530,
  },
  NOTIFICATIONS: {
    key: "NOTIFICATIONS",
    code: "NOTIFICATIONS",
    titleVi: "Thông báo hệ thống",
    titleEn: "System Notifications",
    descriptionVi: "Xem danh sách thông báo, số thông báo chưa đọc và đánh dấu đã đọc",
    descriptionEn: "View activity notifications, unread count, and mark as read",
    scope: "COMMON",
    order: 540,
  },
  REVIEWS: {
    key: "REVIEWS",
    code: "REVIEWS & RATINGS",
    titleVi: "Đánh giá & Phản hồi",
    titleEn: "Reviews & Feedback",
    descriptionVi: "Đánh giá sao cho hợp đồng hoàn thành và phản hồi nhận xét của đối tác",
    descriptionEn: "Rate completed contracts, leave feedback, and reply to partner reviews",
    scope: "COMMON",
    order: 550,
  },
  FORUMS: {
    key: "FORUMS",
    code: "COMMUNITY FORUM",
    titleVi: "Diễn đàn cộng đồng",
    titleEn: "Community Forum",
    descriptionVi: "Xem danh mục bài viết, đăng bài mới, bình luận, like và gửi báo cáo vi phạm",
    descriptionEn: "Explore categories, create posts, comments, likes, and submit reports",
    scope: "COMMON",
    order: 560,
  },
  SOCIAL_LINKS: {
    key: "SOCIAL_LINKS",
    code: "SOCIAL LINKS",
    titleVi: "Liên kết mạng xã hội",
    titleEn: "Social Links",
    descriptionVi: "Thêm, cập nhật và xóa liên kết mạng xã hội cá nhân (GitHub, LinkedIn...)",
    descriptionEn: "Add, update, and remove external social profile links (GitHub, LinkedIn...)",
    scope: "COMMON",
    order: 570,
  },
  RECOMMENDATIONS: {
    key: "RECOMMENDATIONS",
    code: "AI RECOMMENDATIONS",
    titleVi: "Gợi ý thông minh (AI)",
    titleEn: "AI Recommendations",
    descriptionVi: "Xem danh sách việc làm và nhân tài phù hợp do AI gợi ý",
    descriptionEn: "View matching jobs and talents recommended by AI algorithms",
    scope: "COMMON",
    order: 580,
  },
  COMMON_BANNERS: {
    key: "COMMON_BANNERS",
    code: "PLATFORM BANNERS",
    titleVi: "Banner công khai",
    titleEn: "Public Banners",
    descriptionVi: "Xem hình ảnh và liên kết banner quảng cáo trên trang chủ",
    descriptionEn: "View public promotional banners and images on homepage",
    scope: "COMMON",
    order: 590,
  },
} satisfies Record<string, FeatureGroupDefinition>;

/**
 * Phân loại chính xác một quyền vào Cụm chức năng (Feature Group) chuyên biệt.
 */
export function getPermissionFeatureGroup(permission: {
  path: string;
  method?: string;
  module?: string | null;
}): FeatureGroupDefinition {
  const path = permission.path || "";
  const mod = (permission.module || "").toUpperCase();

  // ── 1. NHÓM ADMIN PORTAL ──
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
  if (path.startsWith("/api/admin/disputes")) {
    return FEATURE_GROUPS.ADMIN_DISPUTES;
  }
  if (path.startsWith("/api/admin/profile-revisions")) {
    return FEATURE_GROUPS.ADMIN_PROFILE_REVISIONS;
  }
  if (path.startsWith("/api/forums/admin")) {
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

  // ── 2. NHÓM HỢP ĐỒNG & THANH TOÁN ──
  if (path.includes("/milestones")) {
    return FEATURE_GROUPS.MILESTONES;
  }
  if (path.startsWith("/api/contracts") || mod === "CONTRACTS") {
    return FEATURE_GROUPS.CONTRACTS;
  }
  if (
    path.startsWith("/api/payments/withdraw") ||
    path.startsWith("/api/payments/payout")
  ) {
    return FEATURE_GROUPS.PAYMENTS_WITHDRAWAL;
  }
  if (
    path.startsWith("/api/payments/connect") ||
    path.startsWith("/api/payments/payment-methods") ||
    path.startsWith("/api/payments/customer-portal") ||
    path.startsWith("/api/payments/checkout-sessions")
  ) {
    return FEATURE_GROUPS.PAYMENTS_STRIPE;
  }
  if (path.startsWith("/api/payments") || mod === "PAYMENTS") {
    return FEATURE_GROUPS.PAYMENTS_ESCROW;
  }
  if (path.startsWith("/api/disputes") || mod === "DISPUTES") {
    return FEATURE_GROUPS.DISPUTES;
  }
  if (
    path.startsWith("/api/expert-profile") ||
    path.startsWith("/api/experts") ||
    path.startsWith("/api/profile-revisions/me") ||
    mod === "EXPERT-PROFILE"
  ) {
    return FEATURE_GROUPS.EXPERT_PROFILE;
  }

  // ── 3. NHÓM KHÁCH HÀNG (CLIENT) ──
  if (path.startsWith("/api/manage-jobs") || mod === "MANAGE-JOBS") {
    return FEATURE_GROUPS.MANAGE_JOBS;
  }
  if (path.startsWith("/api/proposals") || path.includes("/proposals") || mod === "PROPOSALS") {
    return FEATURE_GROUPS.PROPOSALS;
  }
  if (path.startsWith("/api/jobs") || path.startsWith("/api/job-categories") || mod === "JOBS") {
    return FEATURE_GROUPS.JOBS_APPLICANTS;
  }
  if (path.startsWith("/api/clients") || mod === "CLIENTS") {
    return FEATURE_GROUPS.CLIENTS;
  }
  if (
    path.startsWith("/api/favorites") ||
    path.startsWith("/api/following") ||
    mod === "FAVORITES" ||
    mod === "FOLLOWING"
  ) {
    return FEATURE_GROUPS.FAVORITES_FOLLOWING;
  }

  // ── 4. NHÓM FREELANCER ──
  if (path.startsWith("/api/profiles") || mod === "PROFILES") {
    return FEATURE_GROUPS.PROFILES;
  }
  if (
    path.startsWith("/api/identity-verifications") ||
    mod === "IDENTITY-VERIFICATIONS"
  ) {
    return FEATURE_GROUPS.IDENTITY_VERIFICATIONS;
  }
  if (path.startsWith("/api/job-alerts") || mod === "JOB-ALERTS") {
    return FEATURE_GROUPS.JOB_ALERTS;
  }
  if (path.startsWith("/api/saved-searches") || mod === "SAVED-SEARCHES") {
    return FEATURE_GROUPS.SAVED_SEARCHES;
  }

  // ── 5. NHÓM NỀN TẢNG DÙNG CHUNG (COMMON) ──
  if (path.startsWith("/api/auth") || mod === "AUTH") {
    return FEATURE_GROUPS.AUTH;
  }
  if (path.startsWith("/api/account-profile") || mod === "ACCOUNT-PROFILE") {
    return FEATURE_GROUPS.ACCOUNT_PROFILE;
  }
  if (path.startsWith("/api/sessions") || mod === "SESSIONS") {
    return FEATURE_GROUPS.SESSIONS;
  }
  if (path.startsWith("/api/social-links") || mod === "SOCIAL-LINKS") {
    return FEATURE_GROUPS.SOCIAL_LINKS;
  }
  if (path.startsWith("/api/conversations") || mod === "CONVERSATIONS") {
    return FEATURE_GROUPS.CONVERSATIONS;
  }
  if (path.startsWith("/api/notifications") || mod === "NOTIFICATIONS") {
    return FEATURE_GROUPS.NOTIFICATIONS;
  }
  if (path.startsWith("/api/reviews") || mod === "REVIEWS") {
    return FEATURE_GROUPS.REVIEWS;
  }
  if (path.startsWith("/api/forums") || mod === "FORUMS") {
    return FEATURE_GROUPS.FORUMS;
  }
  if (path.startsWith("/api/recommendations") || mod === "RECOMMENDATIONS") {
    return FEATURE_GROUPS.RECOMMENDATIONS;
  }
  if (path.startsWith("/api/banners")) {
    return FEATURE_GROUPS.COMMON_BANNERS;
  }

  // Fallback mặc định
  return {
    key: mod || "COMMON",
    code: mod || "GENERAL",
    titleVi: mod || "Chức năng hệ thống",
    titleEn: mod || "System Features",
    descriptionVi: "Các quyền API hệ thống chung",
    descriptionEn: "General platform API permissions",
    scope: "COMMON",
    order: 999,
  };
}

/**
 * Phân loại chính xác một quyền vào đúng Scope nghiệp vụ lớn.
 */
export function getPermissionScope(permission: {
  path: string;
  method?: string;
  module?: string | null;
}): Exclude<PermissionScope, "ALL"> {
  return getPermissionFeatureGroup(permission).scope;
}

/**
 * Lấy danh sách tất cả Feature Groups, có thể lọc theo Scope.
 */
export function getAllFeatureGroups(
  scope?: PermissionScope,
): FeatureGroupDefinition[] {
  const all = Object.values(FEATURE_GROUPS).sort((a, b) => a.order - b.order);
  if (!scope || scope === "ALL") {
    return all;
  }
  return all.filter((g) => g.scope === scope);
}

export interface ModuleMetadata {
  defaultScope: Exclude<PermissionScope, "ALL">;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

/**
 * Lấy tiêu đề và mô tả thân thiện của Module theo ngôn ngữ (cho tương thích ngược).
 */
export function getModuleDisplayInfo(
  moduleName: string,
  locale: string = "vi",
) {
  const norm = (moduleName || "").toUpperCase();
  const group = (
    FEATURE_GROUPS as Record<string, FeatureGroupDefinition | undefined>
  )[norm];

  if (group) {
    return {
      title: locale === "vi" ? group.titleVi : group.titleEn,
      description: locale === "vi" ? group.descriptionVi : group.descriptionEn,
      scope: group.scope,
    };
  }

  return {
    title: norm,
    description: "",
    scope: "COMMON" as const,
  };
}
