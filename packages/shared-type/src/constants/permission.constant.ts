import { HttpMethod } from "./http-method.constant";

export interface PermissionDescriptor {
  en: string;
  vi: string;
}

/**
 * Mapping of all API routes to descriptive, human-readable names in English and Vietnamese.
 */
export const PERMISSION_MAP: Record<string, PermissionDescriptor> = {
  // APP
  "GET /api": { en: "System Health Check", vi: "Kiểm tra trạng thái hệ thống" },

  // AUTH
  "POST /api/auth/register": { en: "Register Account", vi: "Đăng ký tài khoản" },
  "POST /api/auth/otp": { en: "Verify / Send OTP", vi: "Xác thực / Gửi mã OTP" },
  "POST /api/auth/login": { en: "Account Login", vi: "Đăng nhập tài khoản" },
  "POST /api/auth/refresh-token": { en: "Refresh Access Token", vi: "Làm mới phiên đăng nhập" },
  "POST /api/auth/logout": { en: "Logout Account", vi: "Đăng xuất tài khoản" },
  "POST /api/auth/forgot-password": { en: "Forgot / Reset Password", vi: "Quên / Đặt lại mật khẩu" },
  "GET /api/auth/google-link": { en: "Get Google OAuth URL", vi: "Lấy liên kết đăng nhập Google" },
  "GET /api/auth/google/callback": { en: "Google OAuth Callback", vi: "Xử lý callback đăng nhập Google" },
  "GET /api/auth/me": { en: "Get Current User Profile", vi: "Xem thông tin tài khoản hiện tại" },
  "POST /api/auth/switch-role": { en: "Switch Active Role", vi: "Chuyển đổi vai trò làm việc" },
  "POST /api/auth/join-role": { en: "Register Additional Role", vi: "Đăng ký thêm vai trò" },

  // ACCOUNT PROFILE
  "GET /api/account-profile": { en: "View Account Profile", vi: "Xem hồ sơ tài khoản" },
  "PUT /api/account-profile": { en: "Update Account Profile", vi: "Cập nhật hồ sơ tài khoản" },
  "PUT /api/account-profile/password": { en: "Change Password", vi: "Đổi mật khẩu" },
  "POST /api/account-profile/avatar": { en: "Upload Avatar Image", vi: "Tải lên ảnh đại diện" },
  "GET /api/account-profile/avatar/:userId/file": { en: "View Avatar Image File", vi: "Xem file ảnh đại diện" },
  "POST /api/account-profile/documents": { en: "Upload Identity Documents", vi: "Tải lên tài liệu xác minh danh tính" },
  "POST /api/account-profile/ai-check": { en: "AI Verification Check", vi: "Kiểm tra xác thực CCCD bằng AI" },
  "POST /api/account-profile/liveness-pose": { en: "Liveness Pose Verification", vi: "Kiểm tra người thật (Liveness Pose)" },
  "GET /api/account-profile/status": { en: "View Verification Status", vi: "Xem trạng thái xác minh tài khoản" },
  "GET /api/account-profile/documents/:id/file": { en: "Download Verification Document", vi: "Tải tài liệu xác minh" },
  "GET /api/account-profile/:userId": { en: "View Public User Profile", vi: "Xem hồ sơ công khai của người dùng" },
  "PUT /api/account-profile/me/profile": { en: "Update General Profile", vi: "Cập nhật hồ sơ chung" },
  "GET /api/account-profile/discover": { en: "Discover Freelancers", vi: "Khám phá hồ sơ Freelancer" },

  // IDENTITY VERIFICATIONS (Direct)
  "POST /api/identity-verifications/ai-check": { en: "AI Verification Check", vi: "Kiểm tra xác thực CCCD bằng AI" },
  "POST /api/identity-verifications/documents": { en: "Upload Identity Documents", vi: "Tải lên tài liệu xác minh danh tính" },
  "GET /api/identity-verifications/documents/:id/file": { en: "Download Verification Document", vi: "Tải tài liệu xác minh" },
  "POST /api/identity-verifications/liveness-pose": { en: "Liveness Pose Verification", vi: "Kiểm tra người thật (Liveness Pose)" },
  "GET /api/identity-verifications/status": { en: "View Verification Status", vi: "Xem trạng thái xác minh tài khoản" },

  // SESSIONS
  "GET /api/sessions": { en: "View Active Sessions", vi: "Xem danh sách phiên đăng nhập" },
  "GET /api/sessions/:id": { en: "View Session Detail", vi: "Xem chi tiết phiên đăng nhập" },
  "DELETE /api/sessions/:id": { en: "Revoke Remote Session", vi: "Đăng xuất phiên từ xa" },

  // ROLES
  "GET /api/roles": { en: "View Role List", vi: "Xem danh sách vai trò" },
  "GET /api/roles/:id": { en: "View Role Detail", vi: "Xem chi tiết vai trò" },
  "POST /api/roles": { en: "Create Role", vi: "Tạo vai trò mới" },
  "PATCH /api/roles/:id": { en: "Update Role", vi: "Cập nhật vai trò" },
  "PUT /api/roles/:id/permissions": { en: "Update Role Permissions", vi: "Gán quyền cho vai trò" },
  "DELETE /api/roles/:id": { en: "Delete Role", vi: "Xóa vai trò" },

  // PERMISSIONS
  "GET /api/permissions": { en: "View Permission List", vi: "Xem danh sách quyền hệ thống" },
  "GET /api/permissions/:id": { en: "View Permission Detail", vi: "Xem chi tiết quyền" },

  // USERS (ADMIN)
  "GET /api/users": { en: "View User List", vi: "Xem danh sách người dùng" },
  "GET /api/users/:id": { en: "View User Detail", vi: "Xem chi tiết người dùng" },
  "POST /api/users": { en: "Create User Account", vi: "Tạo tài khoản người dùng mới" },
  "PATCH /api/users/:id": { en: "Update User Account", vi: "Cập nhật tài khoản người dùng" },
  "PATCH /api/users/:id/client-profile": { en: "Update Client Profile (Admin)", vi: "Cập nhật hồ sơ Client (Admin)" },
  "PATCH /api/users/:id/freelancer-profile": { en: "Update Freelancer Profile (Admin)", vi: "Cập nhật hồ sơ Freelancer (Admin)" },
  "PUT /api/users/:id/freelancer-profile/skills": { en: "Update Freelancer Skills (Admin)", vi: "Cập nhật kỹ năng Freelancer (Admin)" },
  "POST /api/users/:id/freelancer-profile/portfolio-items": { en: "Add Freelancer Portfolio Item (Admin)", vi: "Thêm Portfolio Freelancer (Admin)" },
  "PATCH /api/users/:id/freelancer-profile/portfolio-items/:itemId": { en: "Update Freelancer Portfolio Item (Admin)", vi: "Cập nhật Portfolio Freelancer (Admin)" },
  "DELETE /api/users/:id/freelancer-profile/portfolio-items/:itemId": { en: "Delete Freelancer Portfolio Item (Admin)", vi: "Xóa Portfolio Freelancer (Admin)" },
  "PATCH /api/users/:id/expert-profile": { en: "Update Expert Profile (Admin)", vi: "Cập nhật hồ sơ Expert (Admin)" },
  "GET /api/users/skills-catalog": { en: "View Skills Catalog", vi: "Xem danh mục kỹ năng hệ thống" },

  // ADMIN JOB CATEGORIES
  "GET /api/admin/job-categories": { en: "View Job Category List", vi: "Xem danh sách danh mục công việc" },
  "GET /api/admin/job-categories/:id": { en: "View Job Category Detail", vi: "Xem chi tiết danh mục công việc" },
  "POST /api/admin/job-categories": { en: "Create Job Category", vi: "Tạo danh mục công việc mới" },
  "PATCH /api/admin/job-categories/:id": { en: "Update Job Category", vi: "Cập nhật danh mục công việc" },
  "DELETE /api/admin/job-categories/:id": { en: "Delete Job Category", vi: "Xóa danh mục công việc" },
  "PATCH /api/admin/job-categories/:id/restore": { en: "Restore Job Category", vi: "Khôi phục danh mục công việc đã xóa" },

  // ADMIN SKILLS
  "GET /api/admin/skills": { en: "View Skill List", vi: "Xem danh sách kỹ năng" },
  "GET /api/admin/skills/:id": { en: "View Skill Detail", vi: "Xem chi tiết kỹ năng" },
  "POST /api/admin/skills": { en: "Create Skill", vi: "Tạo kỹ năng mới" },
  "PATCH /api/admin/skills/:id": { en: "Update Skill", vi: "Cập nhật kỹ năng" },
  "DELETE /api/admin/skills/:id": { en: "Delete Skill", vi: "Xóa kỹ năng" },
  "PATCH /api/admin/skills/:id/restore": { en: "Restore Skill", vi: "Khôi phục kỹ năng đã xóa" },

  // ADMIN BANNERS
  "GET /api/admin/banners": { en: "View Banner List", vi: "Xem danh sách banner quảng cáo" },
  "GET /api/admin/banners/:id": { en: "View Banner Detail", vi: "Xem chi tiết banner quảng cáo" },
  "POST /api/admin/banners": { en: "Create Banner", vi: "Tạo banner quảng cáo mới" },
  "PATCH /api/admin/banners/:id": { en: "Update Banner", vi: "Cập nhật banner quảng cáo" },
  "DELETE /api/admin/banners/:id": { en: "Delete Banner", vi: "Xóa banner quảng cáo" },
  "POST /api/admin/banners/upload-image": { en: "Upload Banner Image", vi: "Tải lên hình ảnh banner" },

  // ADMIN DISPUTES
  "GET /api/admin/disputes": { en: "View Dispute List (Admin)", vi: "Xem danh sách tranh chấp (Admin)" },
  "GET /api/admin/disputes/:id": { en: "View Dispute Detail (Admin)", vi: "Xem chi tiết tranh chấp (Admin)" },
  "POST /api/admin/disputes/:id/decision": { en: "Make Dispute Decision (Admin)", vi: "Đưa ra phán quyết tranh chấp (Admin)" },
  "POST /api/admin/disputes/:id/final-decision": { en: "Final Dispute Decision (Admin)", vi: "Phán quyết tranh chấp cuối cùng (Admin)" },

  // ADMIN IDENTITY VERIFICATIONS
  "GET /api/admin/identity-verifications": { en: "View Identity Verification List", vi: "Xem danh sách yêu cầu xác thực danh tính" },
  "GET /api/admin/identity-verifications/:id": { en: "View Identity Verification Detail", vi: "Xem chi tiết yêu cầu xác thực danh tính" },
  "PATCH /api/admin/identity-verifications/:id/approve": { en: "Approve Identity Verification", vi: "Phê duyệt xác thực danh tính" },
  "PATCH /api/admin/identity-verifications/:id/reject": { en: "Reject Identity Verification", vi: "Từ chối xác thực danh tính" },
  "GET /api/admin/identity-verifications/:id/file": { en: "View Verification Document File", vi: "Xem file tài liệu xác thực" },

  // ADMIN PROFILE REVISIONS
  "GET /api/admin/profile-revisions": { en: "View Profile Revision List", vi: "Xem danh sách hồ sơ Expert chờ duyệt" },
  "GET /api/admin/profile-revisions/:id": { en: "View Profile Revision Detail", vi: "Xem chi tiết hồ sơ Expert chờ duyệt" },
  "PATCH /api/admin/profile-revisions/:id/approve": { en: "Approve Profile Revision", vi: "Phê duyệt hồ sơ Expert" },
  "PATCH /api/admin/profile-revisions/:id/reject": { en: "Reject Profile Revision", vi: "Từ chối hồ sơ Expert" },

  // ADMIN FORUMS
  "GET /api/forums/admin/categories": { en: "View Forum Category List", vi: "Xem danh sách danh mục diễn đàn" },
  "GET /api/forums/admin/categories/:id": { en: "View Forum Category Detail", vi: "Xem chi tiết danh mục diễn đàn" },
  "POST /api/forums/admin/categories": { en: "Create Forum Category", vi: "Tạo danh mục diễn đàn mới" },
  "PATCH /api/forums/admin/categories/:id": { en: "Update Forum Category", vi: "Cập nhật danh mục diễn đàn" },
  "DELETE /api/forums/admin/categories/:id": { en: "Delete Forum Category", vi: "Xóa danh mục diễn đàn" },
  "PATCH /api/forums/admin/categories/:id/restore": { en: "Restore Forum Category", vi: "Khôi phục danh mục diễn đàn đã xóa" },
  "GET /api/forums/admin/reports": { en: "View Forum Reports", vi: "Xem danh sách báo cáo vi phạm diễn đàn" },
  "PATCH /api/forums/admin/reports/:id/resolve": { en: "Resolve Forum Report", vi: "Xử lý báo cáo vi phạm diễn đàn" },
  "DELETE /api/forums/admin/posts/:id": { en: "Delete Forum Post (Admin)", vi: "Xóa bài viết diễn đàn (Admin)" },
  "DELETE /api/forums/admin/comments/:id": { en: "Delete Forum Comment (Admin)", vi: "Xóa bình luận diễn đàn (Admin)" },
  "GET /api/forums/admin/comments": { en: "View All Forum Comments (Admin)", vi: "Xem tất cả bình luận diễn đàn (Admin)" },
  "GET /api/forums/admin/pending-posts": { en: "View Pending Forum Posts", vi: "Xem bài viết diễn đàn chờ duyệt" },
  "PATCH /api/forums/admin/posts/:id/approve": { en: "Approve Forum Post", vi: "Phê duyệt bài viết diễn đàn" },
  "PATCH /api/forums/admin/posts/:id/reject": { en: "Reject Forum Post", vi: "Từ chối bài viết diễn đàn" },
  "GET /api/forums/admin/stats": { en: "View Forum Statistics", vi: "Xem thống kê diễn đàn" },
  "GET /api/forums/admin/trash/comments": { en: "View Deleted Forum Comments", vi: "Xem bình luận diễn đàn đã xóa" },
  "PATCH /api/forums/admin/trash/comments/:id/restore": { en: "Restore Deleted Forum Comment", vi: "Khôi phục bình luận diễn đàn đã xóa" },
  "GET /api/forums/admin/trash/posts": { en: "View Deleted Forum Posts", vi: "Xem bài viết diễn đàn đã xóa" },
  "PATCH /api/forums/admin/trash/posts/:id/restore": { en: "Restore Deleted Forum Post", vi: "Khôi phục bài viết diễn đàn đã xóa" },

  // FORUMS PUBLIC / USER
  "GET /api/forums/categories": { en: "View Public Forum Categories", vi: "Xem danh mục diễn đàn" },
  "GET /api/forums/categories/:id": { en: "View Forum Category by ID", vi: "Xem danh mục diễn đàn theo ID" },
  "GET /api/forums/categories/by-slug/:slug": { en: "View Forum Category by Slug", vi: "Xem danh mục diễn đàn theo slug" },
  "GET /api/forums/categories/top": { en: "View Top Forum Categories", vi: "Xem danh mục diễn đàn nổi bật" },
  "GET /api/forums/posts": { en: "View Forum Post List", vi: "Xem danh sách bài viết diễn đàn" },
  "POST /api/forums/posts": { en: "Create Forum Post", vi: "Đăng bài viết mới trên diễn đàn" },
  "GET /api/forums/posts/:id": { en: "View Forum Post Detail", vi: "Xem chi tiết bài viết diễn đàn" },
  "PATCH /api/forums/posts/:id": { en: "Update Forum Post", vi: "Chỉnh sửa bài viết diễn đàn" },
  "DELETE /api/forums/posts/:id": { en: "Delete Forum Post", vi: "Xóa bài viết diễn đàn" },
  "GET /api/forums/posts/:id/like": { en: "Check Post Like Status", vi: "Kiểm tra trạng thái thích bài viết" },
  "POST /api/forums/posts/:id/like": { en: "Like / Unlike Post", vi: "Thích / Bỏ thích bài viết" },
  "GET /api/forums/posts/:postId/comments": { en: "View Post Comments", vi: "Xem bình luận bài viết" },
  "POST /api/forums/posts/:postId/comments": { en: "Add Comment to Post", vi: "Bình luận bài viết" },
  "GET /api/forums/posts/:postId/comments/:commentId/is-reported": { en: "Check Comment Reported Status", vi: "Kiểm tra trạng thái báo cáo bình luận" },
  "POST /api/forums/posts/:postId/comments/:commentId/like": { en: "Like / Unlike Comment", vi: "Thích / Bỏ thích bình luận" },
  "GET /api/forums/posts/:postId/comments/:commentId/like": { en: "Check Comment Like Status", vi: "Kiểm tra trạng thái thích bình luận" },
  "GET /api/forums/posts/:postId/comments/:id": { en: "View Comment Detail", vi: "Xem chi tiết bình luận" },
  "PATCH /api/forums/comments/:id": { en: "Update Comment", vi: "Chỉnh sửa bình luận" },
  "DELETE /api/forums/comments/:id": { en: "Delete Comment", vi: "Xóa bình luận" },
  "POST /api/forums/reports": { en: "Report Forum Content", vi: "Báo cáo vi phạm nội dung diễn đàn" },
  "POST /api/forums/posts/:postId/comments/:commentId/reports": { en: "Report Forum Comment", vi: "Báo cáo bình luận diễn đàn" },
  "DELETE /api/forums/posts/:postId/comments/:id": { en: "Delete Post Comment", vi: "Xóa bình luận bài viết" },
  "PATCH /api/forums/posts/:postId/comments/:id": { en: "Update Post Comment", vi: "Chỉnh sửa bình luận bài viết" },
  "GET /api/forums/posts/:postId/is-reported": { en: "Check Post Reported Status", vi: "Kiểm tra trạng thái báo cáo bài viết" },
  "POST /api/forums/posts/:postId/reports": { en: "Report Forum Post", vi: "Báo cáo bài viết diễn đàn" },
  "GET /api/forums/posts/by-slug/:slug": { en: "View Forum Post by Slug", vi: "Xem bài viết diễn đàn theo slug" },
  "GET /api/forums/posts/top": { en: "View Top Forum Posts", vi: "Xem bài viết diễn đàn nổi bật" },
  "GET /api/forums/reports": { en: "View My Forum Reports", vi: "Xem danh sách báo cáo vi phạm của tôi" },
  "PATCH /api/forums/reports/:reportId/status": { en: "Update Report Status", vi: "Cập nhật trạng thái báo cáo vi phạm" },
  "GET /api/forums/users/top": { en: "View Top Forum Contributors", vi: "Xem danh sách thành viên tích cực nhất" },

  // CONTRACTS
  "GET /api/contracts": { en: "View Contract List", vi: "Xem danh sách hợp đồng" },
  "POST /api/contracts": { en: "Create Contract", vi: "Tạo hợp đồng mới" },
  "GET /api/contracts/:id": { en: "View Contract Detail", vi: "Xem chi tiết hợp đồng" },
  "PATCH /api/contracts/:id": { en: "Update Contract Terms", vi: "Cập nhật điều khoản hợp đồng" },
  "PATCH /api/contracts/:id/sign": { en: "Sign Contract", vi: "Ký hợp đồng" },
  "PATCH /api/contracts/:id/reject": { en: "Reject Contract Offer", vi: "Từ chối lời mời hợp đồng" },
  "PATCH /api/contracts/:id/cancel": { en: "Cancel Contract", vi: "Hủy hợp đồng" },
  "PATCH /api/contracts/:id/complete": { en: "Complete Contract", vi: "Hoàn thành hợp đồng" },
  "GET /api/contracts/:id/pdf": { en: "Export Contract PDF", vi: "Xuất file PDF hợp đồng" },
  "GET /api/contracts/slug/:slug": { en: "View Contract by Slug", vi: "Xem hợp đồng theo mã định danh (slug)" },
  "GET /api/contracts/:contractId/milestones": { en: "View Contract Milestones", vi: "Xem danh sách milestone của hợp đồng" },
  "POST /api/contracts/:contractId/milestones": { en: "Create Contract Milestone", vi: "Tạo milestone cho hợp đồng" },
  "GET /api/contracts/:contractId/milestones/:id": { en: "View Milestone Detail", vi: "Xem chi tiết milestone" },
  "GET /api/contracts/:contractId/milestones/:milestoneId": { en: "View Milestone Detail", vi: "Xem chi tiết milestone" },
  "PATCH /api/contracts/:contractId/milestones/:id": { en: "Update Milestone", vi: "Cập nhật milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId": { en: "Update Milestone", vi: "Cập nhật milestone" },
  "DELETE /api/contracts/:contractId/milestones/:id": { en: "Delete Milestone", vi: "Xóa milestone" },
  "DELETE /api/contracts/:contractId/milestones/:milestoneId": { en: "Delete Milestone", vi: "Xóa milestone" },
  "PATCH /api/contracts/:contractId/milestones/:id/progress": { en: "Update Milestone Progress", vi: "Cập nhật tiến độ milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId/progress": { en: "Update Milestone Progress", vi: "Cập nhật tiến độ milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId/approve": { en: "Approve Milestone", vi: "Phê duyệt milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId/request-changes": { en: "Request Milestone Changes", vi: "Yêu cầu chỉnh sửa milestone" },
  "GET /api/contracts/:contractId/milestones/:milestoneId/submissions": { en: "View Milestone Submissions", vi: "Xem danh sách bài nộp milestone" },
  "POST /api/contracts/:contractId/milestones/:milestoneId/submissions": { en: "Submit Milestone Work", vi: "Nộp sản phẩm milestone" },
  "GET /api/contracts/:contractId/milestones/:milestoneId/submissions/:id": { en: "View Submission Detail", vi: "Xem chi tiết bài nộp milestone" },
  "GET /api/contracts/:contractId/milestones/:milestoneId/submissions/:submissionId": { en: "View Submission Detail", vi: "Xem chi tiết bài nộp milestone" },
  "DELETE /api/contracts/:contractId/milestones/:milestoneId/submissions/:id": { en: "Delete Milestone Submission", vi: "Xóa bài nộp milestone" },
  "DELETE /api/contracts/:contractId/milestones/:milestoneId/submissions/:submissionId": { en: "Delete Milestone Submission", vi: "Xóa bài nộp milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve": { en: "Approve Submission", vi: "Phê duyệt bài nộp milestone" },
  "PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes": { en: "Request Submission Changes", vi: "Yêu cầu sửa đổi bài nộp milestone" },
  "GET /api/contracts/:contractId/milestones/:milestoneId/files": { en: "View Milestone Files", vi: "Xem danh sách file milestone" },
  "POST /api/contracts/:contractId/milestones/:milestoneId/files": { en: "Upload Milestone File", vi: "Tải lên file cho milestone" },
  "DELETE /api/contracts/:contractId/milestones/:milestoneId/files/:fileId": { en: "Delete Milestone File", vi: "Xóa file của milestone" },
  "GET /api/contracts/:contractId/files": { en: "View Contract Files", vi: "Xem danh sách tài liệu hợp đồng" },
  "POST /api/contracts/:contractId/files": { en: "Upload Contract File", vi: "Tải lên tài liệu hợp đồng" },
  "DELETE /api/contracts/:contractId/files/:fileId": { en: "Delete Contract File", vi: "Xóa tài liệu hợp đồng" },

  // DISPUTES
  "GET /api/disputes": { en: "View Dispute List", vi: "Xem danh sách tranh chấp" },
  "POST /api/disputes": { en: "Open Dispute", vi: "Mở tranh chấp mới" },
  "GET /api/disputes/:id": { en: "View Dispute Detail", vi: "Xem chi tiết tranh chấp" },
  "POST /api/disputes/:id/respond": { en: "Respond to Dispute", vi: "Phản hồi tranh chấp" },
  "POST /api/disputes/:id/response": { en: "Submit Dispute Response", vi: "Gửi phản hồi tranh chấp" },
  "POST /api/disputes/:id/review": { en: "Review Dispute", vi: "Xem xét tranh chấp" },
  "POST /api/disputes/:id/propose-resolution": { en: "Propose Dispute Resolution", vi: "Đề xuất giải pháp hòa giải" },
  "POST /api/disputes/:id/respond-resolution": { en: "Respond to Dispute Resolution", vi: "Phản hồi giải pháp hòa giải" },
  "GET /api/disputes/milestone/:milestoneId": { en: "View Dispute by Milestone", vi: "Xem tranh chấp theo milestone" },

  // PAYMENTS
  "POST /api/payments/connect-stripe": { en: "Connect Stripe Account", vi: "Liên kết tài khoản Stripe" },
  "GET /api/payments/history": { en: "View Payment History", vi: "Xem lịch sử thanh toán" },
  "GET /api/payments/history/:id": { en: "View Payment Detail", vi: "Xem chi tiết giao dịch thanh toán" },
  "GET /api/payments/payout-history": { en: "View Payout History", vi: "Xem lịch sử rút tiền" },
  "GET /api/payments/payout-history/:id": { en: "View Payout Detail", vi: "Xem chi tiết yêu cầu rút tiền" },
  "POST /api/payments/fund-milestone": { en: "Fund Milestone (Escrow)", vi: "Ký quỹ thanh toán milestone" },
  "POST /api/payments/release": { en: "Release Milestone Payment", vi: "Giải ngân thanh toán milestone" },
  "POST /api/payments/refund": { en: "Refund Milestone Payment", vi: "Hoàn tiền milestone" },
  "POST /api/payments/pay-platform-fee": { en: "Pay Platform Fee", vi: "Thanh toán phí sàn" },
  "POST /api/payments/pay-dispute-fee": { en: "Pay Dispute Fee", vi: "Thanh toán phí tranh chấp" },
  "POST /api/payments/dispute-resolution": { en: "Execute Dispute Payment", vi: "Thực hiện thanh toán hòa giải tranh chấp" },
  "POST /api/payments/stripe-webhook": { en: "Stripe Webhook Handler", vi: "Xử lý webhook Stripe" },
  "POST /api/payments/sync-intent": { en: "Sync Payment Intent Status", vi: "Đồng bộ trạng thái thanh toán Stripe" },
  "GET /api/payments/balance": { en: "View Account Balance", vi: "Xem số dư tài khoản" },
  "POST /api/payments/withdraw": { en: "Request Withdrawal", vi: "Tạo yêu cầu rút tiền" },
  "GET /api/payments/withdrawals": { en: "View Withdrawal List", vi: "Xem danh sách yêu cầu rút tiền" },
  "POST /api/payments/withdrawals/:withdrawalId/process": { en: "Process Withdrawal", vi: "Xử lý rút tiền" },
  "POST /api/payments/checkout-sessions/:sessionId/sync": { en: "Sync Checkout Session", vi: "Đồng bộ phiên thanh toán Checkout" },
  "POST /api/payments/connect/onboarding-link": { en: "Generate Stripe Onboarding Link", vi: "Tạo liên kết thiết lập tài khoản Stripe" },
  "GET /api/payments/connect/status": { en: "Check Stripe Connect Status", vi: "Kiểm tra trạng thái kết nối Stripe" },
  "POST /api/payments/contracts/:contractId/fund-hold/intent": { en: "Create Fund Hold Payment Intent", vi: "Tạo yêu cầu giữ tiền tạm thời cho hợp đồng" },
  "POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session": { en: "Create Milestone Fund Checkout Session", vi: "Tạo phiên thanh toán ký quỹ milestone" },
  "POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent": { en: "Create Milestone Fund Payment Intent", vi: "Tạo payment intent ký quỹ milestone" },
  "POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card": { en: "Fund Milestone with Saved Card", vi: "Ký quỹ milestone bằng thẻ đã lưu" },
  "POST /api/payments/contracts/:contractId/milestones/:milestoneId/refund": { en: "Refund Milestone Escrow", vi: "Hoàn tiền ký quỹ milestone" },
  "POST /api/payments/contracts/:contractId/milestones/:milestoneId/release": { en: "Release Milestone Escrow Payment", vi: "Giải ngân tiền ký quỹ milestone" },
  "POST /api/payments/customer-portal": { en: "Open Stripe Customer Portal", vi: "Mở cổng quản lý thanh toán Stripe" },
  "POST /api/payments/disputes/:disputeId/settle": { en: "Settle Dispute Payment", vi: "Thanh toán giải quyết tranh chấp" },
  "POST /api/payments/intents/:paymentIntentId/sync": { en: "Sync Payment Intent", vi: "Đồng bộ Payment Intent" },
  "GET /api/payments/payment-methods": { en: "View Saved Payment Methods", vi: "Xem phương thức thanh toán đã lưu" },
  "DELETE /api/payments/payment-methods/:paymentMethodId": { en: "Delete Payment Method", vi: "Xóa phương thức thanh toán" },
  "POST /api/payments/payment-methods/default": { en: "Set Default Payment Method", vi: "Đặt phương thức thanh toán mặc định" },
  "POST /api/payments/payment-methods/setup-intent": { en: "Create Setup Intent for Payment Method", vi: "Tạo setup intent liên kết thẻ" },
  "GET /api/payments/transactions": { en: "View Transactions List", vi: "Xem danh sách giao dịch" },
  "GET /api/payments/wallet": { en: "View Wallet Balance", vi: "Xem số dư ví điện tử" },
  "POST /api/payments/webhook": { en: "Process Payment Webhook", vi: "Xử lý webhook thanh toán" },
  "POST /api/payments/withdrawals": { en: "Create Withdrawal Request", vi: "Tạo yêu cầu rút tiền" },

  // JOBS & MANAGE JOBS
  "GET /api/jobs": { en: "Search / Browse Jobs", vi: "Tìm kiếm và duyệt việc làm" },
  "GET /api/jobs/:id": { en: "View Job Details", vi: "Xem chi tiết công việc" },
  "GET /api/jobs/:slug": { en: "View Job Details by Slug", vi: "Xem chi tiết việc làm theo slug" },
  "GET /api/job-categories": { en: "View Public Job Categories", vi: "Xem danh mục ngành nghề công việc" },
  "GET /api/job-categories/:slug": { en: "View Job Category by Slug", vi: "Xem danh mục công việc theo slug" },
  "GET /api/manage-jobs": { en: "View My Posted Jobs", vi: "Xem danh sách việc làm đã đăng" },
  "POST /api/manage-jobs": { en: "Post New Job", vi: "Đăng tin tuyển dụng mới" },
  "GET /api/manage-jobs/:id": { en: "View My Job Detail", vi: "Xem chi tiết việc làm đã đăng" },
  "PATCH /api/manage-jobs/:id": { en: "Update Job Post", vi: "Cập nhật tin tuyển dụng" },
  "DELETE /api/manage-jobs/:id": { en: "Delete / Close Job Post", vi: "Xóa / Đóng tin tuyển dụng" },
  "PATCH /api/manage-jobs/:id/status": { en: "Update Job Post Status", vi: "Cập nhật trạng thái tin tuyển dụng" },
  "PATCH /api/manage-jobs/:id/close": { en: "Close Job Post", vi: "Đóng tin tuyển dụng" },
  "PATCH /api/manage-jobs/:id/publish": { en: "Publish Job Post", vi: "Công khai tin tuyển dụng" },
  "PATCH /api/manage-jobs/:id/reopen": { en: "Reopen Job Post", vi: "Mở lại tin tuyển dụng" },
  "GET /api/manage-jobs/bookmarks": { en: "View Saved Jobs", vi: "Xem danh sách công việc đã lưu" },
  "POST /api/manage-jobs/bookmarks/:jobId": { en: "Bookmark / Save Job", vi: "Lưu công việc yêu thích" },
  "DELETE /api/manage-jobs/bookmarks/:jobId": { en: "Remove Saved Job", vi: "Bỏ lưu công việc" },
  "DELETE /api/manage-jobs/bookmarks/:slug": { en: "Remove Saved Job by Slug", vi: "Bỏ lưu việc làm theo slug" },
  "GET /api/manage-jobs/jobs/:slug/bookmark": { en: "Check Job Bookmark Status", vi: "Kiểm tra trạng thái lưu việc làm" },
  "POST /api/manage-jobs/jobs/:slug/bookmark": { en: "Bookmark Job by Slug", vi: "Lưu việc làm theo slug" },
  "GET /api/manage-jobs/skills": { en: "View Job Skills List", vi: "Xem danh sách kỹ năng công việc" },

  // PROPOSALS
  "GET /api/proposals": { en: "View My Proposals", vi: "Xem danh sách đề xuất của tôi" },
  "POST /api/proposals": { en: "Submit Proposal", vi: "Nộp báo giá / đề xuất nhận việc" },
  "GET /api/proposals/:id": { en: "View Proposal Detail", vi: "Xem chi tiết đề xuất" },
  "PATCH /api/proposals/:id": { en: "Update Proposal", vi: "Cập nhật đề xuất" },
  "DELETE /api/proposals/:id": { en: "Withdraw Proposal", vi: "Rút lại đề xuất" },
  "PATCH /api/proposals/:id/accept": { en: "Accept Proposal", vi: "Chấp nhận đề xuất" },
  "PATCH /api/proposals/:id/reject": { en: "Reject Proposal", vi: "Từ chối đề xuất" },
  "GET /api/proposals/:id/client": { en: "View Client Info for Proposal", vi: "Xem thông tin khách hàng cho đề xuất" },
  "PATCH /api/proposals/:id/draft": { en: "Update Proposal Draft", vi: "Cập nhật bản nháp đề xuất" },
  "PATCH /api/proposals/:id/interview": { en: "Invite Proposal to Interview", vi: "Mời phỏng vấn đề xuất" },
  "PATCH /api/proposals/:id/submit": { en: "Submit Proposal Draft", vi: "Nộp chính thức bản nháp đề xuất" },
  "PATCH /api/proposals/:id/withdraw": { en: "Withdraw Proposal", vi: "Rút lại đề xuất" },
  "POST /api/proposals/jobs/:jobId": { en: "Submit Proposal for Job", vi: "Nộp đề xuất cho công việc" },
  "POST /api/proposals/jobs/:jobId/drafts": { en: "Save Proposal Draft", vi: "Lưu nháp đề xuất cho công việc" },
  "GET /api/proposals/jobs/:jobId/mine": { en: "View My Proposal for Job", vi: "Xem đề xuất của tôi cho công việc" },
  "GET /api/proposals/jobs/:jobId/submitted": { en: "View Submitted Proposals for Job", vi: "Xem danh sách đề xuất đã nộp cho công việc" },
  "GET /api/proposals/my": { en: "View All My Proposals", vi: "Xem toàn bộ đề xuất của tôi" },
  "GET /api/jobs/:jobId/proposals": { en: "View Proposals for Job (Client)", vi: "Xem danh sách ứng viên nộp cho công việc" },

  // PROFILES (FREELANCER & CLIENT)
  "GET /api/clients/:id": { en: "View Client Profile", vi: "Xem hồ sơ Client" },
  "GET /api/clients/:userId": { en: "View Client Profile by User ID", vi: "Xem hồ sơ Client theo User ID" },
  "PUT /api/clients/:id": { en: "Update Client Profile", vi: "Cập nhật hồ sơ Client" },
  "PUT /api/clients/me/profile": { en: "Update My Client Profile", vi: "Cập nhật hồ sơ Client của tôi" },
  "GET /api/profiles/:id": { en: "View Freelancer Profile", vi: "Xem hồ sơ Freelancer" },
  "PUT /api/profiles/:id": { en: "Update Freelancer Profile", vi: "Cập nhật hồ sơ Freelancer" },
  "POST /api/profiles/:id/cv": { en: "Upload CV", vi: "Tải lên CV" },
  "DELETE /api/profiles/:id/cv": { en: "Delete CV", vi: "Xóa CV" },
  "POST /api/profiles/:id/cv/analyze": { en: "Analyze CV with AI", vi: "Phân tích CV bằng AI" },
  "GET /api/profiles/:id/cv/analysis": { en: "View CV Analysis", vi: "Xem kết quả phân tích CV" },
  "POST /api/profiles/:id/cv/analysis/:analysisId/confirm": { en: "Confirm CV Extraction", vi: "Xác nhận trích xuất thông tin CV" },
  "POST /api/profiles/:id/cv/analysis/:analysisId/discard": { en: "Discard CV Extraction", vi: "Hủy kết quả phân tích CV" },
  "GET /api/profiles/:id/cv/file": { en: "Download CV File", vi: "Tải file CV" },
  "GET /api/profiles/:id/portfolios": { en: "View Freelancer Portfolios", vi: "Xem danh sách dự án Portfolio" },
  "POST /api/profiles/:id/portfolios": { en: "Add Portfolio Item", vi: "Thêm dự án Portfolio mới" },
  "GET /api/profiles/portfolios/:id": { en: "View Portfolio Item Detail", vi: "Xem chi tiết dự án Portfolio" },
  "PUT /api/profiles/portfolios/:id": { en: "Update Portfolio Item", vi: "Cập nhật dự án Portfolio" },
  "DELETE /api/profiles/portfolios/:id": { en: "Delete Portfolio Item", vi: "Xóa dự án Portfolio" },
  "GET /api/profiles/:id/skills": { en: "View Freelancer Skills", vi: "Xem kỹ năng của Freelancer" },
  "POST /api/profiles/:id/skills": { en: "Add Freelancer Skill", vi: "Thêm kỹ năng cho Freelancer" },
  "DELETE /api/profiles/skills/:id": { en: "Delete Freelancer Skill", vi: "Xóa kỹ năng khỏi hồ sơ" },
  "GET /api/profiles/skills/suggestions": { en: "Get Skill Suggestions", vi: "Lấy gợi ý kỹ năng" },

  // EXPERTS
  "GET /api/expert-profile/me": { en: "View My Expert Profile", vi: "Xem hồ sơ Expert của tôi" },
  "PUT /api/expert-profile/me": { en: "Update My Expert Profile", vi: "Cập nhật hồ sơ Expert của tôi" },
  "GET /api/experts": { en: "Browse Experts", vi: "Duyệt danh sách chuyên gia (Expert)" },
  "GET /api/experts/:id": { en: "View Expert Detail", vi: "Xem chi tiết chuyên gia" },
  "GET /api/profile-revisions/me": { en: "View My Profile Revisions", vi: "Xem lịch sử duyệt hồ sơ Expert của tôi" },

  // NOTIFICATIONS
  "GET /api/notifications": { en: "View Notifications", vi: "Xem danh sách thông báo" },
  "GET /api/notifications/unread-count": { en: "Get Unread Count", vi: "Đếm số thông báo chưa đọc" },
  "PATCH /api/notifications/:id/read": { en: "Mark Notification Read", vi: "Đánh dấu thông báo đã đọc" },
  "PATCH /api/notifications/read-all": { en: "Mark All Read", vi: "Đánh dấu tất cả thông báo đã đọc" },
  "DELETE /api/notifications/:id": { en: "Delete Notification", vi: "Xóa thông báo" },

  // CONVERSATIONS
  "GET /api/conversations": { en: "View Conversation List", vi: "Xem danh sách cuộc hội thoại" },
  "POST /api/conversations": { en: "Start Conversation", vi: "Bắt đầu cuộc trò chuyện mới" },
  "GET /api/conversations/:id": { en: "View Conversation Detail", vi: "Xem chi tiết cuộc trò chuyện" },
  "PATCH /api/conversations/:id/hide": { en: "Hide Conversation", vi: "Ẩn cuộc trò chuyện" },
  "PATCH /api/conversations/:id/pin": { en: "Pin / Unpin Conversation", vi: "Ghim / Bỏ ghim cuộc trò chuyện" },
  "PATCH /api/conversations/:id/read": { en: "Mark Conversation Read", vi: "Đánh dấu tin nhắn đã đọc" },
  "GET /api/conversations/:id/messages": { en: "View Messages", vi: "Xem danh sách tin nhắn" },
  "POST /api/conversations/:id/messages": { en: "Send Message", vi: "Gửi tin nhắn" },
  "DELETE /api/conversations/:id/messages/:messageId": { en: "Delete Message", vi: "Xóa tin nhắn" },
  "POST /api/conversations/:id/files": { en: "Upload Chat File Attachment", vi: "Tải file đính kèm trong chat" },

  // REVIEWS
  "GET /api/reviews": { en: "View Review List", vi: "Xem danh sách đánh giá" },
  "POST /api/reviews": { en: "Submit Review", vi: "Gửi đánh giá" },
  "GET /api/reviews/:id": { en: "View Review Detail", vi: "Xem chi tiết đánh giá" },
  "GET /api/reviews/:reviewId": { en: "View Review Detail", vi: "Xem chi tiết đánh giá" },
  "PATCH /api/reviews/:id": { en: "Update Review", vi: "Cập nhật đánh giá" },
  "PATCH /api/reviews/:reviewId": { en: "Update Review", vi: "Cập nhật đánh giá" },
  "DELETE /api/reviews/:id": { en: "Delete Review", vi: "Xóa đánh giá" },
  "DELETE /api/reviews/:reviewId": { en: "Delete Review", vi: "Xóa đánh giá" },
  "POST /api/reviews/:id/responses": { en: "Reply to Review", vi: "Phản hồi đánh giá" },
  "POST /api/reviews/:reviewId/response": { en: "Submit Review Response", vi: "Gửi phản hồi đánh giá" },
  "GET /api/reviews/contracts/:contractId": { en: "View Contract Reviews", vi: "Xem đánh giá của hợp đồng" },
  "POST /api/reviews/contracts/:contractId": { en: "Review Contract", vi: "Đánh giá hợp đồng" },
  "DELETE /api/reviews/responses/:responseId": { en: "Delete Review Response", vi: "Xóa phản hồi đánh giá" },
  "PATCH /api/reviews/responses/:responseId": { en: "Update Review Response", vi: "Cập nhật phản hồi đánh giá" },

  // SAVED SEARCHES & JOB ALERTS
  "GET /api/saved-searches": { en: "View Saved Searches", vi: "Xem danh sách tìm kiếm đã lưu" },
  "POST /api/saved-searches": { en: "Save Search Query", vi: "Lưu tiêu chí tìm kiếm" },
  "GET /api/saved-searches/:id": { en: "View Saved Search Detail", vi: "Xem chi tiết tìm kiếm đã lưu" },
  "PATCH /api/saved-searches/:id": { en: "Update Saved Search", vi: "Cập nhật tìm kiếm đã lưu" },
  "DELETE /api/saved-searches/:id": { en: "Delete Saved Search", vi: "Xóa tìm kiếm đã lưu" },
  "GET /api/job-alerts": { en: "View Job Alerts", vi: "Xem thông báo việc làm" },
  "POST /api/job-alerts": { en: "Create Job Alert", vi: "Tạo thông báo việc làm mới" },
  "GET /api/job-alerts/:id": { en: "View Job Alert Detail", vi: "Xem chi tiết thông báo việc làm" },
  "GET /api/job-alerts/:id/matching-jobs": { en: "View Matching Jobs for Alert", vi: "Xem việc làm phù hợp với thông báo" },
  "PATCH /api/job-alerts/:id": { en: "Update Job Alert", vi: "Cập nhật thông báo việc làm" },
  "DELETE /api/job-alerts/:id": { en: "Delete Job Alert", vi: "Xóa thông báo việc làm" },

  // FAVORITES & FOLLOWING
  "GET /api/favorites/freelancers": { en: "View Favorite Freelancers", vi: "Xem danh sách Freelancer yêu thích" },
  "POST /api/favorites/freelancers/:freelancerId": { en: "Add Favorite Freelancer", vi: "Thêm Freelancer vào yêu thích" },
  "DELETE /api/favorites/freelancers/:freelancerId": { en: "Remove Favorite Freelancer", vi: "Bỏ Freelancer khỏi yêu thích" },
  "GET /api/following/freelancers": { en: "View Followed Freelancers", vi: "Xem danh sách Freelancer đang theo dõi" },
  "GET /api/following/freelancers/discover": { en: "Discover Freelancers to Follow", vi: "Gợi ý Freelancer để theo dõi" },
  "POST /api/following/freelancers/:freelancerId": { en: "Follow Freelancer", vi: "Theo dõi Freelancer" },
  "DELETE /api/following/freelancers/:freelancerId": { en: "Unfollow Freelancer", vi: "Bỏ theo dõi Freelancer" },

  // SOCIAL LINKS
  "GET /api/social-links": { en: "View Social Links", vi: "Xem danh sách liên kết mạng xã hội" },
  "POST /api/social-links": { en: "Add Social Link", vi: "Thêm liên kết mạng xã hội" },
  "DELETE /api/social-links/:id": { en: "Delete Social Link", vi: "Xóa liên kết mạng xã hội" },

  // RECOMMENDATIONS
  "GET /api/recommendations/jobs": { en: "Get Recommended Jobs", vi: "Xem danh sách việc làm gợi ý" },
  "GET /api/recommendations/freelancers": { en: "Get Recommended Freelancers", vi: "Xem danh sách ứng viên gợi ý" },
  "POST /api/recommendations/reindex": { en: "Reindex Recommendations (Admin)", vi: "Đánh chỉ mục lại hệ thống gợi ý (Admin)" },
  "POST /api/recommendations/outbox/process": { en: "Process Recommendation Queue", vi: "Xử lý hàng đợi gợi ý AI" },
  "POST /api/recommendations/:id/feedback": { en: "Submit Recommendation Feedback", vi: "Gửi phản hồi về kết quả gợi ý" },
  "GET /api/recommendations/:id/explanation": { en: "View Recommendation Explanation", vi: "Xem giải thích lý do gợi ý" },

  // BANNERS (PUBLIC)
  "GET /api/banners": { en: "View Active Public Banners", vi: "Xem banner quảng cáo đang hoạt động" },
  "GET /api/banners/image/:filename": { en: "View Banner Image File", vi: "Xem file hình ảnh banner" },
};

/**
 * Normalizes a route path for lookup in PERMISSION_MAP.
 * e.g. /api/roles/123 -> /api/roles/:id
 */
export function normalizePermissionPath(path: string): string {
  let normalized = path.replace(/\/+/g, "/").replace(/\/$/, "");
  if (!normalized.startsWith("/api")) {
    normalized = `/api${normalized.startsWith("/") ? "" : "/"}${normalized}`;
  }
  return normalized;
}

/**
 * Retrieves the permission descriptor (en/vi) for a given HTTP method and route path.
 */
export function getPermissionDescriptor(
  method: string,
  path: string,
): PermissionDescriptor | undefined {
  const normMethod = method.toUpperCase();
  const normPath = normalizePermissionPath(path);

  // Direct match
  const directKey = `${normMethod} ${normPath}`;
  if (PERMISSION_MAP[directKey]) {
    return PERMISSION_MAP[directKey];
  }

  // Parameterized match: replace numeric IDs with :id or parameter pattern
  // e.g. /api/roles/15 -> /api/roles/:id
  const segments = normPath.split("/");
  for (const [key, desc] of Object.entries(PERMISSION_MAP)) {
    const [m, p] = key.split(" ");
    if (m !== normMethod) continue;
    const keySegments = p.split("/");
    if (keySegments.length !== segments.length) continue;

    let match = true;
    for (let i = 0; i < segments.length; i++) {
      if (keySegments[i].startsWith(":")) continue;
      if (keySegments[i] !== segments[i]) {
        match = false;
        break;
      }
    }
    if (match) return desc;
  }

  return undefined;
}

/**
 * Intelligent fallback generator when a route is not explicitly mapped.
 */
export function getPermissionFallbackName(
  method: string,
  path: string,
  locale: string = "vi",
): string {
  const segments = path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const resource = segments[0] || "chức năng";
  const isDetail = segments.some((s) => s.startsWith(":") || /^\d+$/.test(s));

  if (locale === "vi") {
    switch (method.toUpperCase()) {
      case HttpMethod.GET:
        return isDetail ? `Xem chi tiết ${resource}` : `Xem danh sách ${resource}`;
      case HttpMethod.POST:
        return `Tạo mới / Thực hiện ${resource}`;
      case HttpMethod.PUT:
      case HttpMethod.PATCH:
        return `Cập nhật ${resource}`;
      case HttpMethod.DELETE:
        return `Xóa ${resource}`;
      default:
        return `${method} ${path}`;
    }
  }

  switch (method.toUpperCase()) {
    case HttpMethod.GET:
      return isDetail ? `View ${resource} Detail` : `View ${resource} List`;
    case HttpMethod.POST:
      return `Create / Execute ${resource}`;
    case HttpMethod.PUT:
    case HttpMethod.PATCH:
      return `Update ${resource}`;
    case HttpMethod.DELETE:
      return `Delete ${resource}`;
    default:
      return `${method} ${path}`;
  }
}

/**
 * Returns a human-friendly permission name for the specified method, path, and locale.
 */
export function getPermissionName(
  method: string,
  path: string,
  locale: string = "vi",
): string {
  const desc = getPermissionDescriptor(method, path);
  if (desc) {
    return locale === "vi" ? desc.vi : desc.en;
  }
  return getPermissionFallbackName(method, path, locale);
}

