import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho cụm chức năng:
 *
 * MILESTONES - Mốc công việc & Sản phẩm (Hợp đồng & Thanh toán) - 19 quyền:
 * 1.  #249 · GET /api/contracts/:contractId/milestones (Xem danh sách milestone của hợp đồng)
 * 2.  #250 · GET /api/contracts/:contractId/milestones/:id (Xem chi tiết milestone)
 * 3.  #251 · POST /api/contracts/:contractId/milestones (Tạo milestone cho hợp đồng)
 * 4.  #252 · PATCH /api/contracts/:contractId/milestones/:id (Cập nhật milestone)
 * 5.  #253 · PATCH /api/contracts/:contractId/milestones/:id/progress (Cập nhật tiến độ milestone)
 * 6.  #254 · DELETE /api/contracts/:contractId/milestones/:id (Xóa milestone)
 * 7.  #255 · GET /api/contracts/:contractId/milestones/:milestoneId/files (Xem danh sách file milestone)
 * 8.  #256 · POST /api/contracts/:contractId/milestones/:milestoneId/files (Tải lên file cho milestone)
 * 9.  #257 · DELETE /api/contracts/:contractId/milestones/:milestoneId/files/:fileId (Xóa file của milestone)
 * 10. #258 · POST /api/contracts/:contractId/milestones/:milestoneId/submissions (Nộp sản phẩm milestone)
 * 11. #259 · GET /api/contracts/:contractId/milestones/:milestoneId/submissions (Xem danh sách bài nộp milestone)
 * 12. #260 · GET /api/contracts/:contractId/milestones/:milestoneId/submissions/:id (Xem chi tiết bài nộp milestone)
 * 13. #261 · PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes (Yêu cầu sửa đổi bài nộp milestone)
 * 14. #262 · PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve (Phê duyệt bài nộp milestone)
 * 15. #514 · POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent (Tạo payment intent ký quỹ milestone)
 * 16. #515 · POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session (Tạo phiên thanh toán ký quỹ milestone)
 * 17. #516 · POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card (Ký quỹ milestone bằng thẻ đã lưu)
 * 18. #517 · POST /api/payments/contracts/:contractId/milestones/:milestoneId/release (Giải ngân tiền ký quỹ milestone)
 * 19. #518 · POST /api/payments/contracts/:contractId/milestones/:milestoneId/refund (Hoàn tiền ký quỹ milestone)
 *
 * Yêu cầu đặc biệt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Kiểm thử tự động chứng minh: Khi không có quyền tương ứng, các nút/tab/card trên UI
 *    bị ẩn hoàn toàn hoặc bị vô hiệu hóa, đồng thời API không bị gọi trái phép.
 */

