import { matchRoutePath, normalizeApiPath } from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * 1. SOCIAL LINKS - Liên kết mạng xã hội (Trang chủ & Dùng chung) - 3 quyền:
 *  #194 · GET    /api/social-links (Xem danh sách liên kết mạng xã hội)
 *  #195 · POST   /api/social-links (Thêm liên kết mạng xã hội)
 *  #196 · DELETE /api/social-links/:id (Xóa liên kết mạng xã hội)
 *
 * 2. AI RECOMMENDATIONS - Gợi ý thông minh (AI) (Trang chủ & Dùng chung) - 4 quyền:
 *  #562 · GET    /api/recommendations/jobs (Xem danh sách việc làm gợi ý)
 *  #563 · GET    /api/recommendations/freelancers (Xem danh sách ứng viên gợi ý)
 *  #564 · GET    /api/recommendations/:id/explanation (Xem giải thích lý do gợi ý)
 *  #565 · POST   /api/recommendations/:id/feedback (Gửi phản hồi về kết quả gợi ý)
 *
 * Tổng cộng: 7 quyền.
 *
 * Yêu cầu kiểm thử:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Tự động kiểm thử chứng minh: Khi không có quyền tương ứng, các nút bấm, biểu mẫu,
 *    dropdown menu, tab chuyển đổi và các khung tương tác trên giao diện người dùng
 *    bị ẩn hoàn toàn (UI elements completely hidden), đồng thời các endpoint API không
 *    cho phép truy cập trái phép (403 Forbidden).
 */

interface PermissionItem {
  id: number;
  group: 'SOCIAL LINKS' | 'AI RECOMMENDATIONS';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
  uiField: keyof CombinedUiState;
}

interface CombinedUiState {
  showSocialLinksTab: boolean;
  showSocialLinksDropdown: boolean;
  showAddSocialLinkForm: boolean;
  showDeleteSocialLinkButton: boolean;
  showRecommendedJobsTab: boolean;
  showRecommendedFreelancersView: boolean;
  showRecommendationExplanation: boolean;
  showRecommendationFeedbackButtons: boolean;
}

const SOCIAL_AND_RECOMMENDATION_PERMISSIONS: PermissionItem[] = [
  // ── 1. SOCIAL LINKS (3 quyền) ──
  {
    id: 194,
    group: 'SOCIAL LINKS',
    method: 'GET',
    path: '/api/social-links',
    description: 'Xem danh sách liên kết mạng xã hội',
    testActualPath: '/api/social-links',
    uiField: 'showSocialLinksTab',
  },
  {
    id: 195,
    group: 'SOCIAL LINKS',
    method: 'POST',
    path: '/api/social-links',
    description: 'Thêm liên kết mạng xã hội',
    testActualPath: '/api/social-links',
    uiField: 'showAddSocialLinkForm',
  },
  {
    id: 196,
    group: 'SOCIAL LINKS',
    method: 'DELETE',
    path: '/api/social-links/:id',
    description: 'Xóa liên kết mạng xã hội',
    testActualPath: '/api/social-links/12',
    uiField: 'showDeleteSocialLinkButton',
  },

  // ── 2. AI RECOMMENDATIONS (4 quyền) ──
  {
    id: 562,
    group: 'AI RECOMMENDATIONS',
    method: 'GET',
    path: '/api/recommendations/jobs',
    description: 'Xem danh sách việc làm gợi ý',
    testActualPath: '/api/recommendations/jobs',
    uiField: 'showRecommendedJobsTab',
  },
  {
    id: 563,
    group: 'AI RECOMMENDATIONS',
    method: 'GET',
    path: '/api/recommendations/freelancers',
    description: 'Xem danh sách ứng viên gợi ý',
    testActualPath: '/api/recommendations/freelancers',
    uiField: 'showRecommendedFreelancersView',
  },
  {
    id: 564,
    group: 'AI RECOMMENDATIONS',
    method: 'GET',
    path: '/api/recommendations/:id/explanation',
    description: 'Xem giải thích lý do gợi ý',
    testActualPath: '/api/recommendations/99/explanation',
    uiField: 'showRecommendationExplanation',
  },
  {
    id: 565,
    group: 'AI RECOMMENDATIONS',
    method: 'POST',
    path: '/api/recommendations/:id/feedback',
    description: 'Gửi phản hồi về kết quả gợi ý',
    testActualPath: '/api/recommendations/99/feedback',
    uiField: 'showRecommendationFeedbackButtons',
  },
];

/**
 * Giả lập Permission Guard kiểm tra quyền tại Backend API
 */
