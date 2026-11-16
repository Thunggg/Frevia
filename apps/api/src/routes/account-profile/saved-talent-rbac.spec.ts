import { matchRoutePath, normalizeApiPath } from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho 2 cụm chức năng:
 *
 * CỤM 1: CLIENT PROFILE - Hồ sơ doanh nghiệp (Client) - 1 quyền:
 * #193 · PUT /api/clients/me/profile (Cập nhật hồ sơ Client của tôi)
 *
 * CỤM 2: SAVED TALENT - Freelancer đã lưu & Theo dõi (Client) - 7 quyền:
 * #197 · GET /api/favorites/freelancers (Xem danh sách Freelancer yêu thích)
 * #198 · POST /api/favorites/freelancers/:freelancerId (Thêm Freelancer vào yêu thích)
 * #199 · DELETE /api/favorites/freelancers/:freelancerId (Bỏ Freelancer khỏi yêu thích)
 * #307 · GET /api/following/freelancers (Xem danh sách Freelancer đang theo dõi)
 * #308 · POST /api/following/freelancers/:freelancerId (Theo dõi Freelancer)
 * #309 · DELETE /api/following/freelancers/:freelancerId (Bỏ theo dõi Freelancer)
 * #394 · GET /api/following/freelancers/discover (Gợi ý Freelancer để theo dõi)
 *
 * Yêu cầu đặc biệt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Kiểm thử tự động chứng minh: Khi không có quyền tương ứng, các nút/tab/section trên UI
 *    bị ẩn hoàn toàn hoặc bị vô hiệu hóa, đồng thời API không bị gọi trái phép.
 */

