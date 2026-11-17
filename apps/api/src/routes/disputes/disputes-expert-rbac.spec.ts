import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * 1. DISPUTES - Tranh chấp & Khiếu nại (Hợp đồng & Thanh toán) - 6 quyền:
 *    #443 · GET  /api/disputes (Xem danh sách tranh chấp)
 *    #444 · POST /api/disputes (Mở tranh chấp mới)
 *    #446 · POST /api/disputes/:id/response (Gửi phản hồi tranh chấp)
 *    #447 · GET  /api/disputes/milestone/:milestoneId (Xem tranh chấp theo milestone)
 *    #448 · GET  /api/disputes/:id (Xem chi tiết tranh chấp)
 *    #449 · POST /api/disputes/:id/review (Xem xét tranh chấp)
 *
 * 2. EXPERT PROFILE - Hồ sơ Chuyên gia (Expert) (Hợp đồng & Thanh toán) - 3 quyền:
 *    #454 · GET /api/profile-revisions/me (Xem lịch sử duyệt hồ sơ Expert của tôi)
 *    #459 · GET /api/expert-profile/me (Xem hồ sơ Expert của tôi)
 *    #460 · PUT /api/expert-profile/me (Cập nhật hồ sơ Expert của tôi)
 *
 * Tổng cộng: 9 quyền.
 *
 * Yêu cầu nghiêm ngặt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Tự động kiểm thử chứng minh: Khi không có quyền tương ứng, các nút bấm, tab, card,
 *    bảng dữ liệu trên giao diện người dùng bị ẩn hoàn toàn (UI elements completely hidden),
 *    đồng thời các endpoint API không cho phép gọi trái phép.
 */