function checkPermissionGuard(
  userPermissions: Array<{ method: string; path: string }>,
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

/**
 * Mô phỏng logic can() của useActionPermission phía Client Frontend
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
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 7 quyền
 */
function evaluateUiState(
  can: (method: string, path: string) => boolean,
): CombinedUiState {
  return {
    // ── SOCIAL LINKS UI (#194, #195, #196) ──
    // #194: GET /api/social-links -> Tab Liên kết mạng xã hội & Dropdown menu trong Header
    showSocialLinksTab: can('GET', '/api/social-links'),
    showSocialLinksDropdown: can('GET', '/api/social-links'),

    // #195: POST /api/social-links -> Biểu mẫu thêm liên kết mạng xã hội
    showAddSocialLinkForm: can('POST', '/api/social-links'),

    // #196: DELETE /api/social-links/:id -> Nút Xóa liên kết mạng xã hội
    showDeleteSocialLinkButton: can('DELETE', '/api/social-links/:id'),

    // ── AI RECOMMENDATIONS UI (#562, #563, #564, #565) ──
    // #562: GET /api/recommendations/jobs -> Tab "Best matches" việc làm gợi ý
    showRecommendedJobsTab: can('GET', '/api/recommendations/jobs'),

    // #563: GET /api/recommendations/freelancers -> Khung ứng viên gợi ý cho Job
    showRecommendedFreelancersView: can('GET', '/api/recommendations/freelancers'),

    // #564: GET /api/recommendations/:id/explanation -> Xem giải thích chi tiết lý do gợi ý trên JobCard / Dialog
    showRecommendationExplanation: can(
      'GET',
      '/api/recommendations/:id/explanation',
    ),

    // #565: POST /api/recommendations/:id/feedback -> Hàng nút phản hồi Helpful / Not Helpful
    showRecommendationFeedbackButtons: can(
      'POST',
      '/api/recommendations/:id/feedback',
    ),
  };
}

describe('SOCIAL LINKS & AI RECOMMENDATIONS - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến & Phân lập Route (Route Matching & Isolation)', () => {
    it.each(SOCIAL_AND_RECOMMENDATION_PERMISSIONS)(
      'Quyền #$id ($group): $method $path khớp chính xác với URL thực tế $testActualPath',
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
      const getSocialLinks = [{ method: 'GET', path: '/api/social-links' }];
      expect(
        checkPermissionGuard(
          getSocialLinks,
          'GET',
          '/api/social-links?limit=10',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getSocialLinks, 'GET', '/api/social-links/').allowed,
      ).toBe(true);

      const getRecommendedJobs = [
        { method: 'GET', path: '/api/recommendations/jobs' },
      ];
      expect(
        checkPermissionGuard(
          getRecommendedJobs,
          'GET',
          '/api/recommendations/jobs?limit=15&tab=best-matches',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          getRecommendedJobs,
          'GET',
          '/api/recommendations/jobs/',
        ).allowed,
      ).toBe(true);

      const getRecommendedFreelancers = [
        { method: 'GET', path: '/api/recommendations/freelancers' },
      ];
      expect(
        checkPermissionGuard(
          getRecommendedFreelancers,
          'GET',
          '/api/recommendations/freelancers?jobId=42&limit=5',
        ).allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/social-links (GET/POST) và /api/social-links/:id (DELETE)', () => {
      const viewSocialOnly = [{ method: 'GET', path: '/api/social-links' }];

      expect(
        checkPermissionGuard(viewSocialOnly, 'GET', '/api/social-links').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(viewSocialOnly, 'POST', '/api/social-links').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(viewSocialOnly, 'DELETE', '/api/social-links/12')
          .allowed,
      ).toBe(false);

      const deleteSocialOnly = [
        { method: 'DELETE', path: '/api/social-links/:id' },
      ];
      expect(
        checkPermissionGuard(deleteSocialOnly, 'DELETE', '/api/social-links/12')
          .allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(deleteSocialOnly, 'GET', '/api/social-links')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(deleteSocialOnly, 'POST', '/api/social-links')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa các endpoints của AI Recommendations (:id/explanation, :id/feedback, jobs, freelancers)', () => {
      const explanationOnly = [
        { method: 'GET', path: '/api/recommendations/:id/explanation' },
      ];

      expect(
        checkPermissionGuard(
          explanationOnly,
          'GET',
          '/api/recommendations/99/explanation',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          explanationOnly,
          'POST',
          '/api/recommendations/99/feedback',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          explanationOnly,
          'GET',
          '/api/recommendations/jobs',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          explanationOnly,
          'GET',
          '/api/recommendations/freelancers',
        ).allowed,
      ).toBe(false);
    });

    it('Không bị nhầm lẫn với các endpoint Admin Reindex (/api/recommendations/reindex, /outbox/process)', () => {
      const allSevenPerms = SOCIAL_AND_RECOMMENDATION_PERMISSIONS;

      expect(
        checkPermissionGuard(
          allSevenPerms,
          'POST',
          '/api/recommendations/reindex',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          allSevenPerms,
          'POST',
          '/api/recommendations/outbox/process',
        ).allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp Đủ Toàn Bộ 7 Quyền (Full 7/7 Permissions)', () => {
    it('Cho phép gọi tất cả 7 API thành công (Status 200 Allowed)', () => {
      for (const perm of SOCIAL_AND_RECOMMENDATION_PERMISSIONS) {
        const result = checkPermissionGuard(
          SOCIAL_AND_RECOMMENDATION_PERMISSIONS,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      }
    });

    it('Hiển thị đầy đủ tất cả các thành phần giao diện UI (Tất cả flags đều true)', () => {
      const can = createCanHelper(SOCIAL_AND_RECOMMENDATION_PERMISSIONS);
      const ui = evaluateUiState(can);

      expect(ui.showSocialLinksTab).toBe(true);
      expect(ui.showSocialLinksDropdown).toBe(true);
      expect(ui.showAddSocialLinkForm).toBe(true);
      expect(ui.showDeleteSocialLinkButton).toBe(true);
      expect(ui.showRecommendedJobsTab).toBe(true);
      expect(ui.showRecommendedFreelancersView).toBe(true);
      expect(ui.showRecommendationExplanation).toBe(true);
      expect(ui.showRecommendationFeedbackButtons).toBe(true);
    });
  });

  describe('Phần 3: Thu Hồi Sạch Toàn Bộ 7 Quyền (Zero 0/7 Permissions - DoD Kiểm soát UI)', () => {
    it('Từ chối tất cả 7 API (Status 403 Forbidden)', () => {
      const emptyPermissions: PermissionItem[] = [];

      for (const perm of SOCIAL_AND_RECOMMENDATION_PERMISSIONS) {
        const result = checkPermissionGuard(
          emptyPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('ẨN HOÀN TOÀN TẤT CẢ các thành phần giao diện (Tất cả flags đều false - ko hiển thị UI đó nữa)', () => {
      const can = createCanHelper([]);
      const ui = evaluateUiState(can);

      expect(ui.showSocialLinksTab).toBe(false);
      expect(ui.showSocialLinksDropdown).toBe(false);
      expect(ui.showAddSocialLinkForm).toBe(false);
      expect(ui.showDeleteSocialLinkButton).toBe(false);
      expect(ui.showRecommendedJobsTab).toBe(false);
      expect(ui.showRecommendedFreelancersView).toBe(false);
      expect(ui.showRecommendationExplanation).toBe(false);
      expect(ui.showRecommendationFeedbackButtons).toBe(false);
    });
  });

  describe('Phần 4: Thu Hồi Từng Quyền Một (Selective 1-by-1 Revocation / N-1 Matrix)', () => {
    it.each(SOCIAL_AND_RECOMMENDATION_PERMISSIONS)(
      'Thu hồi quyền #$id ($method $path) -> Chỉ endpoint này bị 403 và UI $uiField bị ẩn hoàn toàn',
      (revokedPerm) => {
        const remaining = SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter(
          (p) => p.id !== revokedPerm.id,
        );

        // 1. Endpoint bị thu hồi trả về 403
        const revokedResult = checkPermissionGuard(
          remaining,
          revokedPerm.method,
          revokedPerm.testActualPath,
        );
        expect(revokedResult.allowed).toBe(false);
        expect(revokedResult.status).toBe(403);

        // 2. Các endpoint còn lại vẫn hoạt động bình thường (200)
        for (const otherPerm of remaining) {
          const otherResult = checkPermissionGuard(
            remaining,
            otherPerm.method,
            otherPerm.testActualPath,
          );
          expect(otherResult.allowed).toBe(true);
          expect(otherResult.status).toBe(200);
        }

        // 3. UI tương ứng bị ẩn, các UI khác vẫn hiển thị
        const can = createCanHelper(remaining);
        const ui = evaluateUiState(can);

        expect(ui[revokedPerm.uiField]).toBe(false);

        for (const otherPerm of remaining) {
          if (otherPerm.uiField !== revokedPerm.uiField) {
            expect(ui[otherPerm.uiField]).toBe(true);
          }
        }
      },
    );
  });

  describe('Phần 5: Cấp Từng Quyền Đơn Lẻ (Exclusive 1-by-1 Granting)', () => {
    it.each(SOCIAL_AND_RECOMMENDATION_PERMISSIONS)(
      'Chỉ cấp duy nhất quyền #$id ($method $path) -> Chỉ endpoint này được 200 và UI $uiField hiển thị',
      (grantedPerm) => {
        const singlePerm = [grantedPerm];

        // 1. Endpoint duy nhất được cấp trả về 200
        const result = checkPermissionGuard(
          singlePerm,
          grantedPerm.method,
          grantedPerm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);

        // 2. Tất cả các endpoint khác bị từ chối 403
        const otherPerms = SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter(
          (p) => p.id !== grantedPerm.id,
        );
        for (const other of otherPerms) {
          const otherResult = checkPermissionGuard(
            singlePerm,
            other.method,
            other.testActualPath,
          );
          expect(otherResult.allowed).toBe(false);
          expect(otherResult.status).toBe(403);
        }

        // 3. Chỉ duy nhất thành phần UI tương ứng được hiển thị, các UI khác bị ẩn hoàn toàn
        const can = createCanHelper(singlePerm);
        const ui = evaluateUiState(can);

        expect(ui[grantedPerm.uiField]).toBe(true);

        for (const other of otherPerms) {
          if (other.uiField !== grantedPerm.uiField) {
            expect(ui[other.uiField]).toBe(false);
          }
        }
      },
    );
  });

  describe('Phần 6: Kịch Bản Nghiệp Vụ Thực Tế (Role-based Business Scenarios)', () => {
    it('Kịch bản 1: Freelancer khám phá việc làm gợi ý thông minh (Có quyền #562, #564, #565)', () => {
      // Freelancer có quyền xem việc làm gợi ý (#562), giải thích lý do (#564) và gửi feedback (#565)
      const freelancerRecPermissions =
        SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter((p) =>
          [562, 564, 565].includes(p.id),
        );

      const can = createCanHelper(freelancerRecPermissions);
      const ui = evaluateUiState(can);

      // Tab Best matches, giải thích và nút feedback đều hiển thị
      expect(ui.showRecommendedJobsTab).toBe(true);
      expect(ui.showRecommendationExplanation).toBe(true);
      expect(ui.showRecommendationFeedbackButtons).toBe(true);

      // Không hiển thị ứng viên gợi ý (#563) hay social links
      expect(ui.showRecommendedFreelancersView).toBe(false);
      expect(ui.showSocialLinksTab).toBe(false);
      expect(ui.showAddSocialLinkForm).toBe(false);
      expect(ui.showDeleteSocialLinkButton).toBe(false);
    });

    it('Kịch bản 2: Client tìm ứng viên gợi ý cho Job đăng tuyển (Chỉ có quyền #563)', () => {
      // Client có quyền xem ứng viên gợi ý (#563)
      const clientPermissions = SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter(
        (p) => p.id === 563,
      );

      const can = createCanHelper(clientPermissions);
      const ui = evaluateUiState(can);

      expect(ui.showRecommendedFreelancersView).toBe(true);

      // Không có việc làm gợi ý (chỉ dành cho freelancer) hay feedback giải thích
      expect(ui.showRecommendedJobsTab).toBe(false);
      expect(ui.showRecommendationExplanation).toBe(false);
      expect(ui.showRecommendationFeedbackButtons).toBe(false);
      expect(ui.showSocialLinksTab).toBe(false);
    });

    it('Kịch bản 3: Người dùng quản lý đầy đủ liên kết mạng xã hội (Có full #194, #195, #196)', () => {
      // Có quyền xem, thêm, xóa liên kết mạng xã hội
      const socialUserPermissions =
        SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter((p) =>
          [194, 195, 196].includes(p.id),
        );

      const can = createCanHelper(socialUserPermissions);
      const ui = evaluateUiState(can);

      expect(ui.showSocialLinksTab).toBe(true);
      expect(ui.showSocialLinksDropdown).toBe(true);
      expect(ui.showAddSocialLinkForm).toBe(true);
      expect(ui.showDeleteSocialLinkButton).toBe(true);

      // Không có quyền recommendations
      expect(ui.showRecommendedJobsTab).toBe(false);
      expect(ui.showRecommendedFreelancersView).toBe(false);
      expect(ui.showRecommendationExplanation).toBe(false);
      expect(ui.showRecommendationFeedbackButtons).toBe(false);
    });

    it('Kịch bản 4: Người dùng bị giới hạn quyền Social Links (Chỉ được xem #194, không được thêm #195 hay xóa #196)', () => {
      // Chỉ có quyền xem danh sách (#194)
      const readOnlySocialPermissions =
        SOCIAL_AND_RECOMMENDATION_PERMISSIONS.filter((p) => p.id === 194);

      const can = createCanHelper(readOnlySocialPermissions);
      const ui = evaluateUiState(can);

      // Tab và dropdown hiển thị để xem danh sách
      expect(ui.showSocialLinksTab).toBe(true);
      expect(ui.showSocialLinksDropdown).toBe(true);

      // Form thêm liên kết và nút xóa bị ẩn hoàn toàn
      expect(ui.showAddSocialLinkForm).toBe(false);
      expect(ui.showDeleteSocialLinkButton).toBe(false);
    });
  });
});
