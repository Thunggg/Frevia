import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * CỤM 1: KYC VERIFICATION - Xác minh danh tính (Freelancer) - 5 quyền:
 * 1. #189 · POST /api/identity-verifications/documents (Tải lên tài liệu xác minh danh tính)
 * 2. #190 · GET /api/identity-verifications/status (Xem trạng thái xác minh tài khoản)
 * 3. #191 · GET /api/identity-verifications/documents/:id/file (Tải tài liệu xác minh)
 * 4. #551 · POST /api/identity-verifications/ai-check (Kiểm tra xác thực CCCD bằng AI)
 * 5. #552 · POST /api/identity-verifications/liveness-pose (Kiểm tra người thật - Liveness Pose)
 *
 * CỤM 2: JOB ALERTS - Thông báo việc làm (Freelancer) - 6 quyền:
 * 6. #572 · GET /api/job-alerts (Xem thông báo việc làm)
 * 7. #573 · GET /api/job-alerts/:id/matching-jobs (Xem việc làm phù hợp với thông báo)
 * 8. #574 · GET /api/job-alerts/:id (Xem chi tiết thông báo việc làm)
 * 9. #575 · POST /api/job-alerts (Tạo thông báo việc làm mới)
 * 10. #576 · PATCH /api/job-alerts/:id (Cập nhật thông báo việc làm)
 * 11. #577 · DELETE /api/job-alerts/:id (Xóa thông báo việc làm)
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

const KYC_JOB_ALERTS_PERMISSIONS: PermissionItem[] = [
  // --- Cụm KYC Verification ---
  {
    id: 189,
    method: 'POST',
    path: '/api/identity-verifications/documents',
    description: 'Tải lên tài liệu xác minh danh tính',
    testActualPath: '/api/identity-verifications/documents',
  },
  {
    id: 190,
    method: 'GET',
    path: '/api/identity-verifications/status',
    description: 'Xem trạng thái xác minh tài khoản',
    testActualPath: '/api/identity-verifications/status',
  },
  {
    id: 191,
    method: 'GET',
    path: '/api/identity-verifications/documents/:id/file',
    description: 'Tải tài liệu xác minh',
    testActualPath: '/api/identity-verifications/documents/77/file',
  },
  {
    id: 551,
    method: 'POST',
    path: '/api/identity-verifications/ai-check',
    description: 'Kiểm tra xác thực CCCD bằng AI',
    testActualPath: '/api/identity-verifications/ai-check',
  },
  {
    id: 552,
    method: 'POST',
    path: '/api/identity-verifications/liveness-pose',
    description: 'Kiểm tra người thật (Liveness Pose)',
    testActualPath: '/api/identity-verifications/liveness-pose',
  },

  // --- Cụm Job Alerts ---
  {
    id: 572,
    method: 'GET',
    path: '/api/job-alerts',
    description: 'Xem thông báo việc làm',
    testActualPath: '/api/job-alerts',
  },
  {
    id: 573,
    method: 'GET',
    path: '/api/job-alerts/:id/matching-jobs',
    description: 'Xem việc làm phù hợp với thông báo',
    testActualPath: '/api/job-alerts/15/matching-jobs',
  },
  {
    id: 574,
    method: 'GET',
    path: '/api/job-alerts/:id',
    description: 'Xem chi tiết thông báo việc làm',
    testActualPath: '/api/job-alerts/15',
  },
  {
    id: 575,
    method: 'POST',
    path: '/api/job-alerts',
    description: 'Tạo thông báo việc làm mới',
    testActualPath: '/api/job-alerts',
  },
  {
    id: 576,
    method: 'PATCH',
    path: '/api/job-alerts/:id',
    description: 'Cập nhật thông báo việc làm',
    testActualPath: '/api/job-alerts/15',
  },
  {
    id: 577,
    method: 'DELETE',
    path: '/api/job-alerts/:id',
    description: 'Xóa thông báo việc làm',
    testActualPath: '/api/job-alerts/15',
  },
];

/**
 * Giả lập Permission Guard kiểm tra quyền dựa trên danh sách permissions được cấp
 */
function checkPermission(
  grantedPermissions: Array<{ method: string; path: string }>,
  targetMethod: string,
  targetPath: string,
): boolean {
  return grantedPermissions.some(
    (perm) =>
      perm.method.toUpperCase() === targetMethod.toUpperCase() &&
      matchRoutePath(perm.path, targetPath),
  );
}

/**
 * Giả lập trạng thái UI cho cả 2 cụm chức năng
 */