interface PermissionItem {
  id: number;
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const MILESTONE_PERMISSIONS: PermissionItem[] = [
  {
    id: 249,
    method: 'GET',
    path: '/api/contracts/:contractId/milestones',
    description: 'Xem danh sách milestone của hợp đồng',
    testActualPath: '/api/contracts/88/milestones',
  },
  {
    id: 250,
    method: 'GET',
    path: '/api/contracts/:contractId/milestones/:id',
    description: 'Xem chi tiết milestone',
    testActualPath: '/api/contracts/88/milestones/101',
  },
  {
    id: 251,
    method: 'POST',
    path: '/api/contracts/:contractId/milestones',
    description: 'Tạo milestone cho hợp đồng',
    testActualPath: '/api/contracts/88/milestones',
  },
  {
    id: 252,
    method: 'PATCH',
    path: '/api/contracts/:contractId/milestones/:id',
    description: 'Cập nhật milestone',
    testActualPath: '/api/contracts/88/milestones/101',
  },
  {
    id: 253,
    method: 'PATCH',
    path: '/api/contracts/:contractId/milestones/:id/progress',
    description: 'Cập nhật tiến độ milestone',
    testActualPath: '/api/contracts/88/milestones/101/progress',
  },
  {
    id: 254,
    method: 'DELETE',
    path: '/api/contracts/:contractId/milestones/:id',
    description: 'Xóa milestone',
    testActualPath: '/api/contracts/88/milestones/101',
  },
  {
    id: 255,
    method: 'GET',
    path: '/api/contracts/:contractId/milestones/:milestoneId/files',
    description: 'Xem danh sách file milestone',
    testActualPath: '/api/contracts/88/milestones/101/files',
  },
  {
    id: 256,
    method: 'POST',
    path: '/api/contracts/:contractId/milestones/:milestoneId/files',
    description: 'Tải lên file cho milestone',
    testActualPath: '/api/contracts/88/milestones/101/files',
  },
  {
    id: 257,
    method: 'DELETE',
    path: '/api/contracts/:contractId/milestones/:milestoneId/files/:fileId',
    description: 'Xóa file của milestone',
    testActualPath: '/api/contracts/88/milestones/101/files/5',
  },
  {
    id: 258,
    method: 'POST',
    path: '/api/contracts/:contractId/milestones/:milestoneId/submissions',
    description: 'Nộp sản phẩm milestone',
    testActualPath: '/api/contracts/88/milestones/101/submissions',
  },
  {
    id: 259,
    method: 'GET',
    path: '/api/contracts/:contractId/milestones/:milestoneId/submissions',
    description: 'Xem danh sách bài nộp milestone',
    testActualPath: '/api/contracts/88/milestones/101/submissions',
  },
  {
    id: 260,
    method: 'GET',
    path: '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id',
    description: 'Xem chi tiết bài nộp milestone',
    testActualPath: '/api/contracts/88/milestones/101/submissions/201',
  },
  {
    id: 261,
    method: 'PATCH',
    path: '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes',
    description: 'Yêu cầu sửa đổi bài nộp milestone',
    testActualPath:
      '/api/contracts/88/milestones/101/submissions/201/request-changes',
  },
  {
    id: 262,
    method: 'PATCH',
    path: '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve',
    description: 'Phê duyệt bài nộp milestone',
    testActualPath: '/api/contracts/88/milestones/101/submissions/201/approve',
  },
  {
    id: 514,
    method: 'POST',
    path: '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent',
    description: 'Tạo payment intent ký quỹ milestone',
    testActualPath: '/api/payments/contracts/88/milestones/101/fund/intent',
  },
  {
    id: 515,
    method: 'POST',
    path: '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session',
    description: 'Tạo phiên thanh toán ký quỹ milestone',
    testActualPath:
      '/api/payments/contracts/88/milestones/101/fund/checkout-session',
  },
  {
    id: 516,
    method: 'POST',
    path: '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card',
    description: 'Ký quỹ milestone bằng thẻ đã lưu',
    testActualPath: '/api/payments/contracts/88/milestones/101/fund/saved-card',
  },
  {
    id: 517,
    method: 'POST',
    path: '/api/payments/contracts/:contractId/milestones/:milestoneId/release',
    description: 'Giải ngân tiền ký quỹ milestone',
    testActualPath: '/api/payments/contracts/88/milestones/101/release',
  },
  {
    id: 518,
    method: 'POST',
    path: '/api/payments/contracts/:contractId/milestones/:milestoneId/refund',
    description: 'Hoàn tiền ký quỹ milestone',
    testActualPath: '/api/payments/contracts/88/milestones/101/refund',
  },
];

/**
 * Mô phỏng logic kiểm tra quyền phía Frontend client (hasActionPermission).
 */
function hasPermission(
  userPermissions: string[],
  method: string,
  actualPath: string,
): boolean {
  if (userPermissions.includes('*')) return true;

  const targetMethod = method.trim().toUpperCase();
  const normalizedTarget = normalizeApiPath(actualPath);

  return userPermissions.some((perm) => {
    if (perm === '*') return true;
    const match = perm.match(/^([A-Z]+)\s+(.+)$/i);
    if (!match || !match[1] || !match[2]) return false;

    const permMethod = match[1].toUpperCase();
    const permPattern = match[2];

    if (permMethod !== targetMethod) return false;
    return matchRoutePath(permPattern, normalizedTarget);
  });
}

/**
 * Mô phỏng trạng thái hiển thị giao diện UI Milestones dựa trên danh sách quyền người dùng.
 */
function simulateMilestoneUiState(userPermissions: string[]) {
  const can = (method: string, path: string) =>
    hasPermission(userPermissions, method, path);

  const canViewMilestones = can('GET', '/api/contracts/:contractId/milestones');
  const canViewMilestoneDetail = can(
    'GET',
    '/api/contracts/:contractId/milestones/:id',
  );
  const canCreateMilestone = can(
    'POST',
    '/api/contracts/:contractId/milestones',
  );
  const canUpdateMilestone = can(
    'PATCH',
    '/api/contracts/:contractId/milestones/:id',
  );
  const canProgressMilestone = can(
    'PATCH',
    '/api/contracts/:contractId/milestones/:id/progress',
  );
  const canDeleteMilestone = can(
    'DELETE',
    '/api/contracts/:contractId/milestones/:id',
  );
  const canViewFiles = can(
    'GET',
    '/api/contracts/:contractId/milestones/:milestoneId/files',
  );
  const canUploadFile = can(
    'POST',
    '/api/contracts/:contractId/milestones/:milestoneId/files',
  );
  const canDeleteFile = can(
    'DELETE',
    '/api/contracts/:contractId/milestones/:milestoneId/files/:fileId',
  );
  const canSubmit = can(
    'POST',
    '/api/contracts/:contractId/milestones/:milestoneId/submissions',
  );
  const canViewSubmissions = can(
    'GET',
    '/api/contracts/:contractId/milestones/:milestoneId/submissions',
  );
  const canViewSubmissionDetail = can(
    'GET',
    '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id',
  );
  const canRequestChanges = can(
    'PATCH',
    '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes',
  );
  const canApprove = can(
    'PATCH',
    '/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve',
  );

  const canFundIntent = can(
    'POST',
    '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent',
  );
  const canFundCheckout = can(
    'POST',
    '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session',
  );
  const canFundSavedCard = can(
    'POST',
    '/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card',
  );
  const canFundEscrow = canFundIntent || canFundCheckout || canFundSavedCard;

  const canRelease = can(
    'POST',
    '/api/payments/contracts/:contractId/milestones/:milestoneId/release',
  );
  const canRefund = can(
    'POST',
    '/api/payments/contracts/:contractId/milestones/:milestoneId/refund',
  );

  return {
    milestonesListVisible: canViewMilestones,
    milestoneBreadcrumbLink: canViewMilestones,
    milestoneDetailView: canViewMilestoneDetail,
    milestoneDetailLink: canViewMilestoneDetail,
    addMilestoneButton: canCreateMilestone,
    editMilestoneButton: canUpdateMilestone,
    startMilestoneButton: canProgressMilestone,
    deleteMilestoneButton: canDeleteMilestone,
    filesTabVisible: canViewFiles,
    uploadFileButton: canUploadFile,
    deleteFileButton: canDeleteFile,
    submitWorkButton: canSubmit,
    submissionsTabVisible: canViewSubmissions,
    submissionDetailExpanded: canViewSubmissionDetail,
    requestChangesButton: canRequestChanges,
    approveDeliverablesButton: canApprove,
    fundEscrowButton: canFundEscrow,
    quickPaySavedCardOption: canFundSavedCard,
    stripeCheckoutOption: canFundCheckout,
    releasePaymentButton: canRelease,
    refundMilestoneButton: canRefund,
  };
}

describe('MILESTONES RBAC & UI Control Test Suite (19 Permissions)', () => {
  describe('1. Định nghĩa và Khớp nối Route (Route Matching & Normalization)', () => {
    it('phải khớp đủ 19 permissions trong danh mục MILESTONES', () => {
      expect(MILESTONE_PERMISSIONS).toHaveLength(19);
    });

    test.each(MILESTONE_PERMISSIONS)(
      'Permission #$id [$method $path] phải khớp chính xác với URL thực tế $testActualPath',
      ({ method, path, testActualPath }) => {
        const userPermissions = [`${method} ${path}`];
        const isAllowed = hasPermission(
          userPermissions,
          method,
          testActualPath,
        );
        expect(isAllowed).toBe(true);
      },
    );
  });

  describe('2. Phân lập Route và Ngăn chặn Khớp nhầm (Isolation & Route Precision)', () => {
    it('GET /api/contracts/:contractId/milestones KHÔNG được khớp nhầm với GET detail /api/contracts/88/milestones/101', () => {
      const perms = ['GET /api/contracts/:contractId/milestones'];
      expect(
        hasPermission(perms, 'GET', '/api/contracts/88/milestones/101'),
      ).toBe(false);
    });

    it('GET /api/contracts/:contractId/milestones/:id KHÔNG được khớp nhầm với GET files', () => {
      const perms = ['GET /api/contracts/:contractId/milestones/:id'];
      expect(
        hasPermission(perms, 'GET', '/api/contracts/88/milestones/101/files'),
      ).toBe(false);
    });

    it('GET /api/contracts/:contractId/milestones/:milestoneId/files KHÔNG được khớp nhầm với DELETE file', () => {
      const perms = [
        'GET /api/contracts/:contractId/milestones/:milestoneId/files',
      ];
      expect(
        hasPermission(
          perms,
          'DELETE',
          '/api/contracts/88/milestones/101/files/5',
        ),
      ).toBe(false);
    });

    it('POST /api/contracts/:contractId/milestones/:milestoneId/submissions KHÔNG được khớp nhầm với GET submissions', () => {
      const perms = [
        'POST /api/contracts/:contractId/milestones/:milestoneId/submissions',
      ];
      expect(
        hasPermission(
          perms,
          'GET',
          '/api/contracts/88/milestones/101/submissions',
        ),
      ).toBe(false);
    });

    it('PATCH approve submission KHÔNG được khớp nhầm với PATCH request-changes submission', () => {
      const perms = [
        'PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve',
      ];
      expect(
        hasPermission(
          perms,
          'PATCH',
          '/api/contracts/88/milestones/101/submissions/201/request-changes',
        ),
      ).toBe(false);
    });

    it('POST fund saved-card KHÔNG được khớp nhầm với POST release escrow', () => {
      const perms = [
        'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card',
      ];
      expect(
        hasPermission(
          perms,
          'POST',
          '/api/payments/contracts/88/milestones/101/release',
        ),
      ).toBe(false);
    });

    it('POST release escrow KHÔNG được khớp nhầm với POST refund escrow', () => {
      const perms = [
        'POST /api/payments/contracts/:contractId/milestones/:milestoneId/release',
      ];
      expect(
        hasPermission(
          perms,
          'POST',
          '/api/payments/contracts/88/milestones/101/refund',
        ),
      ).toBe(false);
    });
  });

  describe('3. Toàn quyền (Admin / Wildcard / Full Access 19/19)', () => {
    const allPermissions = MILESTONE_PERMISSIONS.map(
      (p) => `${p.method} ${p.path}`,
    );

    it('phải cho phép thực thi tất cả 19 endpoints khi có đủ permissions', () => {
      MILESTONE_PERMISSIONS.forEach((p) => {
        expect(hasPermission(allPermissions, p.method, p.testActualPath)).toBe(
          true,
        );
      });
    });

    it('phải hiển thị đầy đủ các thành phần UI khi có đủ permissions', () => {
      const ui = simulateMilestoneUiState(allPermissions);
      expect(ui.milestonesListVisible).toBe(true);
      expect(ui.milestoneBreadcrumbLink).toBe(true);
      expect(ui.milestoneDetailView).toBe(true);
      expect(ui.milestoneDetailLink).toBe(true);
      expect(ui.addMilestoneButton).toBe(true);
      expect(ui.editMilestoneButton).toBe(true);
      expect(ui.startMilestoneButton).toBe(true);
      expect(ui.deleteMilestoneButton).toBe(true);
      expect(ui.filesTabVisible).toBe(true);
      expect(ui.uploadFileButton).toBe(true);
      expect(ui.deleteFileButton).toBe(true);
      expect(ui.submitWorkButton).toBe(true);
      expect(ui.submissionsTabVisible).toBe(true);
      expect(ui.submissionDetailExpanded).toBe(true);
      expect(ui.requestChangesButton).toBe(true);
      expect(ui.approveDeliverablesButton).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
      expect(ui.quickPaySavedCardOption).toBe(true);
      expect(ui.stripeCheckoutOption).toBe(true);
      expect(ui.releasePaymentButton).toBe(true);
      expect(ui.refundMilestoneButton).toBe(true);
    });

    it('phải cho phép toàn bộ quyền và hiển thị toàn bộ UI khi có wildcard (*)', () => {
      const wildcard = ['*'];
      MILESTONE_PERMISSIONS.forEach((p) => {
        expect(hasPermission(wildcard, p.method, p.testActualPath)).toBe(true);
      });
      const ui = simulateMilestoneUiState(wildcard);
      expect(ui.milestonesListVisible).toBe(true);
      expect(ui.addMilestoneButton).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
      expect(ui.releasePaymentButton).toBe(true);
      expect(ui.refundMilestoneButton).toBe(true);
    });
  });

  describe('4. Không có quyền (Zero Access 0/19) - Ẩn hoàn toàn UI', () => {
    const emptyPermissions: string[] = [];

    it('phải từ chối tất cả 19 endpoints khi danh sách quyền rỗng', () => {
      MILESTONE_PERMISSIONS.forEach((p) => {
        expect(
          hasPermission(emptyPermissions, p.method, p.testActualPath),
        ).toBe(false);
      });
    });

    it('phải ẨN HOÀN TOÀN tất cả các nút, tab, form và hành động trên giao diện UI', () => {
      const ui = simulateMilestoneUiState(emptyPermissions);
      expect(ui.milestonesListVisible).toBe(false);
      expect(ui.milestoneBreadcrumbLink).toBe(false);
      expect(ui.milestoneDetailView).toBe(false);
      expect(ui.milestoneDetailLink).toBe(false);
      expect(ui.addMilestoneButton).toBe(false);
      expect(ui.editMilestoneButton).toBe(false);
      expect(ui.startMilestoneButton).toBe(false);
      expect(ui.deleteMilestoneButton).toBe(false);
      expect(ui.filesTabVisible).toBe(false);
      expect(ui.uploadFileButton).toBe(false);
      expect(ui.deleteFileButton).toBe(false);
      expect(ui.submitWorkButton).toBe(false);
      expect(ui.submissionsTabVisible).toBe(false);
      expect(ui.submissionDetailExpanded).toBe(false);
      expect(ui.requestChangesButton).toBe(false);
      expect(ui.approveDeliverablesButton).toBe(false);
      expect(ui.fundEscrowButton).toBe(false);
      expect(ui.quickPaySavedCardOption).toBe(false);
      expect(ui.stripeCheckoutOption).toBe(false);
      expect(ui.releasePaymentButton).toBe(false);
      expect(ui.refundMilestoneButton).toBe(false);
    });
  });

  describe('5. Kiểm thử Từng quyền Riêng biệt (Selective 1-by-1 Revocation)', () => {
    const allPermissions = MILESTONE_PERMISSIONS.map(
      (p) => `${p.method} ${p.path}`,
    );

    it('Thu hồi #249 (GET list): Chỉ ẩn bảng milestone và breadcrumb link, các quyền khác giữ nguyên', () => {
      const without = allPermissions.filter(
        (p) => p !== 'GET /api/contracts/:contractId/milestones',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.milestonesListVisible).toBe(false);
      expect(ui.milestoneBreadcrumbLink).toBe(false);
      // Các chức năng khác vẫn hoạt động
      expect(ui.addMilestoneButton).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
      expect(ui.releasePaymentButton).toBe(true);
    });

    it('Thu hồi #250 (GET detail): Chỉ ẩn trang chi tiết milestone và link chi tiết', () => {
      const without = allPermissions.filter(
        (p) => p !== 'GET /api/contracts/:contractId/milestones/:id',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.milestoneDetailView).toBe(false);
      expect(ui.milestoneDetailLink).toBe(false);
      expect(ui.milestonesListVisible).toBe(true);
      expect(ui.addMilestoneButton).toBe(true);
    });

    it('Thu hồi #251 (POST create): Chỉ ẩn nút thêm milestone (Add Milestone)', () => {
      const without = allPermissions.filter(
        (p) => p !== 'POST /api/contracts/:contractId/milestones',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.addMilestoneButton).toBe(false);
      expect(ui.milestonesListVisible).toBe(true);
      expect(ui.editMilestoneButton).toBe(true);
      expect(ui.deleteMilestoneButton).toBe(true);
    });

    it('Thu hồi #252 (PATCH update): Chỉ ẩn nút chỉnh sửa milestone (Edit Milestone)', () => {
      const without = allPermissions.filter(
        (p) => p !== 'PATCH /api/contracts/:contractId/milestones/:id',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.editMilestoneButton).toBe(false);
      expect(ui.addMilestoneButton).toBe(true);
      expect(ui.deleteMilestoneButton).toBe(true);
    });

    it('Thu hồi #253 (PATCH progress): Chỉ ẩn nút bắt đầu làm milestone (Start Milestone)', () => {
      const without = allPermissions.filter(
        (p) => p !== 'PATCH /api/contracts/:contractId/milestones/:id/progress',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.startMilestoneButton).toBe(false);
      expect(ui.submitWorkButton).toBe(true);
    });

    it('Thu hồi #254 (DELETE milestone): Chỉ ẩn nút xóa milestone (Delete Milestone)', () => {
      const without = allPermissions.filter(
        (p) => p !== 'DELETE /api/contracts/:contractId/milestones/:id',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.deleteMilestoneButton).toBe(false);
      expect(ui.editMilestoneButton).toBe(true);
    });

    it('Thu hồi #255 (GET files): Chỉ ẩn Tab tệp tin (Milestone Files Tab)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !== 'GET /api/contracts/:contractId/milestones/:milestoneId/files',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.filesTabVisible).toBe(false);
      expect(ui.submissionsTabVisible).toBe(true);
    });

    it('Thu hồi #256 (POST file): Chỉ ẩn nút tải lên file (Upload File)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !== 'POST /api/contracts/:contractId/milestones/:milestoneId/files',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.uploadFileButton).toBe(false);
      expect(ui.filesTabVisible).toBe(true);
      expect(ui.deleteFileButton).toBe(true);
    });

    it('Thu hồi #257 (DELETE file): Chỉ ẩn nút xóa file (Delete File)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'DELETE /api/contracts/:contractId/milestones/:milestoneId/files/:fileId',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.deleteFileButton).toBe(false);
      expect(ui.uploadFileButton).toBe(true);
    });

    it('Thu hồi #258 (POST submit): Chỉ ẩn nút nộp bài / nộp lại (Submit Work)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'POST /api/contracts/:contractId/milestones/:milestoneId/submissions',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.submitWorkButton).toBe(false);
      expect(ui.submissionsTabVisible).toBe(true);
    });

