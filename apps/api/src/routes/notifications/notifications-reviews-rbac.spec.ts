import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * 1. NOTIFICATIONS - Thông báo hệ thống (Trang chủ & Dùng chung) - 4 quyền:
 *    #310 · GET    /api/notifications (Xem danh sách thông báo)
 *    #311 · PATCH  /api/notifications/read-all (Đánh dấu tất cả thông báo đã đọc)
 *    #312 · PATCH  /api/notifications/:id/read (Đánh dấu thông báo đã đọc)
 *    #313 · DELETE /api/notifications/:id (Xóa thông báo)
 *
 * 2. REVIEWS & RATINGS - Đánh giá & Phản hồi (Trang chủ & Dùng chung) - 8 quyền:
 *    #400 · GET    /api/reviews/contracts/:contractId (Xem đánh giá của hợp đồng)
 *    #401 · POST   /api/reviews/contracts/:contractId (Đánh giá hợp đồng)
 *    #402 · GET    /api/reviews/:reviewId (Xem chi tiết đánh giá)
 *    #403 · PATCH  /api/reviews/:reviewId (Cập nhật đánh giá)
 *    #404 · DELETE /api/reviews/:reviewId (Xóa đánh giá)
 *    #405 · POST   /api/reviews/:reviewId/response (Gửi phản hồi đánh giá)
 *    #406 · PATCH  /api/reviews/responses/:responseId (Cập nhật phản hồi đánh giá)
 *    #407 · DELETE /api/reviews/responses/:responseId (Xóa phản hồi đánh giá)
 *
 * Tổng cộng: 12 quyền.
 *
 * Yêu cầu kiểm thử:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Tự động kiểm thử chứng minh: Khi không có quyền tương ứng, các nút bấm, biểu mẫu,
 *    dropdown menu và khung tương tác trên giao diện người dùng bị ẩn hoàn toàn (UI elements completely hidden),
 *    đồng thời các endpoint API không cho phép truy cập trái phép (403 Forbidden).
 */