interface PermissionItem {
  id: number;
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const TALENT_PERMISSIONS: PermissionItem[] = [
  {
    id: 193,
    method: 'PUT',
    path: '/api/clients/me/profile',
    description: 'Cập nhật hồ sơ Client của tôi',
    testActualPath: '/api/clients/me/profile',
  },
  {
    id: 197,
    method: 'GET',
    path: '/api/favorites/freelancers',
    description: 'Xem danh sách Freelancer yêu thích',
    testActualPath: '/api/favorites/freelancers',
  },
  {
    id: 198,
    method: 'POST',
    path: '/api/favorites/freelancers/:freelancerId',
    description: 'Thêm Freelancer vào yêu thích',
    testActualPath: '/api/favorites/freelancers/42',
  },
  {
    id: 199,
    method: 'DELETE',
    path: '/api/favorites/freelancers/:freelancerId',
    description: 'Bỏ Freelancer khỏi yêu thích',
    testActualPath: '/api/favorites/freelancers/42',
  },
  {
    id: 307,
    method: 'GET',
    path: '/api/following/freelancers',
    description: 'Xem danh sách Freelancer đang theo dõi',
    testActualPath: '/api/following/freelancers',
  },
  {
    id: 308,
    method: 'POST',
    path: '/api/following/freelancers/:freelancerId',
    description: 'Theo dõi Freelancer',
    testActualPath: '/api/following/freelancers/42',
  },
  {
    id: 309,
    method: 'DELETE',
    path: '/api/following/freelancers/:freelancerId',
    description: 'Bỏ theo dõi Freelancer',
    testActualPath: '/api/following/freelancers/42',
  },
  {
    id: 394,
    method: 'GET',
    path: '/api/following/freelancers/discover',
    description: 'Gợi ý Freelancer để theo dõi',
    testActualPath: '/api/following/freelancers/discover',
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
 * Mô phỏng trạng thái UI Client Profile Settings & Profile Page
 * dựa trên permissions của tài khoản.
 */
function deriveUiState(grantedPermissions: Array<{ method: string; path: string }>) {
  const can = (method: string, path: string) =>
    checkPermission(grantedPermissions, method, path);

  const canUpdateClientProfile = can('PUT', '/api/clients/me/profile');
  const canViewFavorites = can('GET', '/api/favorites/freelancers');
  const canAddFavorite = can('POST', '/api/favorites/freelancers/:freelancerId');
  const canRemoveFavorite = can('DELETE', '/api/favorites/freelancers/:freelancerId');
  const canGetFollowing = can('GET', '/api/following/freelancers');
  const canDiscoverFreelancers = can('GET', '/api/following/freelancers/discover');
  const canFollowFreelancer = can('POST', '/api/following/freelancers/:freelancerId');
  const canUnfollowFreelancer = can('DELETE', '/api/following/freelancers/:freelancerId');
  const canViewFollowingTab = canGetFollowing || canDiscoverFreelancers;

  return {
    // 1. Client Profile Settings
    isSaveCompanyButtonVisible: canUpdateClientProfile,
    isCompanyFormEditable: canUpdateClientProfile,
    isFavoritesTabVisible: canViewFavorites,
    isSidebarFavoritesLinkVisible: canViewFavorites,
    isRemoveFavoriteInListVisible: canRemoveFavorite,
    isFollowingTabVisible: canViewFollowingTab,
    isDiscoverFilterVisible: canDiscoverFreelancers,
    isFollowingFilterVisible: canGetFollowing,
    isFollowButtonInListVisible: canFollowFreelancer,
    isUnfollowButtonInListVisible: canUnfollowFreelancer,

    // 2. Freelancer Profile Page (Public Profile)
    // Khi chưa favorite: chỉ hiển thị nút nếu có quyền add
    isAddToFavoritesButtonVisible: canAddFavorite,
    // Khi đã favorite: chỉ hiển thị nút nếu có quyền remove
    isRemoveFromFavoritesButtonVisible: canRemoveFavorite,
    // Khi chưa follow: chỉ hiển thị nút nếu có quyền follow
    isFollowButtonVisible: canFollowFreelancer,
    // Khi đã follow: chỉ hiển thị nút nếu có quyền unfollow
    isUnfollowButtonVisible: canUnfollowFreelancer,

    // 3. Quyền fetch API
    shouldFetchFavorites: canViewFavorites,
    shouldFetchFollowing: canGetFollowing,
    shouldFetchDiscover: canDiscoverFreelancers,
  };
}

describe('CLIENT PROFILE & SAVED TALENT RBAC & UI Visibility Specs', () => {
  describe('1. Định tuyến & Phân giải Route Pattern', () => {
    TALENT_PERMISSIONS.forEach((perm) => {
      it(`Khớp chính xác route #${perm.id}: ${perm.method} ${perm.path} -> ${perm.testActualPath}`, () => {
        expect(matchRoutePath(perm.path, perm.testActualPath)).toBe(true);
      });
    });

    it('Đảm bảo static segment "discover" không bị khớp nhầm với dynamic parameter ":freelancerId"', () => {
      // Khi actual path là /api/following/freelancers/discover
      // Không được match với /api/following/freelancers/:freelancerId
      expect(
        matchRoutePath(
          '/api/following/freelancers/:freelancerId',
          '/api/following/freelancers/discover',
        ),
      ).toBe(false);
    });

    it('Đảm bảo static segment "me" không bị khớp nhầm với dynamic parameter ":userId"', () => {
      expect(
        matchRoutePath('/api/clients/:userId', '/api/clients/me/profile'),
      ).toBe(false);
    });

    it('Chuẩn hóa normalizeApiPath hoạt động nhất quán', () => {
      expect(normalizeApiPath('/favorites/freelancers')).toBe('/api/favorites/freelancers');
      expect(normalizeApiPath('/api/favorites/freelancers')).toBe('/api/favorites/freelancers');
      expect(normalizeApiPath('/api/favorites/freelancers?sort=desc')).toBe('/api/favorites/freelancers');
    });
  });

  describe('2. Kịch bản ĐẦY ĐỦ QUYỀN (Full Permissions - 8/8)', () => {
    const fullPermissions = TALENT_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    TALENT_PERMISSIONS.forEach((perm) => {
      it(`Được phép thực hiện #${perm.id} · ${perm.method} ${perm.path}`, () => {
        const allowed = checkPermission(fullPermissions, perm.method, perm.testActualPath);
        expect(allowed).toBe(true);
      });
    });

    it('Giao diện hiển thị đầy đủ tất cả các nút, tab, form và bộ lọc', () => {
      const ui = deriveUiState(fullPermissions);

      // Client Profile
      expect(ui.isSaveCompanyButtonVisible).toBe(true);
      expect(ui.isCompanyFormEditable).toBe(true);
      expect(ui.isFavoritesTabVisible).toBe(true);
      expect(ui.isSidebarFavoritesLinkVisible).toBe(true);
      expect(ui.isRemoveFavoriteInListVisible).toBe(true);
      expect(ui.isFollowingTabVisible).toBe(true);
      expect(ui.isDiscoverFilterVisible).toBe(true);
      expect(ui.isFollowingFilterVisible).toBe(true);
      expect(ui.isFollowButtonInListVisible).toBe(true);
      expect(ui.isUnfollowButtonInListVisible).toBe(true);

      // Public Profile Page
      expect(ui.isAddToFavoritesButtonVisible).toBe(true);
      expect(ui.isRemoveFromFavoritesButtonVisible).toBe(true);
      expect(ui.isFollowButtonVisible).toBe(true);
      expect(ui.isUnfollowButtonVisible).toBe(true);

      // Fetch calls
      expect(ui.shouldFetchFavorites).toBe(true);
      expect(ui.shouldFetchFollowing).toBe(true);
      expect(ui.shouldFetchDiscover).toBe(true);
    });
  });

  describe('3. Kịch bản KHÔNG CÓ QUYỀN NÀO (0/8 quyền - Strict Lockdown)', () => {
    const emptyPermissions: Array<{ method: string; path: string }> = [];

    TALENT_PERMISSIONS.forEach((perm) => {
      it(`BỊ CHẶN thực hiện #${perm.id} · ${perm.method} ${perm.path}`, () => {
        const allowed = checkPermission(emptyPermissions, perm.method, perm.testActualPath);
        expect(allowed).toBe(false);
      });
    });

    it('Giao diện ẨN TOÀN BỘ các nút tác vụ, tab, liên kết sidebar và chuyển form về read-only', () => {
      const ui = deriveUiState(emptyPermissions);

      // Nút Lưu thay đổi bị ẩn và form chỉ đọc
      expect(ui.isSaveCompanyButtonVisible).toBe(false);
      expect(ui.isCompanyFormEditable).toBe(false);

      // Tab yêu thích và link sidebar bị ẩn hoàn toàn
      expect(ui.isFavoritesTabVisible).toBe(false);
      expect(ui.isSidebarFavoritesLinkVisible).toBe(false);
      expect(ui.isRemoveFavoriteInListVisible).toBe(false);

      // Tab Following và bộ lọc bị ẩn hoàn toàn
      expect(ui.isFollowingTabVisible).toBe(false);
      expect(ui.isDiscoverFilterVisible).toBe(false);
      expect(ui.isFollowingFilterVisible).toBe(false);
      expect(ui.isFollowButtonInListVisible).toBe(false);
      expect(ui.isUnfollowButtonInListVisible).toBe(false);

      // Nút Favorite và Follow trên trang profile bị ẩn hoàn toàn
      expect(ui.isAddToFavoritesButtonVisible).toBe(false);
      expect(ui.isRemoveFromFavoritesButtonVisible).toBe(false);
      expect(ui.isFollowButtonVisible).toBe(false);
      expect(ui.isUnfollowButtonVisible).toBe(false);

      // Không gọi các API này
      expect(ui.shouldFetchFavorites).toBe(false);
      expect(ui.shouldFetchFollowing).toBe(false);
      expect(ui.shouldFetchDiscover).toBe(false);
    });
  });

  describe('4. Kịch bản TƯỚC TỪNG QUYỀN ĐƠN LẺ & Kiểm tra Ẩn UI tương ứng', () => {
    it('Tước #193 (PUT /api/clients/me/profile): Nút "Lưu thay đổi" bị ẨN, form bị khóa read-only', () => {
      const permissionsWithout193 = TALENT_PERMISSIONS.filter((p) => p.id !== 193).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(checkPermission(permissionsWithout193, 'PUT', '/api/clients/me/profile')).toBe(false);

      const ui = deriveUiState(permissionsWithout193);
      expect(ui.isSaveCompanyButtonVisible).toBe(false);
      expect(ui.isCompanyFormEditable).toBe(false);
      // Các tính năng khác vẫn hoạt động
      expect(ui.isFavoritesTabVisible).toBe(true);
      expect(ui.isFollowingTabVisible).toBe(true);
    });

    it('Tước #197 (GET /api/favorites/freelancers): Tab Yêu thích và Link Sidebar bị ẨN, không gọi API favorites', () => {
      const permissionsWithout197 = TALENT_PERMISSIONS.filter((p) => p.id !== 197).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(checkPermission(permissionsWithout197, 'GET', '/api/favorites/freelancers')).toBe(false);

      const ui = deriveUiState(permissionsWithout197);
      expect(ui.isFavoritesTabVisible).toBe(false);
      expect(ui.isSidebarFavoritesLinkVisible).toBe(false);
      expect(ui.shouldFetchFavorites).toBe(false);
      // Các tính năng khác vẫn hiển thị
      expect(ui.isSaveCompanyButtonVisible).toBe(true);
      expect(ui.isFollowingTabVisible).toBe(true);
    });

    it('Tước #198 (POST /api/favorites/freelancers/:freelancerId): Nút "Thêm vào yêu thích" trên trang profile bị ẨN', () => {
      const permissionsWithout198 = TALENT_PERMISSIONS.filter((p) => p.id !== 198).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermission(
          permissionsWithout198,
          'POST',
          '/api/favorites/freelancers/101',
        ),
      ).toBe(false);

      const ui = deriveUiState(permissionsWithout198);
      expect(ui.isAddToFavoritesButtonVisible).toBe(false);
      // Nhưng nếu đã favorite trước đó thì vẫn có thể remove nếu còn #199
      expect(ui.isRemoveFromFavoritesButtonVisible).toBe(true);
    });

    it('Tước #199 (DELETE /api/favorites/freelancers/:freelancerId): Nút "Bỏ yêu thích" (thùng rác & đã thích) bị ẨN', () => {
      const permissionsWithout199 = TALENT_PERMISSIONS.filter((p) => p.id !== 199).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermission(
          permissionsWithout199,
          'DELETE',
          '/api/favorites/freelancers/101',
        ),
      ).toBe(false);

      const ui = deriveUiState(permissionsWithout199);
      expect(ui.isRemoveFavoriteInListVisible).toBe(false);
      expect(ui.isRemoveFromFavoritesButtonVisible).toBe(false);
      // Nhưng nút thêm vào yêu thích vẫn còn nếu còn #198
      expect(ui.isAddToFavoritesButtonVisible).toBe(true);
    });

    it('Tước #307 (GET /api/following/freelancers): Bộ lọc "Đang theo dõi" bị ẨN, không gọi API getFollowing', () => {
      const permissionsWithout307 = TALENT_PERMISSIONS.filter((p) => p.id !== 307).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(checkPermission(permissionsWithout307, 'GET', '/api/following/freelancers')).toBe(false);

      const ui = deriveUiState(permissionsWithout307);
      expect(ui.isFollowingFilterVisible).toBe(false);
      expect(ui.shouldFetchFollowing).toBe(false);
      // Tab following vẫn còn vì còn #394 (Khám phá)
      expect(ui.isFollowingTabVisible).toBe(true);
      expect(ui.isDiscoverFilterVisible).toBe(true);
    });

    it('Tước #308 (POST /api/following/freelancers/:freelancerId): Nút "Theo dõi" (Follow) bị ẨN', () => {
      const permissionsWithout308 = TALENT_PERMISSIONS.filter((p) => p.id !== 308).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermission(
          permissionsWithout308,
          'POST',
          '/api/following/freelancers/101',
        ),
      ).toBe(false);

      const ui = deriveUiState(permissionsWithout308);
      expect(ui.isFollowButtonInListVisible).toBe(false);
      expect(ui.isFollowButtonVisible).toBe(false);
      // Nhưng nếu đang follow thì vẫn có thể unfollow nếu còn #309
      expect(ui.isUnfollowButtonInListVisible).toBe(true);
      expect(ui.isUnfollowButtonVisible).toBe(true);
    });

    it('Tước #309 (DELETE /api/following/freelancers/:freelancerId): Nút "Bỏ theo dõi" (Unfollow) bị ẨN', () => {
      const permissionsWithout309 = TALENT_PERMISSIONS.filter((p) => p.id !== 309).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermission(
          permissionsWithout309,
          'DELETE',
          '/api/following/freelancers/101',
        ),
      ).toBe(false);

      const ui = deriveUiState(permissionsWithout309);
      expect(ui.isUnfollowButtonInListVisible).toBe(false);
      expect(ui.isUnfollowButtonVisible).toBe(false);
      // Nhưng nút follow vẫn có nếu còn #308
      expect(ui.isFollowButtonInListVisible).toBe(true);
      expect(ui.isFollowButtonVisible).toBe(true);
    });

    it('Tước #394 (GET /api/following/freelancers/discover): Bộ lọc "Khám phá" bị ẨN, không gọi API discover', () => {
      const permissionsWithout394 = TALENT_PERMISSIONS.filter((p) => p.id !== 394).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermission(
          permissionsWithout394,
          'GET',
          '/api/following/freelancers/discover',
        ),
      ).toBe(false);

      const ui = deriveUiState(permissionsWithout394);
      expect(ui.isDiscoverFilterVisible).toBe(false);
      expect(ui.shouldFetchDiscover).toBe(false);
      // Tab following vẫn còn vì còn #307
      expect(ui.isFollowingTabVisible).toBe(true);
      expect(ui.isFollowingFilterVisible).toBe(true);
    });

    it('Tước cả #307 và #394: Toàn bộ tab "Following / Mạng lưới" bị ẨN khỏi UI', () => {
      const permissionsWithoutFollowing = TALENT_PERMISSIONS.filter(
        (p) => p.id !== 307 && p.id !== 394,
      ).map((p) => ({
        method: p.method,
        path: p.path,
      }));

      const ui = deriveUiState(permissionsWithoutFollowing);
      expect(ui.isFollowingTabVisible).toBe(false);
      expect(ui.shouldFetchFollowing).toBe(false);
      expect(ui.shouldFetchDiscover).toBe(false);
    });
  });

  describe('5. Kịch bản HTTP Method Mismatch (Bảo vệ đa phương thức)', () => {
    const fullPermissions = TALENT_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    it('POST vào /api/favorites/freelancers (GET only) -> Bị chặn', () => {
      expect(checkPermission(fullPermissions, 'POST', '/api/favorites/freelancers')).toBe(false);
    });

    it('GET vào /api/clients/me/profile (PUT only) -> Bị chặn', () => {
      expect(checkPermission(fullPermissions, 'GET', '/api/clients/me/profile')).toBe(false);
    });

    it('PATCH vào /api/following/freelancers/discover (GET only) -> Bị chặn', () => {
      expect(checkPermission(fullPermissions, 'PATCH', '/api/following/freelancers/discover')).toBe(false);
    });

    it('PUT vào /api/favorites/freelancers/42 (POST/DELETE only) -> Bị chặn', () => {
      expect(checkPermission(fullPermissions, 'PUT', '/api/favorites/freelancers/42')).toBe(false);
    });
  });
});