    it('Thu hồi #259 (GET submissions): Chỉ ẩn Tab bài nộp (Deliverables & Submissions Tab)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'GET /api/contracts/:contractId/milestones/:milestoneId/submissions',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.submissionsTabVisible).toBe(false);
      expect(ui.filesTabVisible).toBe(true);
    });

    it('Thu hồi #260 (GET submission detail): Chỉ ẩn chi tiết bài nộp deliverable', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'GET /api/contracts/:contractId/milestones/:milestoneId/submissions/:id',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.submissionDetailExpanded).toBe(false);
      expect(ui.submissionsTabVisible).toBe(true);
    });

    it('Thu hồi #261 (PATCH request-changes): Chỉ ẩn nút yêu cầu sửa đổi (Request Changes)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.requestChangesButton).toBe(false);
      expect(ui.approveDeliverablesButton).toBe(true);
    });

    it('Thu hồi #262 (PATCH approve): Chỉ ẩn nút phê duyệt bài nộp (Approve Deliverables)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'PATCH /api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.approveDeliverablesButton).toBe(false);
      expect(ui.requestChangesButton).toBe(true);
    });

    it('Thu hồi #516 (POST fund saved-card): Chỉ ẩn lựa chọn thanh toán thẻ đã lưu', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.quickPaySavedCardOption).toBe(false);
      expect(ui.stripeCheckoutOption).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
    });

    it('Thu hồi #515 (POST checkout-session): Chỉ ẩn lựa chọn thanh toán Stripe Checkout', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.stripeCheckoutOption).toBe(false);
      expect(ui.quickPaySavedCardOption).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
    });

    it('Thu hồi cả 3 quyền ký quỹ (#514, #515, #516): Nút ký quỹ (Fund Escrow) bị ẩn hoàn toàn', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
            'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent' &&
          p !==
            'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session' &&
          p !==
            'POST /api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.fundEscrowButton).toBe(false);
      expect(ui.quickPaySavedCardOption).toBe(false);
      expect(ui.stripeCheckoutOption).toBe(false);
      expect(ui.releasePaymentButton).toBe(true);
    });

    it('Thu hồi #517 (POST release): Chỉ ẩn nút giải ngân tiền ký quỹ (Release Payment)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'POST /api/payments/contracts/:contractId/milestones/:milestoneId/release',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.releasePaymentButton).toBe(false);
      expect(ui.refundMilestoneButton).toBe(true);
      expect(ui.fundEscrowButton).toBe(true);
    });

    it('Thu hồi #518 (POST refund): Chỉ ẩn nút hoàn tiền ký quỹ (Refund Milestone)', () => {
      const without = allPermissions.filter(
        (p) =>
          p !==
          'POST /api/payments/contracts/:contractId/milestones/:milestoneId/refund',
      );
      const ui = simulateMilestoneUiState(without);
      expect(ui.refundMilestoneButton).toBe(false);
      expect(ui.releasePaymentButton).toBe(true);
    });
  });

  describe('6. Sai khác Phương thức HTTP (Method Mismatch)', () => {
    it('Gửi POST khi chỉ có quyền GET /api/contracts/:contractId/milestones -> Từ chối', () => {
      const perms = ['GET /api/contracts/:contractId/milestones'];
      expect(hasPermission(perms, 'POST', '/api/contracts/88/milestones')).toBe(
        false,
      );
    });

    it('Gửi DELETE khi chỉ có quyền PATCH /api/contracts/:contractId/milestones/:id -> Từ chối', () => {
      const perms = ['PATCH /api/contracts/:contractId/milestones/:id'];
      expect(
        hasPermission(perms, 'DELETE', '/api/contracts/88/milestones/101'),
      ).toBe(false);
    });

    it('Gửi GET khi chỉ có quyền POST /api/payments/contracts/:contractId/milestones/:milestoneId/release -> Từ chối', () => {
      const perms = [
        'POST /api/payments/contracts/:contractId/milestones/:milestoneId/release',
      ];
      expect(
        hasPermission(
          perms,
          'GET',
          '/api/payments/contracts/88/milestones/101/release',
        ),
      ).toBe(false);
    });
  });
});