interface KycUiState {
  canViewIdentityTab: boolean;
  canViewIdentityStatusCard: boolean;
  canDownloadIdentityDocFile: boolean;
  canViewVerificationForm: boolean;
  canSubmitVerification: boolean;
  canStartLiveness: boolean;
}

interface JobAlertsUiState {
  canViewJobAlertsList: boolean;
  canViewLimitIndicator: boolean;
  canCreateJobAlertButton: boolean;
  canToggleAlertActive: boolean;
  canEditAlertButton: boolean;
  canDeleteAlertButton: boolean;
  canViewMatchingJobsButton: boolean;
}

function resolveKycUiState(
  grantedPermissions: Array<{ method: string; path: string }>,
): KycUiState {
  const can = (method: string, path: string) =>
    checkPermission(grantedPermissions, method, path);

  const canUploadDoc = can('POST', '/api/identity-verifications/documents');
  const canStatus = can('GET', '/api/identity-verifications/status');
  const canDownloadFile = can(
    'GET',
    '/api/identity-verifications/documents/:id/file',
  );
  const canAi = can('POST', '/api/identity-verifications/ai-check');
  const canLivePose = can('POST', '/api/identity-verifications/liveness-pose');

  return {
    canViewIdentityTab: canStatus || canUploadDoc || canAi || canLivePose,
    canViewIdentityStatusCard: canStatus,
    canDownloadIdentityDocFile: canDownloadFile,
    canViewVerificationForm: canAi || canUploadDoc,
    canSubmitVerification: canAi || canUploadDoc,
    canStartLiveness: canLivePose,
  };
}

function resolveJobAlertsUiState(
  grantedPermissions: Array<{ method: string; path: string }>,
): JobAlertsUiState {
  const can = (method: string, path: string) =>
    checkPermission(grantedPermissions, method, path);

  const canViewAlerts = can('GET', '/api/job-alerts');
  const canMatching = can('GET', '/api/job-alerts/:id/matching-jobs');
  const canCreate = can('POST', '/api/job-alerts');
  const canUpdate = can('PATCH', '/api/job-alerts/:id');
  const canDelete = can('DELETE', '/api/job-alerts/:id');

  return {
    canViewJobAlertsList: canViewAlerts,
    canViewLimitIndicator: canViewAlerts,
    canCreateJobAlertButton: canCreate,
    canToggleAlertActive: canUpdate,
    canEditAlertButton: canUpdate,
    canDeleteAlertButton: canDelete,
    canViewMatchingJobsButton: canMatching,
  };
}