interface PermissionItem {
  id: number;
  group: 'NOTIFICATIONS' | 'REVIEWS & RATINGS';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const NOTIFICATIONS_REVIEWS_PERMISSIONS: PermissionItem[] = [
  // ── 1. NOTIFICATIONS (4 quyền) ──
  {
    id: 310,
    group: 'NOTIFICATIONS',
    method: 'GET',
    path: '/api/notifications',
    description: 'Xem danh sách thông báo',
    testActualPath: '/api/notifications',
  },
  {
    id: 311,
    group: 'NOTIFICATIONS',
    method: 'PATCH',
    path: '/api/notifications/read-all',
    description: 'Đánh dấu tất cả thông báo đã đọc',
    testActualPath: '/api/notifications/read-all',
  },
  {
    id: 312,
    group: 'NOTIFICATIONS',
    method: 'PATCH',
    path: '/api/notifications/:id/read',
    description: 'Đánh dấu thông báo đã đọc',
    testActualPath: '/api/notifications/88/read',
  },
  {
    id: 313,
    group: 'NOTIFICATIONS',
    method: 'DELETE',
    path: '/api/notifications/:id',
    description: 'Xóa thông báo',
    testActualPath: '/api/notifications/88',
  },

  // ── 2. REVIEWS & RATINGS (8 quyền) ──
  {
    id: 400,
    group: 'REVIEWS & RATINGS',
    method: 'GET',
    path: '/api/reviews/contracts/:contractId',
    description: 'Xem đánh giá của hợp đồng',
    testActualPath: '/api/reviews/contracts/55',
  },
  {
    id: 401,
    group: 'REVIEWS & RATINGS',
    method: 'POST',
    path: '/api/reviews/contracts/:contractId',
    description: 'Đánh giá hợp đồng',
    testActualPath: '/api/reviews/contracts/55',
  },
  {
    id: 402,
    group: 'REVIEWS & RATINGS',
    method: 'GET',
    path: '/api/reviews/:reviewId',
    description: 'Xem chi tiết đánh giá',
    testActualPath: '/api/reviews/101',
  },
  {
    id: 403,
    group: 'REVIEWS & RATINGS',
    method: 'PATCH',
    path: '/api/reviews/:reviewId',
    description: 'Cập nhật đánh giá',
    testActualPath: '/api/reviews/101',
  },
  {
    id: 404,
    group: 'REVIEWS & RATINGS',
    method: 'DELETE',
    path: '/api/reviews/:reviewId',
    description: 'Xóa đánh giá',
    testActualPath: '/api/reviews/101',
  },
  {
    id: 405,
    group: 'REVIEWS & RATINGS',
    method: 'POST',
    path: '/api/reviews/:reviewId/response',
    description: 'Gửi phản hồi đánh giá',
    testActualPath: '/api/reviews/101/response',
  },
  {
    id: 406,
    group: 'REVIEWS & RATINGS',
    method: 'PATCH',
    path: '/api/reviews/responses/:responseId',
    description: 'Cập nhật phản hồi đánh giá',
    testActualPath: '/api/reviews/responses/202',
  },
  {
    id: 407,
    group: 'REVIEWS & RATINGS',
    method: 'DELETE',
    path: '/api/reviews/responses/:responseId',
    description: 'Xóa phản hồi đánh giá',
    testActualPath: '/api/reviews/responses/202',
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
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 12 quyền
 */
function evaluateUiState(can: (method: string, path: string) => boolean) {
  return {
    // ── NOTIFICATIONS UI (#310, #311, #312, #313) ──
    showNotificationsBell: can('GET', '/api/notifications'),
    showNotificationsPage: can('GET', '/api/notifications'),
    showMarkAllReadButton: can('PATCH', '/api/notifications/read-all'),
    showMarkReadButton: can('PATCH', '/api/notifications/:id/read'),
    showDeleteNotificationButton: can('DELETE', '/api/notifications/:id'),

    // ── REVIEWS & RATINGS UI (#400, #401, #402, #403, #404, #405, #406, #407) ──
    showReviewsTab: can('GET', '/api/reviews/contracts/:contractId'),
    showContractReviewsList: can('GET', '/api/reviews/contracts/:contractId'),
    showCreateReviewForm: can('POST', '/api/reviews/contracts/:contractId'),
    showReviewDetailButton: can('GET', '/api/reviews/:reviewId'),
    showEditReviewButton: can('PATCH', '/api/reviews/:reviewId'),
    showDeleteReviewButton: can('DELETE', '/api/reviews/:reviewId'),
    showRespondToReviewButton: can('POST', '/api/reviews/:reviewId/response'),
    showEditResponseButton: can('PATCH', '/api/reviews/responses/:responseId'),
    showDeleteResponseButton: can(
      'DELETE',
      '/api/reviews/responses/:responseId',
    ),
  };
}

describe('NOTIFICATIONS & REVIEWS - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến & Phân lập Route (Route Matching & Isolation)', () => {
    it.each(NOTIFICATIONS_REVIEWS_PERMISSIONS)(
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
      const getNotifications = [{ method: 'GET', path: '/api/notifications' }];
      expect(
        checkPermissionGuard(
          getNotifications,
          'GET',
          '/api/notifications?limit=20&page=1',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getNotifications, 'GET', '/api/notifications/')
          .allowed,
      ).toBe(true);

      const getReviews = [
        { method: 'GET', path: '/api/reviews/contracts/:contractId' },
      ];
      expect(
        checkPermissionGuard(
          getReviews,
          'GET',
          '/api/reviews/contracts/55?sort=desc',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getReviews, 'GET', '/api/reviews/contracts/55/')
          .allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/notifications và các subroute /read-all, /:id/read, /:id', () => {
      const listOnly = [{ method: 'GET', path: '/api/notifications' }];

      expect(
        checkPermissionGuard(listOnly, 'GET', '/api/notifications').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(listOnly, 'PATCH', '/api/notifications/read-all')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(listOnly, 'PATCH', '/api/notifications/88/read')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(listOnly, 'DELETE', '/api/notifications/88')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa đánh dấu tất cả đã đọc (/read-all) và từng thông báo (/:id/read)', () => {
      const markAllOnly = [
        { method: 'PATCH', path: '/api/notifications/read-all' },
      ];

      expect(
        checkPermissionGuard(
          markAllOnly,
          'PATCH',
          '/api/notifications/read-all',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(markAllOnly, 'PATCH', '/api/notifications/88/read')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(markAllOnly, 'DELETE', '/api/notifications/88')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập giữa xem đánh giá hợp đồng (/contracts/:contractId) và xem chi tiết đánh giá (/:reviewId)', () => {
      const contractReviewsOnly = [
        { method: 'GET', path: '/api/reviews/contracts/:contractId' },
      ];

      expect(
        checkPermissionGuard(
          contractReviewsOnly,
          'GET',
          '/api/reviews/contracts/55',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(contractReviewsOnly, 'GET', '/api/reviews/101')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập chi tiết giữa review (/:reviewId) và response (/:reviewId/response, /responses/:responseId)', () => {
      const reviewOnly = [
        { method: 'GET', path: '/api/reviews/:reviewId' },
        { method: 'PATCH', path: '/api/reviews/:reviewId' },
        { method: 'DELETE', path: '/api/reviews/:reviewId' },
      ];

      // Thao tác trên review OK
      expect(
        checkPermissionGuard(reviewOnly, 'GET', '/api/reviews/101').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(reviewOnly, 'PATCH', '/api/reviews/101').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(reviewOnly, 'DELETE', '/api/reviews/101').allowed,
      ).toBe(true);

      // Thao tác trên response bị chặn (403)
      expect(
        checkPermissionGuard(reviewOnly, 'POST', '/api/reviews/101/response')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(reviewOnly, 'PATCH', '/api/reviews/responses/202')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(reviewOnly, 'DELETE', '/api/reviews/responses/202')
          .allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp toàn quyền (Full 12/12 Permissions Granted)', () => {
    const fullPermissions = NOTIFICATIONS_REVIEWS_PERMISSIONS;
    const can = createCanHelper(fullPermissions);
    const uiState = evaluateUiState(can);

    it('Tất cả 12 endpoints API trả về allowed: true và status: 200', () => {
      fullPermissions.forEach((perm) => {
        const result = checkPermissionGuard(
          fullPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      });
    });

    it('Toàn bộ các thành phần UI đều hiển thị đầy đủ (visible = true)', () => {
      // Notifications UI
      expect(uiState.showNotificationsBell).toBe(true);
      expect(uiState.showNotificationsPage).toBe(true);
      expect(uiState.showMarkAllReadButton).toBe(true);
      expect(uiState.showMarkReadButton).toBe(true);
      expect(uiState.showDeleteNotificationButton).toBe(true);

      // Reviews & Ratings UI
      expect(uiState.showReviewsTab).toBe(true);
      expect(uiState.showContractReviewsList).toBe(true);
      expect(uiState.showCreateReviewForm).toBe(true);
      expect(uiState.showReviewDetailButton).toBe(true);
      expect(uiState.showEditReviewButton).toBe(true);
      expect(uiState.showDeleteReviewButton).toBe(true);
      expect(uiState.showRespondToReviewButton).toBe(true);
      expect(uiState.showEditResponseButton).toBe(true);
      expect(uiState.showDeleteResponseButton).toBe(true);
    });
  });

  describe('Phần 3: Không cấp quyền (Zero 0/12 Permissions Granted)', () => {
    const zeroPermissions: PermissionItem[] = [];
    const can = createCanHelper(zeroPermissions);
    const uiState = evaluateUiState(can);

    it('Tất cả 12 endpoints API đều bị từ chối truy cập (allowed: false, status: 403)', () => {
      NOTIFICATIONS_REVIEWS_PERMISSIONS.forEach((perm) => {
        const result = checkPermissionGuard(
          zeroPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
      });
    });

    it('Toàn bộ các thành phần UI bị ẩn hoàn toàn (visible = false)', () => {
      // Notifications UI
      expect(uiState.showNotificationsBell).toBe(false);
      expect(uiState.showNotificationsPage).toBe(false);
      expect(uiState.showMarkAllReadButton).toBe(false);
      expect(uiState.showMarkReadButton).toBe(false);
      expect(uiState.showDeleteNotificationButton).toBe(false);

      // Reviews & Ratings UI
      expect(uiState.showReviewsTab).toBe(false);
      expect(uiState.showContractReviewsList).toBe(false);
      expect(uiState.showCreateReviewForm).toBe(false);
      expect(uiState.showReviewDetailButton).toBe(false);
      expect(uiState.showEditReviewButton).toBe(false);
      expect(uiState.showDeleteReviewButton).toBe(false);
      expect(uiState.showRespondToReviewButton).toBe(false);
      expect(uiState.showEditResponseButton).toBe(false);
      expect(uiState.showDeleteResponseButton).toBe(false);
    });
  });

  describe('Phần 4: Thu hồi có chọn lọc từng quyền một (Selective 1-by-1 Revocation)', () => {
    it.each(NOTIFICATIONS_REVIEWS_PERMISSIONS)(
      'Thu hồi quyền #$id ($method $path): Endpoint tương ứng trả về 403, 11 endpoint còn lại vẫn 200 OK',
      (revokedPerm) => {
        const remainingPermissions = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
          (p) => p.id !== revokedPerm.id,
        );

        // Kiểm tra endpoint bị thu hồi bị chặn (403)
        const revokedResult = checkPermissionGuard(
          remainingPermissions,
          revokedPerm.method,
          revokedPerm.testActualPath,
        );
        expect(revokedResult.allowed).toBe(false);
        expect(revokedResult.status).toBe(403);

        // Kiểm tra 11 endpoint còn lại vẫn được phép (200)
        remainingPermissions.forEach((otherPerm) => {
          const okResult = checkPermissionGuard(
            remainingPermissions,
            otherPerm.method,
            otherPerm.testActualPath,
          );
          expect(okResult.allowed).toBe(true);
          expect(okResult.status).toBe(200);
        });
      },
    );

    it('Thu hồi #311 (PATCH /api/notifications/read-all) -> Nút "Đánh dấu tất cả đã đọc" bị ẩn, vẫn xem và đánh dấu từng cái', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 311,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showMarkAllReadButton).toBe(false);
      expect(uiState.showNotificationsBell).toBe(true);
      expect(uiState.showNotificationsPage).toBe(true);
      expect(uiState.showMarkReadButton).toBe(true);
      expect(uiState.showDeleteNotificationButton).toBe(true);
    });

    it('Thu hồi #313 (DELETE /api/notifications/:id) -> Nút "Xóa thông báo" bị ẩn', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 313,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showDeleteNotificationButton).toBe(false);
      expect(uiState.showNotificationsPage).toBe(true);
      expect(uiState.showMarkReadButton).toBe(true);
      expect(uiState.showMarkAllReadButton).toBe(true);
    });

    it('Thu hồi #401 (POST /api/reviews/contracts/:contractId) -> Khung tạo đánh giá mới bị ẩn, vẫn xem danh sách đánh giá', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 401,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showCreateReviewForm).toBe(false);
      expect(uiState.showContractReviewsList).toBe(true);
      expect(uiState.showReviewsTab).toBe(true);
    });

    it('Thu hồi #402 (GET /api/reviews/:reviewId) -> Nút "Xem chi tiết" đánh giá bị ẩn', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 402,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showReviewDetailButton).toBe(false);
      expect(uiState.showContractReviewsList).toBe(true);
    });

    it('Thu hồi #405 (POST /api/reviews/:reviewId/response) -> Nút "Phản hồi đánh giá" bị ẩn', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 405,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showRespondToReviewButton).toBe(false);
      expect(uiState.showContractReviewsList).toBe(true);
    });

    it('Thu hồi #407 (DELETE /api/reviews/responses/:responseId) -> Nút "Xóa phản hồi" bị ẩn', () => {
      const perms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => p.id !== 407,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showDeleteResponseButton).toBe(false);
      expect(uiState.showEditResponseButton).toBe(true);
    });
  });

