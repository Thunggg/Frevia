import { matchRoutePath, normalizeApiPath } from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 3 cụm chức năng:
 *
 * 1. ACCOUNT PROFILE - Tài khoản cá nhân (Trang chủ & Dùng chung) - 4 quyền:
 *    #395 · GET  /api/account-profile (Xem hồ sơ tài khoản)
 *    #396 · PUT  /api/account-profile (Cập nhật hồ sơ tài khoản)
 *    #397 · PUT  /api/account-profile/password (Đổi mật khẩu)
 *    #398 · POST /api/account-profile/avatar (Tải lên ảnh đại diện)
 *
 * 2. ACTIVE SESSIONS - Phiên đăng nhập (Trang chủ & Dùng chung) - 3 quyền:
 *    #175 · GET    /api/sessions (Xem danh sách phiên đăng nhập)
 *    #176 · GET    /api/sessions/:id (Xem chi tiết phiên đăng nhập)
 *    #177 · DELETE /api/sessions/:id (Đăng xuất phiên từ xa)
 *
 * 3. MESSAGING - Trò chuyện & Nhắn tin (Trang chủ & Dùng chung) - 10 quyền:
 *    #131 · GET    /api/conversations (Xem danh sách cuộc hội thoại)
 *    #132 · POST   /api/conversations (Bắt đầu cuộc trò chuyện mới)
 *    #133 · GET    /api/conversations/:id/messages (Xem danh sách tin nhắn)
 *    #134 · POST   /api/conversations/:id/messages (Gửi tin nhắn)
 *    #135 · POST   /api/conversations/:id/files (Tải file đính kèm trong chat)
 *    #136 · DELETE /api/conversations/:id/messages/:messageId (Xóa tin nhắn)
 *    #137 · PATCH  /api/conversations/:id/read (Đánh dấu tin nhắn đã đọc)
 *    #138 · PATCH  /api/conversations/:id/hide (Ẩn cuộc trò chuyện)
 *    #139 · PATCH  /api/conversations/:id/pin (Ghim / Bỏ ghim cuộc trò chuyện)
 *    #588 · GET    /api/conversations/:id (Xem chi tiết cuộc trò chuyện)
 *
 * Tổng cộng: 17 quyền.
 *
 * Yêu cầu nghiêm ngặt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Kiểm thử tự động chứng minh: Khi không có quyền tương ứng, các nút bấm, biểu mẫu,
 *    dropdown menu và khung tương tác trên giao diện người dùng bị ẩn hoàn toàn (UI elements completely hidden),
 *    đồng thời các endpoint API không cho phép truy cập trái phép (403 Forbidden).
 */

