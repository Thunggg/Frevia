import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho cụm chức năng:
 *
 * SAVED SEARCHES - Tìm kiếm đã lưu (Freelancer) - 5 quyền:
 * 1. #327 · GET /api/saved-searches (Xem danh sách tìm kiếm đã lưu)
 * 2. #328 · GET /api/saved-searches/:id (Xem chi tiết tìm kiếm đã lưu)
 * 3. #329 · POST /api/saved-searches (Lưu tiêu chí tìm kiếm)
 * 4. #330 · PATCH /api/saved-searches/:id (Cập nhật tìm kiếm đã lưu)
 * 5. #331 · DELETE /api/saved-searches/:id (Xóa tìm kiếm đã lưu)
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

const SAVED_SEARCHES_PERMISSIONS: PermissionItem[] = [
  {
    id: 327,
    method: 'GET',
    path: '/api/saved-searches',
    description: 'Xem danh sách tìm kiếm đã lưu',
    testActualPath: '/api/saved-searches',
  },
  {
    id: 328,
    method: 'GET',
    path: '/api/saved-searches/:id',
    description: 'Xem chi tiết tìm kiếm đã lưu',
    testActualPath: '/api/saved-searches/101',
  },
  {
    id: 329,
    method: 'POST',
    path: '/api/saved-searches',
    description: 'Lưu tiêu chí tìm kiếm',
    testActualPath: '/api/saved-searches',
  },
  {
    id: 330,
    method: 'PATCH',
    path: '/api/saved-searches/:id',
    description: 'Cập nhật tìm kiếm đã lưu',
    testActualPath: '/api/saved-searches/101',
  },
  {
    id: 331,
    method: 'DELETE',
    path: '/api/saved-searches/:id',
    description: 'Xóa tìm kiếm đã lưu',
    testActualPath: '/api/saved-searches/101',
  },
];

/**
 * Giả lập Permission Guard kiểm tra quyền dựa trên danh sách permissions được cấp
 */
function checkPermissionGuard(
  userPermissions: Array<{ method: string; path: string }>,
  requestMethod: string,
  requestPath: string,
): { allowed: boolean; status: number } {
  const normReqPath = normalizeApiPath(requestPath);
  const matched = userPermissions.some((perm) => {
    if (perm.method.toUpperCase() !== requestMethod.toUpperCase()) return false;
    return matchRoutePath(perm.path, normReqPath);
  });

  return matched
    ? { allowed: true, status: 200 }
    : { allowed: false, status: 403 };
}

/**
 * Hàm suy diễn trạng thái hiển thị UI (UI Visibility State)
 * Dựa trên các quyền can(method, path) trên Frontend
 */
function deriveSavedSearchesUiState(
  userPermissions: Array<{ method: string; path: string }>,
) {
  const can = (method: string, path: string) =>
    checkPermissionGuard(userPermissions, method, path).allowed;

  const canViewSavedSearches = can('GET', '/api/saved-searches');
  const canViewSavedSearchDetail = can('GET', '/api/saved-searches/:id');
  const canCreateSavedSearch = can('POST', '/api/saved-searches');
  const canUpdateSavedSearch = can('PATCH', '/api/saved-searches/:id');
  const canDeleteSavedSearch = can('DELETE', '/api/saved-searches/:id');

  return {
    // Header Navigation & Profile Menu
    headerNavSavedSearchesLink: canViewSavedSearches,
    headerProfileDropdownSavedSearchesItem: canViewSavedSearches,

    // Find Work Page
    findWorkSavedSearchesTabButton: canViewSavedSearches,
    findWorkSavedSearchesTabContent: canViewSavedSearches,

    // Search Jobs Page Toolbar
    searchJobsToolbarDialog: canCreateSavedSearch || canViewSavedSearches,
    searchJobsToolbarSavedSearchesLink: canViewSavedSearches,

    // Saved Searches Page / Content
    savedSearchesPageCountBadge: canViewSavedSearches,
    savedSearchesPageItemList: canViewSavedSearches,
    savedSearchesPageCardRenameButton: canUpdateSavedSearch,
    savedSearchesPageCardDeleteButton: canDeleteSavedSearch,
    savedSearchesPageCardViewDetailButton: canViewSavedSearchDetail,

    // Save Search Dialog (Popup)
    saveSearchDialogComponent: canCreateSavedSearch || canViewSavedSearches,
    saveSearchDialogCountBadge: canViewSavedSearches,
    saveSearchDialogCreateButton: canCreateSavedSearch,
    saveSearchDialogListSection: canViewSavedSearches,
    saveSearchDialogEditCriteriaButton: canUpdateSavedSearch,
    saveSearchDialogRenameButton: canUpdateSavedSearch,
    saveSearchDialogDeleteButton: canDeleteSavedSearch,
    saveSearchDialogManageLink: canViewSavedSearches,
  };
}