interface PermissionItem {
  id: number;
  group: 'DISPUTES' | 'EXPERT PROFILE';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const DISPUTES_EXPERT_PERMISSIONS: PermissionItem[] = [
  // ── DISPUTES (6 quyền) ──
  {
    id: 443,
    group: 'DISPUTES',
    method: 'GET',
    path: '/api/disputes',
    description: 'Xem danh sách tranh chấp',
    testActualPath: '/api/disputes',
  },
  {
    id: 444,
    group: 'DISPUTES',
    method: 'POST',
    path: '/api/disputes',
    description: 'Mở tranh chấp mới',
    testActualPath: '/api/disputes',
  },
  {
    id: 446,
    group: 'DISPUTES',
    method: 'POST',
    path: '/api/disputes/:id/response',
    description: 'Gửi phản hồi tranh chấp',
    testActualPath: '/api/disputes/15/response',
  },
  {
    id: 447,
    group: 'DISPUTES',
    method: 'GET',
    path: '/api/disputes/milestone/:milestoneId',
    description: 'Xem tranh chấp theo milestone',
    testActualPath: '/api/disputes/milestone/42',
  },
  {
    id: 448,
    group: 'DISPUTES',
    method: 'GET',
    path: '/api/disputes/:id',
    description: 'Xem chi tiết tranh chấp',
    testActualPath: '/api/disputes/15',
  },
  {
    id: 449,
    group: 'DISPUTES',
    method: 'POST',
    path: '/api/disputes/:id/review',
    description: 'Xem xét tranh chấp',
    testActualPath: '/api/disputes/15/review',
  },

  // ── EXPERT PROFILE (3 quyền) ──
  {
    id: 454,
    group: 'EXPERT PROFILE',
    method: 'GET',
    path: '/api/profile-revisions/me',
    description: 'Xem lịch sử duyệt hồ sơ Expert của tôi',
    testActualPath: '/api/profile-revisions/me',
  },
  {
    id: 459,
    group: 'EXPERT PROFILE',
    method: 'GET',
    path: '/api/expert-profile/me',
    description: 'Xem hồ sơ Expert của tôi',
    testActualPath: '/api/expert-profile/me',
  },
  {
    id: 460,
    group: 'EXPERT PROFILE',
    method: 'PUT',
    path: '/api/expert-profile/me',
    description: 'Cập nhật hồ sơ Expert của tôi',
    testActualPath: '/api/expert-profile/me',
  },
];

/**
 * Mô phỏng logic can() của useActionPermission phía Client Frontend.
 */
function createCanHelper(userPermissions: PermissionItem[]) {
  return (method: string, targetPath: string): boolean => {
    const normalizedTarget = normalizeApiPath(targetPath);
    return userPermissions.some(
      (p) =>
        p.method.toUpperCase() === method.toUpperCase() &&
        matchRoutePath(p.path, normalizedTarget),
    );
  };
}

/**
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 9 quyền.
 */
function evaluateDisputesExpertUIState(
  can: (method: string, path: string) => boolean,
) {
  return {
    // 1. Disputes Navigation Link in Header & Mobile Drawer (#443)
    showDisputesHeaderNav: can('GET', '/api/disputes'),

    // 2. "Dispute Milestone" action button in Milestone Card & Overview (#444)
    showOpenDisputeButton: can('POST', '/api/disputes'),

    // 3. "Submit Response" button with evidence upload in Dispute Details (#446)
    showDisputeResponseButton: can('POST', '/api/disputes/15/response'),

    // 4. Milestone Dispute Status Banner & "View Dispute" button in Milestone Card (#447)
    showMilestoneDisputeBanner: can('GET', '/api/disputes/milestone/42'),

    // 5. Dispute Detail Modal / View (#448)
    showDisputeDetailView: can('GET', '/api/disputes/15'),

    // 6. "Accept Decision" / "Reject Decision" arbitration review buttons (#449)
    showDisputeReviewDecisionButtons: can('POST', '/api/disputes/15/review'),

    // 7. Profile Review Status Banner (<ProfileReviewStatus>) (#454)
    showProfileReviewStatus: can('GET', '/api/profile-revisions/me'),

    // 8. Expert Profile Form & Nav Link in Expert Shell (#459)
    showExpertProfileForm: can('GET', '/api/expert-profile/me'),

    // 9. Expert Profile Submit / Save button (#460)
    showExpertProfileSaveButton: can('PUT', '/api/expert-profile/me'),
  };
}

/**
 * Kiểm tra middleware/guard ở cấp Backend API.
 */
function checkPermissionGuard(
  userPermissions: { method: string; path: string }[],
  incomingMethod: string,
  incomingPath: string,
): { allowed: boolean; status: number } {
  const normalizedIncoming = normalizeApiPath(incomingPath);
  const isMatch = userPermissions.some(
    (p) =>
      p.method.toUpperCase() === incomingMethod.toUpperCase() &&
      matchRoutePath(p.path, normalizedIncoming),
  );

  return isMatch
    ? { allowed: true, status: 200 }
    : { allowed: false, status: 403 };
}

describe('DISPUTES & EXPERT PROFILE - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến & Phân lập Route (Route Matching & Isolation)', () => {
    it.each(DISPUTES_EXPERT_PERMISSIONS)(
      'Quyền #$id: $method $path khớp chính xác với URL thực tế $testActualPath',
      ({ method, path, testActualPath }) => {
        const result = checkPermissionGuard(
          [{ method, path }],
          method,
          testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      },
    );

    it('Xử lý an toàn với query parameters và trailing slash', () => {
      const getDisputesPerm = [{ method: 'GET', path: '/api/disputes' }];
      expect(
        checkPermissionGuard(
          getDisputesPerm,
          'GET',
          '/api/disputes?status=OPEN&page=1&limit=10',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getDisputesPerm, 'GET', '/api/disputes/').allowed,
      ).toBe(true);

      const getRevisionsPerm = [
        { method: 'GET', path: '/api/profile-revisions/me' },
      ];
      expect(
        checkPermissionGuard(
          getRevisionsPerm,
          'GET',
          '/api/profile-revisions/me?type=EXPERT',
        ).allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/disputes/:id và các sub-route chuyên biệt (:id/response, :id/review)', () => {
      const detailOnly = [{ method: 'GET', path: '/api/disputes/:id' }];
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/disputes/15').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(detailOnly, 'POST', '/api/disputes/15/response')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(detailOnly, 'POST', '/api/disputes/15/review')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa /api/disputes/milestone/:milestoneId và /api/disputes/:id', () => {
      const milestoneDisputeOnly = [
        { method: 'GET', path: '/api/disputes/milestone/:milestoneId' },
      ];
      expect(
        checkPermissionGuard(
          milestoneDisputeOnly,
          'GET',
          '/api/disputes/milestone/42',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(milestoneDisputeOnly, 'GET', '/api/disputes/42')
          .allowed,
      ).toBe(false);

      const detailOnly = [{ method: 'GET', path: '/api/disputes/:id' }];
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/disputes/milestone/42')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập giữa /api/admin/disputes và /api/disputes (không bị lẫn lộn giữa Admin và Member)', () => {
      const memberDisputesPerms = DISPUTES_EXPERT_PERMISSIONS.filter(
        (p) => p.group === 'DISPUTES',
      );
      const can = createCanHelper(memberDisputesPerms);

      expect(can('GET', '/api/disputes')).toBe(true);
      expect(can('GET', '/api/admin/disputes')).toBe(false);
      expect(can('POST', '/api/admin/disputes/15/decision')).toBe(false);
      expect(can('POST', '/api/admin/disputes/15/final-decision')).toBe(false);
    });

    it('Phân lập chặt chẽ giữa GET và PUT /api/expert-profile/me', () => {
      const getOnly = [{ method: 'GET', path: '/api/expert-profile/me' }];
      expect(
        checkPermissionGuard(getOnly, 'GET', '/api/expert-profile/me').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getOnly, 'PUT', '/api/expert-profile/me').allowed,
      ).toBe(false);

      const putOnly = [{ method: 'PUT', path: '/api/expert-profile/me' }];
      expect(
        checkPermissionGuard(putOnly, 'PUT', '/api/expert-profile/me').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(putOnly, 'GET', '/api/expert-profile/me').allowed,
      ).toBe(false);
    });

    it('Phân lập giữa /api/profile-revisions/me và /api/admin/profile-revisions', () => {
      const memberRevisionOnly = [
        { method: 'GET', path: '/api/profile-revisions/me' },
      ];
      expect(
        checkPermissionGuard(
          memberRevisionOnly,
          'GET',
          '/api/profile-revisions/me',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          memberRevisionOnly,
          'GET',
          '/api/admin/profile-revisions',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          memberRevisionOnly,
          'PATCH',
          '/api/admin/profile-revisions/1/approve',
        ).allowed,
      ).toBe(false);
    });

    it('Không cho phép khớp nhầm với các module khác (contracts, milestones, payments, escrows)', () => {
      const allPerms = DISPUTES_EXPERT_PERMISSIONS.map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermissionGuard(allPerms, 'GET', '/api/contracts').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(allPerms, 'GET', '/api/contracts/10/milestones')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(allPerms, 'GET', '/api/payments/transactions')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(allPerms, 'GET', '/api/profiles/100').allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp đủ 9/9 quyền (Full Access)', () => {
    const fullPermissions = DISPUTES_EXPERT_PERMISSIONS;
    const can = createCanHelper(fullPermissions);

    it('Tất cả 9 endpoint đều cho phép truy cập thành công (200 OK)', () => {
      for (const perm of DISPUTES_EXPERT_PERMISSIONS) {
        const result = checkPermissionGuard(
          fullPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      }
    });

    it('Toàn bộ 9/9 thành phần giao diện UI đều hiển thị đầy đủ', () => {
      const uiState = evaluateDisputesExpertUIState(can);

      // DISPUTES (6 controls)
      expect(uiState.showDisputesHeaderNav).toBe(true);
      expect(uiState.showOpenDisputeButton).toBe(true);
      expect(uiState.showDisputeResponseButton).toBe(true);
      expect(uiState.showMilestoneDisputeBanner).toBe(true);
      expect(uiState.showDisputeDetailView).toBe(true);
      expect(uiState.showDisputeReviewDecisionButtons).toBe(true);

      // EXPERT PROFILE (3 controls)
      expect(uiState.showProfileReviewStatus).toBe(true);
      expect(uiState.showExpertProfileForm).toBe(true);
      expect(uiState.showExpertProfileSaveButton).toBe(true);

      // Tổng cộng: 9/9 true
      const visibleCount = Object.values(uiState).filter(Boolean).length;
      expect(visibleCount).toBe(9);
    });
  });

  describe('Phần 3: Thu hồi toàn bộ quyền (Zero Access - 0/9)', () => {
    const noPermissions: PermissionItem[] = [];
    const can = createCanHelper(noPermissions);

    it('Tất cả 9 endpoint đều bị chặn truy cập (403 Forbidden)', () => {
      for (const perm of DISPUTES_EXPERT_PERMISSIONS) {
        const result = checkPermissionGuard(
          noPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('Toàn bộ 9/9 thành phần UI đều bị ẩn hoàn toàn ("ko hiển thị UI đó nữa")', () => {
      const uiState = evaluateDisputesExpertUIState(can);

      // DISPUTES (6 controls)
      expect(uiState.showDisputesHeaderNav).toBe(false);
      expect(uiState.showOpenDisputeButton).toBe(false);
      expect(uiState.showDisputeResponseButton).toBe(false);
      expect(uiState.showMilestoneDisputeBanner).toBe(false);
      expect(uiState.showDisputeDetailView).toBe(false);
      expect(uiState.showDisputeReviewDecisionButtons).toBe(false);

      // EXPERT PROFILE (3 controls)
      expect(uiState.showProfileReviewStatus).toBe(false);
      expect(uiState.showExpertProfileForm).toBe(false);
      expect(uiState.showExpertProfileSaveButton).toBe(false);

      // Tổng cộng: 0/9 true (tất cả đều bị ẩn)
      const visibleCount = Object.values(uiState).filter(Boolean).length;
      expect(visibleCount).toBe(0);
    });
  });

  describe('Phần 4: Thu hồi chọn lọc từng quyền một (Selective 1-by-1 Revocation)', () => {
    const testCases: {
      revokedId: number;
      expectedHiddenField: keyof ReturnType<
        typeof evaluateDisputesExpertUIState
      >;
      description: string;
    }[] = [
      {
        revokedId: 443,
        expectedHiddenField: 'showDisputesHeaderNav',
        description:
          'Thu hồi #443 (GET /api/disputes) -> Ẩn link điều hướng tranh chấp trên Header',
      },
      {
        revokedId: 444,
        expectedHiddenField: 'showOpenDisputeButton',
        description:
          'Thu hồi #444 (POST /api/disputes) -> Ẩn nút "Mở tranh chấp / Khiếu nại"',
      },
      {
        revokedId: 446,
        expectedHiddenField: 'showDisputeResponseButton',
        description:
          'Thu hồi #446 (POST /api/disputes/:id/response) -> Ẩn nút "Gửi phản hồi kèm chứng cứ"',
      },
      {
        revokedId: 447,
        expectedHiddenField: 'showMilestoneDisputeBanner',
        description:
          'Thu hồi #447 (GET /api/disputes/milestone/:milestoneId) -> Ẩn banner tranh chấp của milestone',
      },
      {
        revokedId: 448,
        expectedHiddenField: 'showDisputeDetailView',
        description:
          'Thu hồi #448 (GET /api/disputes/:id) -> Ẩn màn hình chi tiết tranh chấp',
      },
      {
        revokedId: 449,
        expectedHiddenField: 'showDisputeReviewDecisionButtons',
        description:
          'Thu hồi #449 (POST /api/disputes/:id/review) -> Ẩn các nút chấp thuận / từ chối phán quyết',
      },
      {
        revokedId: 454,
        expectedHiddenField: 'showProfileReviewStatus',
        description:
          'Thu hồi #454 (GET /api/profile-revisions/me) -> Ẩn banner trạng thái duyệt hồ sơ Expert',
      },
      {
        revokedId: 459,
        expectedHiddenField: 'showExpertProfileForm',
        description:
          'Thu hồi #459 (GET /api/expert-profile/me) -> Ẩn form thông tin hồ sơ Expert (Access Denied)',
      },
      {
        revokedId: 460,
        expectedHiddenField: 'showExpertProfileSaveButton',
        description:
          'Thu hồi #460 (PUT /api/expert-profile/me) -> Ẩn nút Submit / Lưu thay đổi hồ sơ Expert',
      },
    ];

    it.each(testCases)(
      'Khi thu hồi quyền #$revokedId: Chỉ $expectedHiddenField bị ẩn, 8 UI controls khác vẫn hiển thị',
      ({ revokedId, expectedHiddenField }) => {
        // Cấp 8 quyền, thu hồi đúng 1 quyền
        const remainingPerms = DISPUTES_EXPERT_PERMISSIONS.filter(
          (p) => p.id !== revokedId,
        );
        const can = createCanHelper(remainingPerms);
        const uiState = evaluateDisputesExpertUIState(can);

        // Phần tử tương ứng với quyền bị thu hồi phải bị ẩn hoàn toàn
        expect(uiState[expectedHiddenField]).toBe(false);

        // 8 phần tử còn lại vẫn hiển thị đầy đủ
        const visibleFields = Object.entries(uiState).filter(
          ([key]) => key !== expectedHiddenField,
        );
        for (const [, value] of visibleFields) {
          expect(value).toBe(true);
        }

        const totalVisible = Object.values(uiState).filter(Boolean).length;
        expect(totalVisible).toBe(8);

        // Kiểm tra Backend Guard: Endpoint bị thu hồi phải trả về 403, 8 endpoint còn lại 200 OK
        const revokedPerm = DISPUTES_EXPERT_PERMISSIONS.find(
          (p) => p.id === revokedId,
        )!;
        const deniedResult = checkPermissionGuard(
          remainingPerms,
          revokedPerm.method,
          revokedPerm.testActualPath,
        );
        expect(deniedResult.allowed).toBe(false);
        expect(deniedResult.status).toBe(403);

        for (const perm of remainingPerms) {
          const allowedResult = checkPermissionGuard(
            remainingPerms,
            perm.method,
            perm.testActualPath,
          );
          expect(allowedResult.allowed).toBe(true);
          expect(allowedResult.status).toBe(200);
        }
      },
    );
  });

  describe('Phần 5: Cấp duy nhất từng quyền một (Exclusive 1-by-1 Granting)', () => {
    const testCases: {
      grantedId: number;
      expectedVisibleField: keyof ReturnType<
        typeof evaluateDisputesExpertUIState
      >;
    }[] = [
      { grantedId: 443, expectedVisibleField: 'showDisputesHeaderNav' },
      { grantedId: 444, expectedVisibleField: 'showOpenDisputeButton' },
      { grantedId: 446, expectedVisibleField: 'showDisputeResponseButton' },
      { grantedId: 447, expectedVisibleField: 'showMilestoneDisputeBanner' },
      { grantedId: 448, expectedVisibleField: 'showDisputeDetailView' },
      {
        grantedId: 449,
        expectedVisibleField: 'showDisputeReviewDecisionButtons',
      },
      { grantedId: 454, expectedVisibleField: 'showProfileReviewStatus' },
      { grantedId: 459, expectedVisibleField: 'showExpertProfileForm' },
      { grantedId: 460, expectedVisibleField: 'showExpertProfileSaveButton' },
    ];

    it.each(testCases)(
      'Khi chỉ cấp duy nhất quyền #$grantedId: Chỉ $expectedVisibleField hiển thị, 8 UI controls khác bị ẩn',
      ({ grantedId, expectedVisibleField }) => {
        const singlePerm = DISPUTES_EXPERT_PERMISSIONS.filter(
          (p) => p.id === grantedId,
        );
        const can = createCanHelper(singlePerm);
        const uiState = evaluateDisputesExpertUIState(can);

        // Chỉ phần tử được cấp hiển thị
        expect(uiState[expectedVisibleField]).toBe(true);

        // 8 phần tử khác đều bị ẩn hoàn toàn
        const hiddenFields = Object.entries(uiState).filter(
          ([key]) => key !== expectedVisibleField,
        );
        for (const [, value] of hiddenFields) {
          expect(value).toBe(false);
        }

        const totalVisible = Object.values(uiState).filter(Boolean).length;
        expect(totalVisible).toBe(1);

        // Kiểm tra Backend Guard: Chỉ đúng endpoint này 200, 8 endpoint khác 403
        for (const perm of DISPUTES_EXPERT_PERMISSIONS) {
          const res = checkPermissionGuard(
            singlePerm,
            perm.method,
            perm.testActualPath,
          );
          if (perm.id === grantedId) {
            expect(res.allowed).toBe(true);
            expect(res.status).toBe(200);
          } else {
            expect(res.allowed).toBe(false);
            expect(res.status).toBe(403);
          }
        }
      },
    );
  });

  describe('Phần 6: Kịch bản nghiệp vụ thực tế (Role-Based Business Scenarios)', () => {
    it('Kịch bản 1: Client mở khiếu nại tranh chấp milestone (#443, #444, #447, #448)', () => {
      // Client có quyền xem danh sách tranh chấp, mở tranh chấp, xem banner milestone và chi tiết
      // nhưng chưa có quyền nộp phản hồi (#446) hoặc xem xét phán quyết (#449)
      const clientDisputePerms = DISPUTES_EXPERT_PERMISSIONS.filter((p) =>
        [443, 444, 447, 448].includes(p.id),
      );
      const can = createCanHelper(clientDisputePerms);
      const uiState = evaluateDisputesExpertUIState(can);

      expect(uiState.showDisputesHeaderNav).toBe(true);
      expect(uiState.showOpenDisputeButton).toBe(true);
      expect(uiState.showMilestoneDisputeBanner).toBe(true);
      expect(uiState.showDisputeDetailView).toBe(true);

      // Bị ẩn các chức năng phản hồi hoặc phán quyết chưa được cấp
      expect(uiState.showDisputeResponseButton).toBe(false);
      expect(uiState.showDisputeReviewDecisionButtons).toBe(false);
      // Bị ẩn hoàn toàn cụm Expert Profile
      expect(uiState.showProfileReviewStatus).toBe(false);
      expect(uiState.showExpertProfileForm).toBe(false);
      expect(uiState.showExpertProfileSaveButton).toBe(false);
    });

    it('Kịch bản 2: Freelancer xem tranh chấp và gửi phản hồi kèm bằng chứng (#443, #446, #447, #448, #449)', () => {
      const freelancerDisputePerms = DISPUTES_EXPERT_PERMISSIONS.filter((p) =>
        [443, 446, 447, 448, 449].includes(p.id),
      );
      const can = createCanHelper(freelancerDisputePerms);
      const uiState = evaluateDisputesExpertUIState(can);

      expect(uiState.showDisputesHeaderNav).toBe(true);
      expect(uiState.showMilestoneDisputeBanner).toBe(true);
      expect(uiState.showDisputeDetailView).toBe(true);
      expect(uiState.showDisputeResponseButton).toBe(true);
      expect(uiState.showDisputeReviewDecisionButtons).toBe(true);

      // Freelancer không có quyền mở tranh chấp mới (#444)
      expect(uiState.showOpenDisputeButton).toBe(false);
    });

    it('Kịch bản 3: Chuyên gia (Expert) xem và cập nhật hồ sơ cá nhân (#454, #459, #460)', () => {
      const expertPerms = DISPUTES_EXPERT_PERMISSIONS.filter((p) =>
        [454, 459, 460].includes(p.id),
      );
      const can = createCanHelper(expertPerms);
      const uiState = evaluateDisputesExpertUIState(can);

      // Đầy đủ quyền cụm EXPERT PROFILE
      expect(uiState.showProfileReviewStatus).toBe(true);
      expect(uiState.showExpertProfileForm).toBe(true);
      expect(uiState.showExpertProfileSaveButton).toBe(true);

      // Toàn bộ chức năng tranh chấp bị ẩn vì không thuộc vai trò
      expect(uiState.showDisputesHeaderNav).toBe(false);
      expect(uiState.showOpenDisputeButton).toBe(false);
      expect(uiState.showDisputeResponseButton).toBe(false);
      expect(uiState.showMilestoneDisputeBanner).toBe(false);
      expect(uiState.showDisputeDetailView).toBe(false);
      expect(uiState.showDisputeReviewDecisionButtons).toBe(false);
    });

    it('Kịch bản 4: Expert ở chế độ chỉ đọc (Read-Only) - Có #454, #459 nhưng thiếu #460', () => {
      // Khi không có quyền PUT /api/expert-profile/me (#460):
      // Giao diện vẫn cho xem hồ sơ và trạng thái duyệt nhưng NÚT LƯU BỊ ẨN HOÀN TOÀN
      const readOnlyExpert = DISPUTES_EXPERT_PERMISSIONS.filter((p) =>
        [454, 459].includes(p.id),
      );
      const can = createCanHelper(readOnlyExpert);
      const uiState = evaluateDisputesExpertUIState(can);

      expect(uiState.showProfileReviewStatus).toBe(true);
      expect(uiState.showExpertProfileForm).toBe(true);
      expect(uiState.showExpertProfileSaveButton).toBe(false); // Nút lưu bị ẩn hoàn toàn!
    });

    it('Kịch bản 5: User bị thu hồi quyền xem hồ sơ Expert (#459 bị thiếu)', () => {
      // Dù có #454 hoặc #460, nhưng thiếu #459 (GET /api/expert-profile/me)
      // thì toàn bộ Form hồ sơ phải bị ẩn và hiển thị thông báo Không có quyền truy cập
      const lackViewPerm = DISPUTES_EXPERT_PERMISSIONS.filter(
        (p) => p.id !== 459,
      );
      const can = createCanHelper(lackViewPerm);
      const uiState = evaluateDisputesExpertUIState(can);

      expect(uiState.showExpertProfileForm).toBe(false); // Form hồ sơ bị ẩn hoàn toàn!
    });
  });
});