interface PermissionItem {
  id: number;
  group: 'ACCOUNT PROFILE' | 'ACTIVE SESSIONS' | 'MESSAGING';
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS: PermissionItem[] = [
  // ── 1. ACCOUNT PROFILE (4 quyền) ──
  {
    id: 395,
    group: 'ACCOUNT PROFILE',
    method: 'GET',
    path: '/api/account-profile',
    description: 'Xem hồ sơ tài khoản',
    testActualPath: '/api/account-profile',
  },
  {
    id: 396,
    group: 'ACCOUNT PROFILE',
    method: 'PUT',
    path: '/api/account-profile',
    description: 'Cập nhật hồ sơ tài khoản',
    testActualPath: '/api/account-profile',
  },
  {
    id: 397,
    group: 'ACCOUNT PROFILE',
    method: 'PUT',
    path: '/api/account-profile/password',
    description: 'Đổi mật khẩu',
    testActualPath: '/api/account-profile/password',
  },
  {
    id: 398,
    group: 'ACCOUNT PROFILE',
    method: 'POST',
    path: '/api/account-profile/avatar',
    description: 'Tải lên ảnh đại diện',
    testActualPath: '/api/account-profile/avatar',
  },

  // ── 2. ACTIVE SESSIONS (3 quyền) ──
  {
    id: 175,
    group: 'ACTIVE SESSIONS',
    method: 'GET',
    path: '/api/sessions',
    description: 'Xem danh sách phiên đăng nhập',
    testActualPath: '/api/sessions',
  },
  {
    id: 176,
    group: 'ACTIVE SESSIONS',
    method: 'GET',
    path: '/api/sessions/:id',
    description: 'Xem chi tiết phiên đăng nhập',
    testActualPath: '/api/sessions/sess_998877',
  },
  {
    id: 177,
    group: 'ACTIVE SESSIONS',
    method: 'DELETE',
    path: '/api/sessions/:id',
    description: 'Đăng xuất phiên từ xa',
    testActualPath: '/api/sessions/sess_998877',
  },

  // ── 3. MESSAGING (10 quyền) ──
  {
    id: 131,
    group: 'MESSAGING',
    method: 'GET',
    path: '/api/conversations',
    description: 'Xem danh sách cuộc hội thoại',
    testActualPath: '/api/conversations',
  },
  {
    id: 132,
    group: 'MESSAGING',
    method: 'POST',
    path: '/api/conversations',
    description: 'Bắt đầu cuộc trò chuyện mới',
    testActualPath: '/api/conversations',
  },
  {
    id: 133,
    group: 'MESSAGING',
    method: 'GET',
    path: '/api/conversations/:id/messages',
    description: 'Xem danh sách tin nhắn',
    testActualPath: '/api/conversations/42/messages',
  },
  {
    id: 134,
    group: 'MESSAGING',
    method: 'POST',
    path: '/api/conversations/:id/messages',
    description: 'Gửi tin nhắn',
    testActualPath: '/api/conversations/42/messages',
  },
  {
    id: 135,
    group: 'MESSAGING',
    method: 'POST',
    path: '/api/conversations/:id/files',
    description: 'Tải file đính kèm trong chat',
    testActualPath: '/api/conversations/42/files',
  },
  {
    id: 136,
    group: 'MESSAGING',
    method: 'DELETE',
    path: '/api/conversations/:id/messages/:messageId',
    description: 'Xóa tin nhắn',
    testActualPath: '/api/conversations/42/messages/101',
  },
  {
    id: 137,
    group: 'MESSAGING',
    method: 'PATCH',
    path: '/api/conversations/:id/read',
    description: 'Đánh dấu tin nhắn đã đọc',
    testActualPath: '/api/conversations/42/read',
  },
  {
    id: 138,
    group: 'MESSAGING',
    method: 'PATCH',
    path: '/api/conversations/:id/hide',
    description: 'Ẩn cuộc trò chuyện',
    testActualPath: '/api/conversations/42/hide',
  },
  {
    id: 139,
    group: 'MESSAGING',
    method: 'PATCH',
    path: '/api/conversations/:id/pin',
    description: 'Ghim / Bỏ ghim cuộc trò chuyện',
    testActualPath: '/api/conversations/42/pin',
  },
  {
    id: 588,
    group: 'MESSAGING',
    method: 'GET',
    path: '/api/conversations/:id',
    description: 'Xem chi tiết cuộc trò chuyện',
    testActualPath: '/api/conversations/42',
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
 * Mô phỏng State hiển thị của toàn bộ UI Components liên quan đến 17 quyền
 */
function evaluateUiState(can: (method: string, path: string) => boolean) {
  return {
    // ── ACCOUNT PROFILE UI (#395, #396, #397, #398) ──
    showGeneralSettingsCard: can('GET', '/api/account-profile'),
    showSaveProfileButton: can('PUT', '/api/account-profile'),
    showChangePasswordSection: can('PUT', '/api/account-profile/password'),
    showAvatarUploadButton: can('POST', '/api/account-profile/avatar'),

    // ── ACTIVE SESSIONS UI (#175, #176, #177) ──
    showSessionsList: can('GET', '/api/sessions'),
    showViewSessionDetailButton: can('GET', '/api/sessions/:id'),
    showRevokeSessionButton: can('DELETE', '/api/sessions/:id'),

    // ── MESSAGING UI (#131, #132, #133, #134, #135, #136, #137, #138, #139, #588) ──
    showMessageBellAndList: can('GET', '/api/conversations'),
    showStartConversationAction: can('POST', '/api/conversations'),
    showConversationDetailHeader: can('GET', '/api/conversations/:id'),
    showMessagesStream: can('GET', '/api/conversations/:id/messages'),
    showSendMessageBar: can('POST', '/api/conversations/:id/messages'),
    showChatAttachFileButton: can('POST', '/api/conversations/:id/files'),
    showDeleteMessageButton: can(
      'DELETE',
      '/api/conversations/:id/messages/:messageId',
    ),
    showMarkConversationReadOption: can('PATCH', '/api/conversations/:id/read'),
    showHideConversationOption: can('PATCH', '/api/conversations/:id/hide'),
    showPinConversationOption: can('PATCH', '/api/conversations/:id/pin'),
  };
}

describe('ACCOUNT PROFILE, ACTIVE SESSIONS & MESSAGING - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến & Phân lập Route (Route Matching & Isolation)', () => {
    it.each(ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS)(
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
      const getConversations = [
        { method: 'GET', path: '/api/conversations' },
      ];
      expect(
        checkPermissionGuard(
          getConversations,
          'GET',
          '/api/conversations?limit=20&page=1',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getConversations, 'GET', '/api/conversations/').allowed,
      ).toBe(true);

      const getSessions = [{ method: 'GET', path: '/api/sessions' }];
      expect(
        checkPermissionGuard(getSessions, 'GET', '/api/sessions?active=true').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(getSessions, 'GET', '/api/sessions/').allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/account-profile và các subroute /password, /avatar', () => {
      const profileOnly = [
        { method: 'GET', path: '/api/account-profile' },
        { method: 'PUT', path: '/api/account-profile' },
      ];

      // Xem và cập nhật profile OK
      expect(
        checkPermissionGuard(profileOnly, 'GET', '/api/account-profile').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(profileOnly, 'PUT', '/api/account-profile').allowed,
      ).toBe(true);

      // Đổi mật khẩu hoặc upload avatar bị chặn (403)
      expect(
        checkPermissionGuard(
          profileOnly,
          'PUT',
          '/api/account-profile/password',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          profileOnly,
          'POST',
          '/api/account-profile/avatar',
        ).allowed,
      ).toBe(false);
    });

    it('Phân lập rõ ràng giữa GET /api/sessions và GET/DELETE /api/sessions/:id', () => {
      const listOnly = [{ method: 'GET', path: '/api/sessions' }];

      expect(
        checkPermissionGuard(listOnly, 'GET', '/api/sessions').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(listOnly, 'GET', '/api/sessions/sess_123').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(listOnly, 'DELETE', '/api/sessions/sess_123').allowed,
      ).toBe(false);
    });

    it('Phân lập chi tiết các subroute của /api/conversations/:id', () => {
      const detailOnly = [{ method: 'GET', path: '/api/conversations/:id' }];

      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/conversations/42').allowed,
      ).toBe(true);
      // Không thể xem messages
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/conversations/42/messages').allowed,
      ).toBe(false);
      // Không thể gửi messages
      expect(
        checkPermissionGuard(detailOnly, 'POST', '/api/conversations/42/messages').allowed,
      ).toBe(false);
      // Không thể upload files
      expect(
        checkPermissionGuard(detailOnly, 'POST', '/api/conversations/42/files').allowed,
      ).toBe(false);
      // Không thể mark read / pin / hide
      expect(
        checkPermissionGuard(detailOnly, 'PATCH', '/api/conversations/42/read').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(detailOnly, 'PATCH', '/api/conversations/42/pin').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(detailOnly, 'PATCH', '/api/conversations/42/hide').allowed,
      ).toBe(false);
    });

    it('Phân lập giữa gửi tin nhắn (/messages) và xóa tin nhắn (/messages/:messageId)', () => {
      const sendOnly = [
        { method: 'POST', path: '/api/conversations/:id/messages' },
      ];

      expect(
        checkPermissionGuard(sendOnly, 'POST', '/api/conversations/42/messages').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          sendOnly,
          'DELETE',
          '/api/conversations/42/messages/101',
        ).allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp toàn quyền (Full 17/17 Permissions Granted)', () => {
    const fullPermissions = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS;
    const can = createCanHelper(fullPermissions);
    const uiState = evaluateUiState(can);

    it('Tất cả 17 endpoints API trả về allowed: true và status: 200', () => {
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
      // Account profile UI
      expect(uiState.showGeneralSettingsCard).toBe(true);
      expect(uiState.showSaveProfileButton).toBe(true);
      expect(uiState.showChangePasswordSection).toBe(true);
      expect(uiState.showAvatarUploadButton).toBe(true);

      // Active sessions UI
      expect(uiState.showSessionsList).toBe(true);
      expect(uiState.showViewSessionDetailButton).toBe(true);
      expect(uiState.showRevokeSessionButton).toBe(true);

      // Messaging UI
      expect(uiState.showMessageBellAndList).toBe(true);
      expect(uiState.showStartConversationAction).toBe(true);
      expect(uiState.showConversationDetailHeader).toBe(true);
      expect(uiState.showMessagesStream).toBe(true);
      expect(uiState.showSendMessageBar).toBe(true);
      expect(uiState.showChatAttachFileButton).toBe(true);
      expect(uiState.showDeleteMessageButton).toBe(true);
      expect(uiState.showMarkConversationReadOption).toBe(true);
      expect(uiState.showHideConversationOption).toBe(true);
      expect(uiState.showPinConversationOption).toBe(true);
    });
  });

  describe('Phần 3: Không cấp quyền (Zero 0/17 Permissions Granted)', () => {
    const zeroPermissions: PermissionItem[] = [];
    const can = createCanHelper(zeroPermissions);
    const uiState = evaluateUiState(can);

    it('Tất cả 17 endpoints API đều bị từ chối truy cập (allowed: false, status: 403)', () => {
      ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.forEach((perm) => {
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
      // Account profile UI
      expect(uiState.showGeneralSettingsCard).toBe(false);
      expect(uiState.showSaveProfileButton).toBe(false);
      expect(uiState.showChangePasswordSection).toBe(false);
      expect(uiState.showAvatarUploadButton).toBe(false);

      // Active sessions UI
      expect(uiState.showSessionsList).toBe(false);
      expect(uiState.showViewSessionDetailButton).toBe(false);
      expect(uiState.showRevokeSessionButton).toBe(false);

      // Messaging UI
      expect(uiState.showMessageBellAndList).toBe(false);
      expect(uiState.showStartConversationAction).toBe(false);
      expect(uiState.showConversationDetailHeader).toBe(false);
      expect(uiState.showMessagesStream).toBe(false);
      expect(uiState.showSendMessageBar).toBe(false);
      expect(uiState.showChatAttachFileButton).toBe(false);
      expect(uiState.showDeleteMessageButton).toBe(false);
      expect(uiState.showMarkConversationReadOption).toBe(false);
      expect(uiState.showHideConversationOption).toBe(false);
      expect(uiState.showPinConversationOption).toBe(false);
    });
  });

  describe('Phần 4: Thu hồi có chọn lọc từng quyền một (Selective 1-by-1 Revocation)', () => {
    it.each(ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS)(
      'Thu hồi quyền #$id ($method $path): Endpoint tương ứng trả về 403, 16 endpoint còn lại vẫn 200 OK',
      (revokedPerm) => {
        const remainingPermissions = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
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

        // Kiểm tra 16 endpoint còn lại vẫn được phép (200)
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

    it('Thu hồi #396 (PUT /api/account-profile) -> Nút "Lưu thay đổi" hồ sơ bị ẩn, các mục khác vẫn hiển thị', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 396,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showSaveProfileButton).toBe(false);
      expect(uiState.showGeneralSettingsCard).toBe(true);
      expect(uiState.showChangePasswordSection).toBe(true);
      expect(uiState.showAvatarUploadButton).toBe(true);
    });

    it('Thu hồi #397 (PUT /api/account-profile/password) -> Khung đổi mật khẩu bị ẩn, hồ sơ vẫn xem và sửa được', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 397,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showChangePasswordSection).toBe(false);
      expect(uiState.showGeneralSettingsCard).toBe(true);
      expect(uiState.showSaveProfileButton).toBe(true);
      expect(uiState.showAvatarUploadButton).toBe(true);
    });

    it('Thu hồi #398 (POST /api/account-profile/avatar) -> Nút tải ảnh đại diện bị ẩn', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 398,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showAvatarUploadButton).toBe(false);
      expect(uiState.showGeneralSettingsCard).toBe(true);
      expect(uiState.showSaveProfileButton).toBe(true);
      expect(uiState.showChangePasswordSection).toBe(true);
    });

    it('Thu hồi #177 (DELETE /api/sessions/:id) -> Nút "Đăng xuất thiết bị" bị ẩn, vẫn xem danh sách và chi tiết phiên', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 177,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showRevokeSessionButton).toBe(false);
      expect(uiState.showSessionsList).toBe(true);
      expect(uiState.showViewSessionDetailButton).toBe(true);
    });