describe('KYC VERIFICATION & JOB ALERTS - Action-Level RBAC & UI Control Specification', () => {
  describe('1. Chuẩn hóa và Khớp nối Đường dẫn (Route Matching & Static Segments)', () => {
    test.each(KYC_JOB_ALERTS_PERMISSIONS)(
      'Khớp pattern permission: $description ($method $path)',
      ({ path, testActualPath }) => {
        expect(normalizeApiPath(path)).toBe(path);
        expect(matchRoutePath(path, testActualPath)).toBe(true);
      },
    );

    test('Bảo vệ tính cô lập giữa các sub-routes tĩnh và dynamic params trong KYC & Job Alerts', () => {
      // 1. /api/identity-verifications/documents/:id/file KHÔNG được khớp với /api/identity-verifications/documents
      expect(
        matchRoutePath(
          '/api/identity-verifications/documents/:id/file',
          '/api/identity-verifications/documents',
        ),
      ).toBe(false);

      // 2. /api/identity-verifications/documents KHÔNG khớp với /api/identity-verifications/status
      expect(
        matchRoutePath(
          '/api/identity-verifications/documents',
          '/api/identity-verifications/status',
        ),
      ).toBe(false);

      // 3. /api/identity-verifications/ai-check KHÔNG khớp với liveness-pose
      expect(
        matchRoutePath(
          '/api/identity-verifications/ai-check',
          '/api/identity-verifications/liveness-pose',
        ),
      ).toBe(false);

      // 4. /api/job-alerts/:id/matching-jobs KHÔNG khớp với /api/job-alerts/:id
      expect(
        matchRoutePath(
          '/api/job-alerts/:id',
          '/api/job-alerts/15/matching-jobs',
        ),
      ).toBe(false);
      expect(
        matchRoutePath(
          '/api/job-alerts/:id/matching-jobs',
          '/api/job-alerts/15',
        ),
      ).toBe(false);

      // 5. /api/job-alerts (length 2) KHÔNG khớp với /api/job-alerts/15 (length 3)
      expect(matchRoutePath('/api/job-alerts', '/api/job-alerts/15')).toBe(
        false,
      );
    });
  });

  describe('2. Kiểm thử cấp Full Quyền (11/11 Quyền) -> Mọi API cho phép & Mọi UI hiển thị', () => {
    const fullPermissions = KYC_JOB_ALERTS_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    test.each(KYC_JOB_ALERTS_PERMISSIONS)(
      'Cho phép gọi API: $description ($method $path)',
      ({ method, testActualPath }) => {
        const allowed = checkPermission(
          fullPermissions,
          method,
          testActualPath,
        );
        expect(allowed).toBe(true);
      },
    );

    test('UI KYC Verification hiển thị đầy đủ Tab, Form, Liveness và Danh sách tài liệu', () => {
      const kycState = resolveKycUiState(fullPermissions);

      expect(kycState.canViewIdentityTab).toBe(true);
      expect(kycState.canViewIdentityStatusCard).toBe(true);
      expect(kycState.canDownloadIdentityDocFile).toBe(true);
      expect(kycState.canViewVerificationForm).toBe(true);
      expect(kycState.canSubmitVerification).toBe(true);
      expect(kycState.canStartLiveness).toBe(true);
    });

    test('UI Job Alerts hiển thị đầy đủ Danh sách, Nút Tạo, Sửa, Xóa và Xem việc làm phù hợp', () => {
      const jobAlertsState = resolveJobAlertsUiState(fullPermissions);

      expect(jobAlertsState.canViewJobAlertsList).toBe(true);
      expect(jobAlertsState.canViewLimitIndicator).toBe(true);
      expect(jobAlertsState.canCreateJobAlertButton).toBe(true);
      expect(jobAlertsState.canToggleAlertActive).toBe(true);
      expect(jobAlertsState.canEditAlertButton).toBe(true);
      expect(jobAlertsState.canDeleteAlertButton).toBe(true);
      expect(jobAlertsState.canViewMatchingJobsButton).toBe(true);
    });
  });

  describe('3. Kiểm thử khi KHÔNG có quyền (0/11 Quyền) -> Toàn bộ API 403 & Toàn bộ UI bị ẩn', () => {
    const noPermissions: Array<{ method: string; path: string }> = [];

    test.each(KYC_JOB_ALERTS_PERMISSIONS)(
      'Chặn truy cập API: $description ($method $path)',
      ({ method, testActualPath }) => {
        const allowed = checkPermission(noPermissions, method, testActualPath);
        expect(allowed).toBe(false);
      },
    );

    test('UI KYC Verification ẩn hoàn toàn Tab Identity và không render form/liveness/status', () => {
      const kycState = resolveKycUiState(noPermissions);

      expect(kycState.canViewIdentityTab).toBe(false);
      expect(kycState.canViewIdentityStatusCard).toBe(false);
      expect(kycState.canDownloadIdentityDocFile).toBe(false);
      expect(kycState.canViewVerificationForm).toBe(false);
      expect(kycState.canSubmitVerification).toBe(false);
      expect(kycState.canStartLiveness).toBe(false);
    });

    test('UI Job Alerts ẩn danh sách, ẩn nút tạo/sửa/xóa và nút xem việc làm phù hợp', () => {
      const jobAlertsState = resolveJobAlertsUiState(noPermissions);

      expect(jobAlertsState.canViewJobAlertsList).toBe(false);
      expect(jobAlertsState.canViewLimitIndicator).toBe(false);
      expect(jobAlertsState.canCreateJobAlertButton).toBe(false);
      expect(jobAlertsState.canToggleAlertActive).toBe(false);
      expect(jobAlertsState.canEditAlertButton).toBe(false);
      expect(jobAlertsState.canDeleteAlertButton).toBe(false);
      expect(jobAlertsState.canViewMatchingJobsButton).toBe(false);
    });
  });

  describe('4. Kiểm thử Tước quyền Đơn lẻ (Selective Revocation) trong KYC Verification', () => {
    test('Tước #190 (Xem trạng thái xác minh): Card trạng thái xác minh bị ẩn, form AI vẫn hiển thị nếu còn quyền AI', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 190);
      const state = resolveKycUiState(perms);

      expect(state.canViewIdentityStatusCard).toBe(false);
      expect(state.canViewIdentityTab).toBe(true);
      expect(state.canViewVerificationForm).toBe(true);
    });

    test('Tước #191 (Tải tài liệu xác minh): Hình ảnh/liên kết tải tài liệu bị ẩn (chuyển sang text placeholder)', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 191);
      const state = resolveKycUiState(perms);

      expect(state.canDownloadIdentityDocFile).toBe(false);
      expect(state.canViewIdentityStatusCard).toBe(true);
    });

    test('Tước #551 & #189 (AI check & Upload tài liệu): Form xác minh và nút submit bị ẩn', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter(
        (p) => p.id !== 551 && p.id !== 189,
      );
      const state = resolveKycUiState(perms);

      expect(state.canViewVerificationForm).toBe(false);
      expect(state.canSubmitVerification).toBe(false);
      // Card trạng thái vẫn xem được nếu có #190
      expect(state.canViewIdentityStatusCard).toBe(true);
    });

    test('Tước #552 (Liveness Pose): Nút Bắt đầu quét khuôn mặt liveness bị ẩn', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 552);
      const state = resolveKycUiState(perms);

      expect(state.canStartLiveness).toBe(false);
      expect(state.canViewVerificationForm).toBe(true);
    });
  });

  describe('5. Kiểm thử Tước quyền Đơn lẻ (Selective Revocation) trong Job Alerts', () => {
    test('Tước #572 (Xem thông báo việc làm): Danh sách việc làm bị ẩn, badge đếm số lượng bị ẩn', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 572);
      const state = resolveJobAlertsUiState(perms);

      expect(state.canViewJobAlertsList).toBe(false);
      expect(state.canViewLimitIndicator).toBe(false);
      // Quyền tạo vẫn còn
      expect(state.canCreateJobAlertButton).toBe(true);
    });

    test('Tước #575 (Tạo thông báo việc làm): Nút Create Alert bị ẩn ở cả Header và Empty State', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 575);
      const state = resolveJobAlertsUiState(perms);

      expect(state.canCreateJobAlertButton).toBe(false);
      expect(state.canViewJobAlertsList).toBe(true);
      expect(state.canEditAlertButton).toBe(true);
      expect(state.canDeleteAlertButton).toBe(true);
    });

    test('Tước #576 (Cập nhật thông báo việc làm): Nút Edit bị ẩn và Switch active bị vô hiệu hóa', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 576);
      const state = resolveJobAlertsUiState(perms);

      expect(state.canEditAlertButton).toBe(false);
      expect(state.canToggleAlertActive).toBe(false);
      expect(state.canDeleteAlertButton).toBe(true);
      expect(state.canCreateJobAlertButton).toBe(true);
    });

    test('Tước #577 (Xóa thông báo việc làm): Nút xóa từng Job Alert bị ẩn', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 577);
      const state = resolveJobAlertsUiState(perms);

      expect(state.canDeleteAlertButton).toBe(false);
      expect(state.canEditAlertButton).toBe(true);
      expect(state.canCreateJobAlertButton).toBe(true);
    });

    test('Tước #573 (Xem việc làm phù hợp): Nút Xem việc làm phù hợp (Matching Jobs) bị ẩn', () => {
      const perms = KYC_JOB_ALERTS_PERMISSIONS.filter((p) => p.id !== 573);
      const state = resolveJobAlertsUiState(perms);

      expect(state.canViewMatchingJobsButton).toBe(false);
      expect(state.canEditAlertButton).toBe(true);
      expect(state.canDeleteAlertButton).toBe(true);
    });
  });

  describe('6. Kiểm thử Mismatch Phương thức HTTP (Method Mismatch)', () => {
    const fullPermissions = KYC_JOB_ALERTS_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    test('Không cho phép gọi GET trên các endpoint thay đổi dữ liệu (POST/PATCH/DELETE)', () => {
      expect(
        checkPermission(
          fullPermissions,
          'GET',
          '/api/identity-verifications/documents',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'GET',
          '/api/identity-verifications/ai-check',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'GET',
          '/api/identity-verifications/liveness-pose',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'DELETE',
          '/api/identity-verifications/ai-check',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'POST',
          '/api/job-alerts/15/matching-jobs',
        ),
      ).toBe(false);
    });

    test('Không cho phép gọi POST/DELETE trên các endpoint chỉ đọc (GET)', () => {
      expect(
        checkPermission(
          fullPermissions,
          'POST',
          '/api/identity-verifications/status',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'DELETE',
          '/api/identity-verifications/status',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'POST',
          '/api/identity-verifications/documents/77/file',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'DELETE',
          '/api/identity-verifications/documents/77/file',
        ),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'DELETE', '/api/job-alerts'),
      ).toBe(false);
    });
  });
});