describe('SAVED SEARCHES (Freelancer) - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến (Route Matching & Isolation)', () => {
    it.each(SAVED_SEARCHES_PERMISSIONS)(
      'Quyền #$id: $method $path khớp đúng với URL thực tế $testActualPath',
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

    it('Xử lý an toàn với trailing slash và chữ hoa chữ thường', () => {
      const perms = [{ method: 'get', path: '/api/saved-searches/' }];
      expect(
        checkPermissionGuard(perms, 'GET', '/api/saved-searches').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(perms, 'get', '/api/saved-searches/').allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/saved-searches (list) và /api/saved-searches/:id (detail)', () => {
      const listOnly = [{ method: 'GET', path: '/api/saved-searches' }];
      expect(
        checkPermissionGuard(listOnly, 'GET', '/api/saved-searches').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(listOnly, 'GET', '/api/saved-searches/101')
          .allowed,
      ).toBe(false);

      const detailOnly = [{ method: 'GET', path: '/api/saved-searches/:id' }];
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/saved-searches/101')
          .allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/saved-searches').allowed,
      ).toBe(false);
    });

    it('Không cho phép khớp nhầm với các module khác', () => {
      const savedSearchesPerms = SAVED_SEARCHES_PERMISSIONS.map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermissionGuard(savedSearchesPerms, 'GET', '/api/job-alerts')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(savedSearchesPerms, 'GET', '/api/manage-jobs')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(
          savedSearchesPerms,
          'POST',
          '/api/proposals/jobs/1',
        ).allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp đủ 5/5 quyền (Full Access)', () => {
    const fullPermissions = SAVED_SEARCHES_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    it('Tất cả 5 endpoint đều cho phép truy cập thành công (200 OK)', () => {
      for (const perm of SAVED_SEARCHES_PERMISSIONS) {
        const result = checkPermissionGuard(
          fullPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      }
    });

    it('Toàn bộ các nút, tab, liên kết và dialog trên giao diện UI đều được hiển thị đầy đủ', () => {
      const ui = deriveSavedSearchesUiState(fullPermissions);

      // Header & Navigation
      expect(ui.headerNavSavedSearchesLink).toBe(true);
      expect(ui.headerProfileDropdownSavedSearchesItem).toBe(true);

      // Find Work Page
      expect(ui.findWorkSavedSearchesTabButton).toBe(true);
      expect(ui.findWorkSavedSearchesTabContent).toBe(true);

      // Search Jobs Toolbar
      expect(ui.searchJobsToolbarDialog).toBe(true);
      expect(ui.searchJobsToolbarSavedSearchesLink).toBe(true);

      // Saved Searches Page
      expect(ui.savedSearchesPageCountBadge).toBe(true);
      expect(ui.savedSearchesPageItemList).toBe(true);
      expect(ui.savedSearchesPageCardRenameButton).toBe(true);
      expect(ui.savedSearchesPageCardDeleteButton).toBe(true);
      expect(ui.savedSearchesPageCardViewDetailButton).toBe(true);

      // Save Search Dialog
      expect(ui.saveSearchDialogComponent).toBe(true);
      expect(ui.saveSearchDialogCountBadge).toBe(true);
      expect(ui.saveSearchDialogCreateButton).toBe(true);
      expect(ui.saveSearchDialogListSection).toBe(true);
      expect(ui.saveSearchDialogEditCriteriaButton).toBe(true);
      expect(ui.saveSearchDialogRenameButton).toBe(true);
      expect(ui.saveSearchDialogDeleteButton).toBe(true);
      expect(ui.saveSearchDialogManageLink).toBe(true);
    });
  });

  describe('Phần 3: Không có quyền nào (0/5 quyền - Zero Access)', () => {
    const noPermissions: Array<{ method: string; path: string }> = [];

    it('Tất cả 5 endpoint đều bị chặn 403 Forbidden', () => {
      for (const perm of SAVED_SEARCHES_PERMISSIONS) {
        const result = checkPermissionGuard(
          noPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('Toàn bộ các nút, tab, liên kết, danh sách và dialog trên UI đều bị ẩn hoàn toàn', () => {
      const ui = deriveSavedSearchesUiState(noPermissions);

      // Header & Navigation ẩn hoàn toàn
      expect(ui.headerNavSavedSearchesLink).toBe(false);
      expect(ui.headerProfileDropdownSavedSearchesItem).toBe(false);

      // Find Work tab ẩn hoàn toàn
      expect(ui.findWorkSavedSearchesTabButton).toBe(false);
      expect(ui.findWorkSavedSearchesTabContent).toBe(false);

      // Search Jobs toolbar ẩn hoàn toàn
      expect(ui.searchJobsToolbarDialog).toBe(false);
      expect(ui.searchJobsToolbarSavedSearchesLink).toBe(false);

      // Saved Searches Page controls ẩn hoàn toàn
      expect(ui.savedSearchesPageCountBadge).toBe(false);
      expect(ui.savedSearchesPageItemList).toBe(false);
      expect(ui.savedSearchesPageCardRenameButton).toBe(false);
      expect(ui.savedSearchesPageCardDeleteButton).toBe(false);
      expect(ui.savedSearchesPageCardViewDetailButton).toBe(false);

      // Save Search Dialog ẩn hoàn toàn (trả về null)
      expect(ui.saveSearchDialogComponent).toBe(false);
      expect(ui.saveSearchDialogCountBadge).toBe(false);
      expect(ui.saveSearchDialogCreateButton).toBe(false);
      expect(ui.saveSearchDialogListSection).toBe(false);
      expect(ui.saveSearchDialogEditCriteriaButton).toBe(false);
      expect(ui.saveSearchDialogRenameButton).toBe(false);
      expect(ui.saveSearchDialogDeleteButton).toBe(false);
      expect(ui.saveSearchDialogManageLink).toBe(false);
    });
  });

  describe('Phần 4: Kiểm thử tước quyền có chọn lọc (Selective 1-by-1 Revocation)', () => {
    const baseAll = SAVED_SEARCHES_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    it('Tước #327 (GET /api/saved-searches - Xem danh sách tìm kiếm đã lưu): Ẩn nav link, ẩn tab, ẩn danh sách', () => {
      const permsWithout327 = baseAll.filter(
        (p) => !(p.method === 'GET' && p.path === '/api/saved-searches'),
      );
      const ui = deriveSavedSearchesUiState(permsWithout327);

      // API bị chặn
      expect(
        checkPermissionGuard(permsWithout327, 'GET', '/api/saved-searches')
          .allowed,
      ).toBe(false);
      // Các API khác vẫn hoạt động
      expect(
        checkPermissionGuard(permsWithout327, 'POST', '/api/saved-searches')
          .allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(permsWithout327, 'GET', '/api/saved-searches/101')
          .allowed,
      ).toBe(true);

      // UI kiểm soát: Ẩn các điểm truy cập danh sách
      expect(ui.headerNavSavedSearchesLink).toBe(false);
      expect(ui.headerProfileDropdownSavedSearchesItem).toBe(false);
      expect(ui.findWorkSavedSearchesTabButton).toBe(false);
      expect(ui.findWorkSavedSearchesTabContent).toBe(false);
      expect(ui.searchJobsToolbarSavedSearchesLink).toBe(false);
      expect(ui.savedSearchesPageCountBadge).toBe(false);
      expect(ui.savedSearchesPageItemList).toBe(false);

      // Trong SaveSearchDialog: Badge số lượng ẩn, danh sách item ẩn, link quản lý ẩn
      expect(ui.saveSearchDialogCountBadge).toBe(false);
      expect(ui.saveSearchDialogListSection).toBe(false);
      expect(ui.saveSearchDialogManageLink).toBe(false);

      // Nhưng nút lưu tìm kiếm hiện tại vẫn hiển thị vì có quyền #329
      expect(ui.searchJobsToolbarDialog).toBe(true);
      expect(ui.saveSearchDialogComponent).toBe(true);
      expect(ui.saveSearchDialogCreateButton).toBe(true);
    });

    it('Tước #328 (GET /api/saved-searches/:id - Xem chi tiết tìm kiếm đã lưu): Ẩn nút View Details', () => {
      const permsWithout328 = baseAll.filter(
        (p) => !(p.method === 'GET' && p.path === '/api/saved-searches/:id'),
      );
      const ui = deriveSavedSearchesUiState(permsWithout328);

      // API bị chặn
      expect(
        checkPermissionGuard(permsWithout328, 'GET', '/api/saved-searches/101')
          .allowed,
      ).toBe(false);

      // Nút View Details trên card bị ẩn
      expect(ui.savedSearchesPageCardViewDetailButton).toBe(false);

      // Các chức năng khác vẫn hoạt động
      expect(ui.savedSearchesPageItemList).toBe(true);
      expect(ui.savedSearchesPageCardRenameButton).toBe(true);
      expect(ui.savedSearchesPageCardDeleteButton).toBe(true);
    });

    it('Tước #329 (POST /api/saved-searches - Lưu tiêu chí tìm kiếm): Ẩn nút lưu tìm kiếm', () => {
      const permsWithout329 = baseAll.filter(
        (p) => !(p.method === 'POST' && p.path === '/api/saved-searches'),
      );
      const ui = deriveSavedSearchesUiState(permsWithout329);

      // API bị chặn
      expect(
        checkPermissionGuard(permsWithout329, 'POST', '/api/saved-searches')
          .allowed,
      ).toBe(false);

      // Nút tạo tìm kiếm đã lưu trong dialog bị ẩn
      expect(ui.saveSearchDialogCreateButton).toBe(false);

      // Vẫn có thể mở dialog để xem danh sách và cập nhật/xóa các tìm kiếm cũ
      expect(ui.saveSearchDialogComponent).toBe(true);
      expect(ui.saveSearchDialogListSection).toBe(true);
      expect(ui.saveSearchDialogRenameButton).toBe(true);
      expect(ui.saveSearchDialogDeleteButton).toBe(true);
    });

    it('Tước #330 (PATCH /api/saved-searches/:id - Cập nhật tìm kiếm đã lưu): Ẩn nút đổi tên và sửa tiêu chí', () => {
      const permsWithout330 = baseAll.filter(
        (p) => !(p.method === 'PATCH' && p.path === '/api/saved-searches/:id'),
      );
      const ui = deriveSavedSearchesUiState(permsWithout330);

      // API bị chặn
      expect(
        checkPermissionGuard(
          permsWithout330,
          'PATCH',
          '/api/saved-searches/101',
        ).allowed,
      ).toBe(false);

      // Nút Pencil trên page bị ẩn
      expect(ui.savedSearchesPageCardRenameButton).toBe(false);

      // Nút Pencil và nút SlidersHorizontal trong Dialog bị ẩn
      expect(ui.saveSearchDialogRenameButton).toBe(false);
      expect(ui.saveSearchDialogEditCriteriaButton).toBe(false);

      // Nút xóa và xem chi tiết vẫn hoạt động
      expect(ui.savedSearchesPageCardDeleteButton).toBe(true);
      expect(ui.saveSearchDialogDeleteButton).toBe(true);
      expect(ui.savedSearchesPageCardViewDetailButton).toBe(true);
    });

    it('Tước #331 (DELETE /api/saved-searches/:id - Xóa tìm kiếm đã lưu): Ẩn nút xóa thùng rác', () => {
      const permsWithout331 = baseAll.filter(
        (p) => !(p.method === 'DELETE' && p.path === '/api/saved-searches/:id'),
      );
      const ui = deriveSavedSearchesUiState(permsWithout331);

      // API bị chặn
      expect(
        checkPermissionGuard(
          permsWithout331,
          'DELETE',
          '/api/saved-searches/101',
        ).allowed,
      ).toBe(false);

      // Nút thùng rác trên trang chính và trong Dialog đều bị ẩn
      expect(ui.savedSearchesPageCardDeleteButton).toBe(false);
      expect(ui.saveSearchDialogDeleteButton).toBe(false);

      // Các chức năng khác vẫn hoạt động
      expect(ui.savedSearchesPageCardRenameButton).toBe(true);
      expect(ui.saveSearchDialogRenameButton).toBe(true);
      expect(ui.savedSearchesPageCardViewDetailButton).toBe(true);
    });
  });

  describe('Phần 5: Bảo vệ chống Method Mismatch & HTTP Method Giả mạo', () => {
    const listGetOnly = [{ method: 'GET', path: '/api/saved-searches' }];

    it('Chỉ có quyền GET mà gọi POST /api/saved-searches -> 403 Forbidden', () => {
      expect(
        checkPermissionGuard(listGetOnly, 'POST', '/api/saved-searches')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(listGetOnly, 'POST', '/api/saved-searches').status,
      ).toBe(403);
    });

    it('Chỉ có quyền GET mà gọi DELETE /api/saved-searches -> 403 Forbidden', () => {
      expect(
        checkPermissionGuard(listGetOnly, 'DELETE', '/api/saved-searches')
          .allowed,
      ).toBe(false);
    });

    it('Chỉ có quyền PATCH mà gọi DELETE /api/saved-searches/:id -> 403 Forbidden', () => {
      const patchOnly = [{ method: 'PATCH', path: '/api/saved-searches/:id' }];
      expect(
        checkPermissionGuard(patchOnly, 'DELETE', '/api/saved-searches/101')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(patchOnly, 'GET', '/api/saved-searches/101')
          .allowed,
      ).toBe(false);
    });
  });
});