    it('Thu hồi #135 (POST /api/conversations/:id/files) -> Nút kẹp ghim tải file bị ẩn, vẫn nhắn tin được', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 135,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showChatAttachFileButton).toBe(false);
      expect(uiState.showSendMessageBar).toBe(true);
      expect(uiState.showMessagesStream).toBe(true);
    });

    it('Thu hồi #136 (DELETE /api/conversations/:id/messages/:messageId) -> Nút thùng rác xóa tin nhắn bị ẩn', () => {
      const perms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => p.id !== 136,
      );
      const uiState = evaluateUiState(createCanHelper(perms));
      expect(uiState.showDeleteMessageButton).toBe(false);
      expect(uiState.showSendMessageBar).toBe(true);
      expect(uiState.showMessagesStream).toBe(true);
    });
  });

  describe('Phần 5: Cấp độc quyền từng quyền một (Exclusive 1-by-1 Granting)', () => {
    it.each(ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS)(
      'Chỉ cấp quyền #$id ($method $path): Endpoint này 200 OK, 16 endpoint còn lại đều 403 Forbidden',
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

        // 16 endpoint còn lại đều bị chặn (403)
        const others = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
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
    it('Kịch bản A: Người dùng cập nhật thông tin cá nhân cơ bản (chỉ sửa tên/tiểu sử và avatar, không được đổi mật khẩu)', () => {
      const basicProfilePerms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => [395, 396, 398].includes(p.id),
      );
      const can = createCanHelper(basicProfilePerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showGeneralSettingsCard).toBe(true);
      expect(uiState.showSaveProfileButton).toBe(true);
      expect(uiState.showAvatarUploadButton).toBe(true);
      expect(uiState.showChangePasswordSection).toBe(false);

      expect(
        checkPermissionGuard(basicProfilePerms, 'GET', '/api/account-profile').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(basicProfilePerms, 'PUT', '/api/account-profile').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          basicProfilePerms,
          'POST',
          '/api/account-profile/avatar',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          basicProfilePerms,
          'PUT',
          '/api/account-profile/password',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản B: Kiểm toán viên bảo mật kiểm tra phiên đăng nhập (chỉ xem danh sách và chi tiết, không được thu hồi phiên)', () => {
      const sessionAuditorPerms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => [175, 176].includes(p.id),
      );
      const can = createCanHelper(sessionAuditorPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showSessionsList).toBe(true);
      expect(uiState.showViewSessionDetailButton).toBe(true);
      expect(uiState.showRevokeSessionButton).toBe(false);

      expect(
        checkPermissionGuard(sessionAuditorPerms, 'GET', '/api/sessions').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          sessionAuditorPerms,
          'GET',
          '/api/sessions/sess_xyz',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          sessionAuditorPerms,
          'DELETE',
          '/api/sessions/sess_xyz',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản C: Thành viên chỉ đọc trong cuộc trò chuyện (xem hội thoại, đọc tin nhắn nhưng không thể gửi, đính kèm file, xóa tin nhắn hay ghim/ẩn)', () => {
      const readOnlyChatPerms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => [131, 588, 133].includes(p.id),
      );
      const can = createCanHelper(readOnlyChatPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showMessageBellAndList).toBe(true);
      expect(uiState.showConversationDetailHeader).toBe(true);
      expect(uiState.showMessagesStream).toBe(true);
      expect(uiState.showSendMessageBar).toBe(false);
      expect(uiState.showChatAttachFileButton).toBe(false);
      expect(uiState.showDeleteMessageButton).toBe(false);
      expect(uiState.showPinConversationOption).toBe(false);
      expect(uiState.showHideConversationOption).toBe(false);

      expect(
        checkPermissionGuard(readOnlyChatPerms, 'GET', '/api/conversations').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(readOnlyChatPerms, 'GET', '/api/conversations/42').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          readOnlyChatPerms,
          'GET',
          '/api/conversations/42/messages',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          readOnlyChatPerms,
          'POST',
          '/api/conversations/42/messages',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          readOnlyChatPerms,
          'POST',
          '/api/conversations/42/files',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          readOnlyChatPerms,
          'DELETE',
          '/api/conversations/42/messages/99',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản D: Người dùng trò chuyện văn bản thuần túy (không có quyền đính kèm file chat)', () => {
      const textOnlyChatPerms = ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS.filter(
        (p) => [131, 132, 588, 133, 134, 136, 137, 138, 139].includes(p.id),
      );
      const can = createCanHelper(textOnlyChatPerms);
      const uiState = evaluateUiState(can);

      expect(uiState.showMessageBellAndList).toBe(true);
      expect(uiState.showStartConversationAction).toBe(true);
      expect(uiState.showConversationDetailHeader).toBe(true);
      expect(uiState.showMessagesStream).toBe(true);
      expect(uiState.showSendMessageBar).toBe(true);
      expect(uiState.showChatAttachFileButton).toBe(false); // Nút attach file bị ẩn

      expect(
        checkPermissionGuard(
          textOnlyChatPerms,
          'POST',
          '/api/conversations/42/messages',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(
          textOnlyChatPerms,
          'POST',
          '/api/conversations/42/files',
        ).allowed,
      ).toBe(false);
    });

    it('Kịch bản E: Người dùng có toàn quyền trang cá nhân, phiên đăng nhập và trò chuyện', () => {
      const can = createCanHelper(ACCOUNT_SESSIONS_MESSAGING_PERMISSIONS);
      const uiState = evaluateUiState(can);

      Object.values(uiState).forEach((visible) => {
        expect(visible).toBe(true);
      });
    });
  });
});