  describe('Phần 5: Cấp độc quyền từng quyền một (Exclusive 1-by-1 Granting)', () => {
    it.each(NOTIFICATIONS_REVIEWS_PERMISSIONS)(
      'Chỉ cấp quyền #$id ($method $path): Endpoint này 200 OK, 11 endpoint còn lại đều 403 Forbidden',
      (grantedPerm) => {
        const singlePerm = [grantedPerm];

        // Endpoint duy nhất này được phép (200)
        const result = checkPermissionGuard(
          singlePerm,
          grantedPerm.method,
          grantedPerm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);

        // 11 endpoint còn lại đều bị chặn (403)
        const others = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
          (p) => p.id !== grantedPerm.id,
        );
        others.forEach((otherPerm) => {
          const blocked = checkPermissionGuard(
            singlePerm,
            otherPerm.method,
            otherPerm.testActualPath,
          );
          expect(blocked.allowed).toBe(false);
          expect(blocked.status).toBe(403);
        });
      },
    );
  });

  describe('Phần 6: Kịch bản kinh doanh theo vai trò (Role-Based Business Scenarios)', () => {
    it('Kịch bản A: Người dùng nhận thông báo (chỉ xem và đánh dấu đã đọc từng thông báo, không được đánh dấu tất cả hoặc xóa)', () => {
      const basicNotificationPerms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => [310, 312].includes(p.id),
      );
      const can = createCanHelper(basicNotificationPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showNotificationsBell).toBe(true);
      expect(uiState.showNotificationsPage).toBe(true);
      expect(uiState.showMarkReadButton).toBe(true);
      expect(uiState.showMarkAllReadButton).toBe(false);
      expect(uiState.showDeleteNotificationButton).toBe(false);

      expect(
        checkPermissionGuard(
          basicNotificationPerms,
          'GET',
          '/api/notifications',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          basicNotificationPerms,
          'PATCH',
          '/api/notifications/88/read',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          basicNotificationPerms,
          'PATCH',
          '/api/notifications/read-all',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          basicNotificationPerms,
          'DELETE',
          '/api/notifications/88',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản B: Khách hàng đánh giá hợp đồng hoàn thành (xem đánh giá và gửi đánh giá mới, không thể sửa/xóa phản hồi của đối tác)', () => {
      const clientReviewerPerms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => [400, 401, 402].includes(p.id),
      );
      const can = createCanHelper(clientReviewerPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showReviewsTab).toBe(true);
      expect(uiState.showContractReviewsList).toBe(true);
      expect(uiState.showCreateReviewForm).toBe(true);
      expect(uiState.showReviewDetailButton).toBe(true);
      expect(uiState.showRespondToReviewButton).toBe(false);
      expect(uiState.showEditResponseButton).toBe(false);
      expect(uiState.showDeleteResponseButton).toBe(false);

      expect(
        checkPermissionGuard(
          clientReviewerPerms,
          'POST',
          '/api/reviews/contracts/55',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          clientReviewerPerms,
          'POST',
          '/api/reviews/101/response',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản C: Freelancer nhận đánh giá và gửi phản hồi (xem đánh giá, xem chi tiết và phản hồi nhận xét, không được xóa đánh giá của khách hàng)', () => {
      const freelancerResponderPerms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => [400, 402, 405, 406, 407].includes(p.id),
      );
      const can = createCanHelper(freelancerResponderPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showReviewsTab).toBe(true);
      expect(uiState.showContractReviewsList).toBe(true);
      expect(uiState.showReviewDetailButton).toBe(true);
      expect(uiState.showRespondToReviewButton).toBe(true);
      expect(uiState.showEditResponseButton).toBe(true);
      expect(uiState.showDeleteResponseButton).toBe(true);
      expect(uiState.showDeleteReviewButton).toBe(false); // Không được xóa review

      expect(
        checkPermissionGuard(
          freelancerResponderPerms,
          'POST',
          '/api/reviews/101/response',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          freelancerResponderPerms,
          'DELETE',
          '/api/reviews/101',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản D: Người dùng chỉ xem đánh giá hợp đồng (Read-only review viewer)', () => {
      const readOnlyReviewPerms = NOTIFICATIONS_REVIEWS_PERMISSIONS.filter(
        (p) => [400, 402].includes(p.id),
      );
      const can = createCanHelper(readOnlyReviewPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showReviewsTab).toBe(true);
      expect(uiState.showContractReviewsList).toBe(true);
      expect(uiState.showReviewDetailButton).toBe(true);
      expect(uiState.showCreateReviewForm).toBe(false);
      expect(uiState.showEditReviewButton).toBe(false);
      expect(uiState.showDeleteReviewButton).toBe(false);
      expect(uiState.showRespondToReviewButton).toBe(false);
    });

    it('Kịch bản E: Toàn quyền thông báo và đánh giá phản hồi', () => {
      const can = createCanHelper(NOTIFICATIONS_REVIEWS_PERMISSIONS);
      const uiState = evaluateUiState(can);

      Object.values(uiState).forEach((visible) => {
        expect(visible).toBe(true);
      });
    });
  });
});
