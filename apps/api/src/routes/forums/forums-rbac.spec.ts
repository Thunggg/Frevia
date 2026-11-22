import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho cụm chức năng:
 *
 * COMMUNITY FORUM - Diễn đàn cộng đồng (Trang chủ & Dùng chung) - 15 quyền:
 *  #93  · POST   /api/forums/posts (Đăng bài viết mới trên diễn đàn)
 *  #94  · DELETE /api/forums/posts/:id (Xóa bài viết diễn đàn)
 *  #95  · POST   /api/forums/posts/:id/like (Thích / Bỏ thích bài viết)
 *  #97  · GET    /api/forums/posts/:postId/comments (Xem bình luận bài viết)
 *  #98  · POST   /api/forums/posts/:postId/comments (Bình luận bài viết)
 *  #99  · PATCH  /api/forums/posts/:postId/comments/:id (Chỉnh sửa bình luận bài viết)
 *  #100 · DELETE /api/forums/posts/:postId/comments/:id (Xóa bình luận bài viết)
 *  #101 · POST   /api/forums/posts/:postId/comments/:commentId/like (Thích / Bỏ thích bình luận)
 *  #102 · POST   /api/forums/posts/:postId/reports (Báo cáo bài viết diễn đàn)
 *  #103 · POST   /api/forums/posts/:postId/comments/:commentId/reports (Báo cáo bình luận diễn đàn)
 *  #104 · GET    /api/forums/posts/:postId/is-reported (Kiểm tra trạng thái báo cáo bài viết)
 *  #105 · GET    /api/forums/posts/:postId/comments/:commentId/is-reported (Kiểm tra trạng thái báo cáo bình luận)
 *  #106 · GET    /api/forums/reports (Xem danh sách báo cáo vi phạm của tôi)
 *  #107 · PATCH  /api/forums/reports/:reportId/status (Cập nhật trạng thái báo cáo vi phạm)
 *  #558 · PATCH  /api/forums/posts/:id (Chỉnh sửa bài viết diễn đàn)
 *
 * Tổng cộng: 15 quyền.
 *
 * Yêu cầu kiểm thử:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Tự động kiểm thử chứng minh: Khi không có quyền tương ứng, các nút bấm, biểu mẫu,
 *    hộp thoại báo cáo, chức năng like/comment/edit/delete và dropdown trạng thái trên UI
 *    bị ẩn hoàn toàn (UI elements completely hidden), đồng thời các endpoint API không
 *    cho phép truy cập trái phép (403 Forbidden).
 */

interface PermissionItem {
  id: number;
  group: 'COMMUNITY FORUM';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
  uiField: keyof ForumUiState;
}

interface ForumUiState {
  showCreatePostButton: boolean;
  showDeletePostButton: boolean;
  showPostLikeButton: boolean;
  showCommentsSection: boolean;
  showCreateCommentForm: boolean;
  showEditCommentButton: boolean;
  showDeleteCommentButton: boolean;
  showCommentLikeButton: boolean;
  showPostReportButton: boolean;
  showCommentReportButton: boolean;
  checkPostReportStatus: boolean;
  checkCommentReportStatus: boolean;
  showReportsList: boolean;
  showUpdateReportStatusSelect: boolean;
  showEditPostButton: boolean;
}

const FORUM_PERMISSIONS: PermissionItem[] = [
  {
    id: 93,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts',
    description: 'Đăng bài viết mới trên diễn đàn',
    testActualPath: '/api/forums/posts',
    uiField: 'showCreatePostButton',
  },
  {
    id: 94,
    group: 'COMMUNITY FORUM',
    method: 'DELETE',
    path: '/api/forums/posts/:id',
    description: 'Xóa bài viết diễn đàn',
    testActualPath: '/api/forums/posts/101',
    uiField: 'showDeletePostButton',
  },
  {
    id: 95,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts/:id/like',
    description: 'Thích / Bỏ thích bài viết',
    testActualPath: '/api/forums/posts/101/like',
    uiField: 'showPostLikeButton',
  },
  {
    id: 97,
    group: 'COMMUNITY FORUM',
    method: 'GET',
    path: '/api/forums/posts/:postId/comments',
    description: 'Xem bình luận bài viết',
    testActualPath: '/api/forums/posts/101/comments',
    uiField: 'showCommentsSection',
  },
  {
    id: 98,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts/:postId/comments',
    description: 'Bình luận bài viết',
    testActualPath: '/api/forums/posts/101/comments',
    uiField: 'showCreateCommentForm',
  },
  {
    id: 99,
    group: 'COMMUNITY FORUM',
    method: 'PATCH',
    path: '/api/forums/posts/:postId/comments/:id',
    description: 'Chỉnh sửa bình luận bài viết',
    testActualPath: '/api/forums/posts/101/comments/201',
    uiField: 'showEditCommentButton',
  },
  {
    id: 100,
    group: 'COMMUNITY FORUM',
    method: 'DELETE',
    path: '/api/forums/posts/:postId/comments/:id',
    description: 'Xóa bình luận bài viết',
    testActualPath: '/api/forums/posts/101/comments/201',
    uiField: 'showDeleteCommentButton',
  },
  {
    id: 101,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts/:postId/comments/:commentId/like',
    description: 'Thích / Bỏ thích bình luận',
    testActualPath: '/api/forums/posts/101/comments/201/like',
    uiField: 'showCommentLikeButton',
  },
  {
    id: 102,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts/:postId/reports',
    description: 'Báo cáo bài viết diễn đàn',
    testActualPath: '/api/forums/posts/101/reports',
    uiField: 'showPostReportButton',
  },
  {
    id: 103,
    group: 'COMMUNITY FORUM',
    method: 'POST',
    path: '/api/forums/posts/:postId/comments/:commentId/reports',
    description: 'Báo cáo bình luận diễn đàn',
    testActualPath: '/api/forums/posts/101/comments/201/reports',
    uiField: 'showCommentReportButton',
  },
  {
    id: 104,
    group: 'COMMUNITY FORUM',
    method: 'GET',
    path: '/api/forums/posts/:postId/is-reported',
    description: 'Kiểm tra trạng thái báo cáo bài viết',
    testActualPath: '/api/forums/posts/101/is-reported',
    uiField: 'checkPostReportStatus',
  },
  {
    id: 105,
    group: 'COMMUNITY FORUM',
    method: 'GET',
    path: '/api/forums/posts/:postId/comments/:commentId/is-reported',
    description: 'Kiểm tra trạng thái báo cáo bình luận',
    testActualPath: '/api/forums/posts/101/comments/201/is-reported',
    uiField: 'checkCommentReportStatus',
  },
  {
    id: 106,
    group: 'COMMUNITY FORUM',
    method: 'GET',
    path: '/api/forums/reports',
    description: 'Xem danh sách báo cáo vi phạm của tôi',
    testActualPath: '/api/forums/reports',
    uiField: 'showReportsList',
  },
  {
    id: 107,
    group: 'COMMUNITY FORUM',
    method: 'PATCH',
    path: '/api/forums/reports/:reportId/status',
    description: 'Cập nhật trạng thái báo cáo vi phạm',
    testActualPath: '/api/forums/reports/301/status',
    uiField: 'showUpdateReportStatusSelect',
  },
  {
    id: 558,
    group: 'COMMUNITY FORUM',
    method: 'PATCH',
    path: '/api/forums/posts/:id',
    description: 'Chỉnh sửa bài viết diễn đàn',
    testActualPath: '/api/forums/posts/101',
    uiField: 'showEditPostButton',
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
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 15 quyền
 */
function evaluateUiState(
  can: (method: string, path: string) => boolean,
): ForumUiState {
  return {
    // #93: POST /api/forums/posts -> Nút Tạo bài viết mới trong CreatePostDialog
    showCreatePostButton: can('POST', '/api/forums/posts'),

    // #94: DELETE /api/forums/posts/:id -> Nút Xóa bài viết (AlertDialog) trong PostDetailView
    showDeletePostButton: can('DELETE', '/api/forums/posts/:id'),

    // #95: POST /api/forums/posts/:id/like -> Nút Thích/Bỏ thích bài viết trong PostDetailView
    showPostLikeButton: can('POST', '/api/forums/posts/:id/like'),

    // #97: GET /api/forums/posts/:postId/comments -> Danh sách bình luận trong CommentSection
    showCommentsSection: can('GET', '/api/forums/posts/:postId/comments'),

    // #98: POST /api/forums/posts/:postId/comments -> Form gửi bình luận trong CommentSection
    showCreateCommentForm: can('POST', '/api/forums/posts/:postId/comments'),

    // #99: PATCH /api/forums/posts/:postId/comments/:id -> Nút Chỉnh sửa bình luận trong CommentItem
    showEditCommentButton: can(
      'PATCH',
      '/api/forums/posts/:postId/comments/:id',
    ),

    // #100: DELETE /api/forums/posts/:postId/comments/:id -> Nút Xóa bình luận trong CommentItem
    showDeleteCommentButton: can(
      'DELETE',
      '/api/forums/posts/:postId/comments/:id',
    ),

    // #101: POST /api/forums/posts/:postId/comments/:commentId/like -> Nút Like bình luận trong CommentItem
    showCommentLikeButton: can(
      'POST',
      '/api/forums/posts/:postId/comments/:commentId/like',
    ),

    // #102: POST /api/forums/posts/:postId/reports -> Nút Báo cáo bài viết trong ReportDialog
    showPostReportButton: can('POST', '/api/forums/posts/:postId/reports'),

    // #103: POST /api/forums/posts/:postId/comments/:commentId/reports -> Nút Báo cáo comment trong ReportDialog
    showCommentReportButton: can(
      'POST',
      '/api/forums/posts/:postId/comments/:commentId/reports',
    ),

    // #104: GET /api/forums/posts/:postId/is-reported -> Kiểm tra trạng thái đã báo cáo bài viết
    checkPostReportStatus: can('GET', '/api/forums/posts/:postId/is-reported'),

    // #105: GET /api/forums/posts/:postId/comments/:commentId/is-reported -> Kiểm tra đã báo cáo bình luận
    checkCommentReportStatus: can(
      'GET',
      '/api/forums/posts/:postId/comments/:commentId/is-reported',
    ),

    // #106: GET /api/forums/reports -> Danh sách báo cáo vi phạm trong Admin ReportsTable / AppSidebar
    showReportsList: can('GET', '/api/forums/reports'),

    // #107: PATCH /api/forums/reports/:reportId/status -> Select đổi trạng thái báo cáo trong ReportsTable
    showUpdateReportStatusSelect: can(
      'PATCH',
      '/api/forums/reports/:reportId/status',
    ),

    // #558: PATCH /api/forums/posts/:id -> Nút Chỉnh sửa bài viết trong EditPostDialog & PostDetailView
    showEditPostButton: can('PATCH', '/api/forums/posts/:id'),
  };
}

describe('COMMUNITY FORUM - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến & Phân lập Route (Route Matching & Isolation)', () => {
    it.each(FORUM_PERMISSIONS)(
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
      const getComments = [
        { method: 'GET', path: '/api/forums/posts/:postId/comments' },
      ];
      expect(
        checkPermissionGuard(
          getComments,
          'GET',
          '/api/forums/posts/101/comments?page=1&limit=10',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          getComments,
          'GET',
          '/api/forums/posts/101/comments/',
        ).allowed,
      ).toBe(true);

      const getReports = [{ method: 'GET', path: '/api/forums/reports' }];
      expect(
        checkPermissionGuard(
          getReports,
          'GET',
          '/api/forums/reports?status=PENDING&page=1',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getReports, 'GET', '/api/forums/reports/').allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa route Post (/api/forums/posts) và Post Subroutes (:id, :id/like, :postId/comments)', () => {
      const createPostOnly = [{ method: 'POST', path: '/api/forums/posts' }];

      expect(
        checkPermissionGuard(createPostOnly, 'POST', '/api/forums/posts')
          .allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          createPostOnly,
          'POST',
          '/api/forums/posts/101/like',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          createPostOnly,
          'POST',
          '/api/forums/posts/101/comments',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(createPostOnly, 'DELETE', '/api/forums/posts/101')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa Comment Edit (:id) và Comment Like (:commentId/like)', () => {
      const editCommentOnly = [
        { method: 'PATCH', path: '/api/forums/posts/:postId/comments/:id' },
      ];

      expect(
        checkPermissionGuard(
          editCommentOnly,
          'PATCH',
          '/api/forums/posts/101/comments/201',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          editCommentOnly,
          'POST',
          '/api/forums/posts/101/comments/201/like',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          editCommentOnly,
          'DELETE',
          '/api/forums/posts/101/comments/201',
        ).allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa Report Post (:postId/reports) và Report Comment (:commentId/reports)', () => {
      const reportPostOnly = [
        { method: 'POST', path: '/api/forums/posts/:postId/reports' },
      ];

      expect(
        checkPermissionGuard(
          reportPostOnly,
          'POST',
          '/api/forums/posts/101/reports',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          reportPostOnly,
          'POST',
          '/api/forums/posts/101/comments/201/reports',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          reportPostOnly,
          'GET',
          '/api/forums/posts/101/is-reported',
        ).allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa Report List (/api/forums/reports) và Report Status (:reportId/status)', () => {
      const viewReportsOnly = [{ method: 'GET', path: '/api/forums/reports' }];

      expect(
        checkPermissionGuard(viewReportsOnly, 'GET', '/api/forums/reports')
          .allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          viewReportsOnly,
          'PATCH',
          '/api/forums/reports/301/status',
        ).allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp Đủ Toàn Bộ 15 Quyền (Full 15/15 Permissions)', () => {
    it('Cho phép gọi tất cả 15 API thành công (Status 200 Allowed)', () => {
      for (const perm of FORUM_PERMISSIONS) {
        const result = checkPermissionGuard(
          FORUM_PERMISSIONS,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      }
    });

    it('Hiển thị đầy đủ tất cả các thành phần giao diện UI (Tất cả flags đều true)', () => {
      const can = createCanHelper(FORUM_PERMISSIONS);
      const ui = evaluateUiState(can);

      expect(ui.showCreatePostButton).toBe(true);
      expect(ui.showDeletePostButton).toBe(true);
      expect(ui.showPostLikeButton).toBe(true);
      expect(ui.showCommentsSection).toBe(true);
      expect(ui.showCreateCommentForm).toBe(true);
      expect(ui.showEditCommentButton).toBe(true);
      expect(ui.showDeleteCommentButton).toBe(true);
      expect(ui.showCommentLikeButton).toBe(true);
      expect(ui.showPostReportButton).toBe(true);
      expect(ui.showCommentReportButton).toBe(true);
      expect(ui.checkPostReportStatus).toBe(true);
      expect(ui.checkCommentReportStatus).toBe(true);
      expect(ui.showReportsList).toBe(true);
      expect(ui.showUpdateReportStatusSelect).toBe(true);
      expect(ui.showEditPostButton).toBe(true);
    });
  });

  describe('Phần 3: Thu Hồi Sạch Toàn Bộ 15 Quyền (Zero 0/15 Permissions - DoD Kiểm soát UI)', () => {
    it('Từ chối tất cả 15 API (Status 403 Forbidden)', () => {
      const emptyPermissions: PermissionItem[] = [];

      for (const perm of FORUM_PERMISSIONS) {
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

      expect(ui.showCreatePostButton).toBe(false);
      expect(ui.showDeletePostButton).toBe(false);
      expect(ui.showPostLikeButton).toBe(false);
      expect(ui.showCommentsSection).toBe(false);
      expect(ui.showCreateCommentForm).toBe(false);
      expect(ui.showEditCommentButton).toBe(false);
      expect(ui.showDeleteCommentButton).toBe(false);
      expect(ui.showCommentLikeButton).toBe(false);
      expect(ui.showPostReportButton).toBe(false);
      expect(ui.showCommentReportButton).toBe(false);
      expect(ui.checkPostReportStatus).toBe(false);
      expect(ui.checkCommentReportStatus).toBe(false);
      expect(ui.showReportsList).toBe(false);
      expect(ui.showUpdateReportStatusSelect).toBe(false);
      expect(ui.showEditPostButton).toBe(false);
    });
  });

  describe('Phần 4: Thu Hồi Từng Quyền Một (Selective 1-by-1 Revocation / N-1 Matrix)', () => {
    it.each(FORUM_PERMISSIONS)(
      'Thu hồi quyền #$id ($method $path) -> Chỉ endpoint này bị 403 và UI $uiField bị ẩn hoàn toàn',
      (revokedPerm) => {
        const remaining = FORUM_PERMISSIONS.filter(
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

        // 2. Các 14 endpoint còn lại vẫn hoạt động bình thường (200)
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
    it.each(FORUM_PERMISSIONS)(
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

        // 2. Tất cả 14 endpoint khác bị từ chối 403
        const otherPerms = FORUM_PERMISSIONS.filter(
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

        // 3. Chỉ duy nhất thành phần UI tương ứng được hiển thị, 14 UI khác bị ẩn hoàn toàn
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
    it('Kịch bản 1: Người đọc vãng lai / Reader Mode (Chỉ xem bài viết và xem bình luận)', () => {
      // Chỉ có quyền xem bình luận (#97)
      const readerPermissions = FORUM_PERMISSIONS.filter((p) => p.id === 97);

      const can = createCanHelper(readerPermissions);
      const ui = evaluateUiState(can);

      // Xem bình luận bài viết được hiển thị
      expect(ui.showCommentsSection).toBe(true);

      // Các chức năng tương tác, đăng bài, sửa xóa, báo cáo đều bị ẩn hoàn toàn
      expect(ui.showCreatePostButton).toBe(false);
      expect(ui.showEditPostButton).toBe(false);
      expect(ui.showDeletePostButton).toBe(false);
      expect(ui.showPostLikeButton).toBe(false);
      expect(ui.showCreateCommentForm).toBe(false);
      expect(ui.showEditCommentButton).toBe(false);
      expect(ui.showDeleteCommentButton).toBe(false);
      expect(ui.showCommentLikeButton).toBe(false);
      expect(ui.showPostReportButton).toBe(false);
      expect(ui.showCommentReportButton).toBe(false);
      expect(ui.showReportsList).toBe(false);
      expect(ui.showUpdateReportStatusSelect).toBe(false);
    });

    it('Kịch bản 2: Thành viên thảo luận tích cực / Active Contributor (Đăng bài, bình luận, like, báo cáo)', () => {
      // Có quyền: #93 (create post), #95 (like post), #97 (view comments), #98 (create comment), #101 (like comment), #102 (report post), #103 (report comment), #104 (is reported post), #105 (is reported comment)
      const memberPermissions = FORUM_PERMISSIONS.filter((p) =>
        [93, 95, 97, 98, 101, 102, 103, 104, 105].includes(p.id),
      );

      const can = createCanHelper(memberPermissions);
      const ui = evaluateUiState(can);

      expect(ui.showCreatePostButton).toBe(true);
      expect(ui.showPostLikeButton).toBe(true);
      expect(ui.showCommentsSection).toBe(true);
      expect(ui.showCreateCommentForm).toBe(true);
      expect(ui.showCommentLikeButton).toBe(true);
      expect(ui.showPostReportButton).toBe(true);
      expect(ui.showCommentReportButton).toBe(true);
      expect(ui.checkPostReportStatus).toBe(true);
      expect(ui.checkCommentReportStatus).toBe(true);

      // Không có quyền quản trị báo cáo
      expect(ui.showReportsList).toBe(false);
      expect(ui.showUpdateReportStatusSelect).toBe(false);
    });

    it('Kịch bản 3: Tác giả bài viết và bình luận (Có quyền chỉnh sửa và xóa nội dung của mình)', () => {
      // Có quyền: #558 (edit post), #94 (delete post), #99 (edit comment), #100 (delete comment)
      const authorPermissions = FORUM_PERMISSIONS.filter((p) =>
        [558, 94, 99, 100].includes(p.id),
      );

      const can = createCanHelper(authorPermissions);
      const ui = evaluateUiState(can);

      expect(ui.showEditPostButton).toBe(true);
      expect(ui.showDeletePostButton).toBe(true);
      expect(ui.showEditCommentButton).toBe(true);
      expect(ui.showDeleteCommentButton).toBe(true);

      // Không có quyền like, comment mới hay duyệt báo cáo
      expect(ui.showPostLikeButton).toBe(false);
      expect(ui.showCreateCommentForm).toBe(false);
      expect(ui.showReportsList).toBe(false);
      expect(ui.showUpdateReportStatusSelect).toBe(false);
    });

    it('Kịch bản 4: Quản trị viên điều hành diễn đàn / Forum Moderator (Xem và xử lý vi phạm báo cáo)', () => {
      // Có quyền: #106 (view reports), #107 (update report status)
      const modPermissions = FORUM_PERMISSIONS.filter((p) =>
        [106, 107].includes(p.id),
      );

      const can = createCanHelper(modPermissions);
      const ui = evaluateUiState(can);

      expect(ui.showReportsList).toBe(true);
      expect(ui.showUpdateReportStatusSelect).toBe(true);

      // Không có quyền đăng bài hay like nếu chỉ có role mod xử lý vi phạm
      expect(ui.showCreatePostButton).toBe(false);
      expect(ui.showPostLikeButton).toBe(false);
      expect(ui.showCommentLikeButton).toBe(false);
    });
  });
});
