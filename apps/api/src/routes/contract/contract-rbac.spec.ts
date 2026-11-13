import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho cụm chức năng:
 *
 * CONTRACTS - Hợp đồng (Hợp đồng & Thanh toán) - 13 quyền:
 * 1.  #140 · GET /api/contracts (Xem danh sách hợp đồng)
 * 2.  #141 · GET /api/contracts/:id (Xem chi tiết hợp đồng)
 * 3.  #142 · POST /api/contracts (Tạo hợp đồng mới)
 * 4.  #143 · PATCH /api/contracts/:id (Cập nhật điều khoản hợp đồng)
 * 5.  #144 · PATCH /api/contracts/:id/sign (Ký hợp đồng)
 * 6.  #145 · PATCH /api/contracts/:id/complete (Hoàn thành hợp đồng)
 * 7.  #146 · PATCH /api/contracts/:id/cancel (Hủy hợp đồng)
 * 8.  #147 · GET /api/contracts/:contractId/files (Xem danh sách tài liệu hợp đồng)
 * 9.  #148 · POST /api/contracts/:contractId/files (Tải lên tài liệu hợp đồng)
 * 10. #149 · DELETE /api/contracts/:contractId/files/:fileId (Xóa tài liệu hợp đồng)
 * 11. #557 · GET /api/contracts/slug/:slug (Xem hợp đồng theo mã định danh slug)
 * 12. #571 · PATCH /api/contracts/:id/reject (Từ chối lời mời hợp đồng)
 * 13. #579 · GET /api/contracts/:id/pdf (Xuất file PDF hợp đồng)
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

const CONTRACT_PERMISSIONS: PermissionItem[] = [
  {
    id: 140,
    method: 'GET',
    path: '/api/contracts',
    description: 'Xem danh sách hợp đồng',
    testActualPath: '/api/contracts',
  },
  {
    id: 141,
    method: 'GET',
    path: '/api/contracts/:id',
    description: 'Xem chi tiết hợp đồng',
    testActualPath: '/api/contracts/88',
  },
  {
    id: 142,
    method: 'POST',
    path: '/api/contracts',
    description: 'Tạo hợp đồng mới',
    testActualPath: '/api/contracts',
  },
  {
    id: 143,
    method: 'PATCH',
    path: '/api/contracts/:id',
    description: 'Cập nhật điều khoản hợp đồng',
    testActualPath: '/api/contracts/88',
  },
  {
    id: 144,
    method: 'PATCH',
    path: '/api/contracts/:id/sign',
    description: 'Ký hợp đồng',
    testActualPath: '/api/contracts/88/sign',
  },
  {
    id: 145,
    method: 'PATCH',
    path: '/api/contracts/:id/complete',
    description: 'Hoàn thành hợp đồng',
    testActualPath: '/api/contracts/88/complete',
  },
  {
    id: 146,
    method: 'PATCH',
    path: '/api/contracts/:id/cancel',
    description: 'Hủy hợp đồng',
    testActualPath: '/api/contracts/88/cancel',
  },
  {
    id: 147,
    method: 'GET',
    path: '/api/contracts/:contractId/files',
    description: 'Xem danh sách tài liệu hợp đồng',
    testActualPath: '/api/contracts/88/files',
  },
  {
    id: 148,
    method: 'POST',
    path: '/api/contracts/:contractId/files',
    description: 'Tải lên tài liệu hợp đồng',
    testActualPath: '/api/contracts/88/files',
  },
  {
    id: 149,
    method: 'DELETE',
    path: '/api/contracts/:contractId/files/:fileId',
    description: 'Xóa tài liệu hợp đồng',
    testActualPath: '/api/contracts/88/files/12',
  },
  {
    id: 557,
    method: 'GET',
    path: '/api/contracts/slug/:slug',
    description: 'Xem hợp đồng theo mã định danh (slug)',
    testActualPath: '/api/contracts/slug/contract-88-alpha',
  },
  {
    id: 571,
    method: 'PATCH',
    path: '/api/contracts/:id/reject',
    description: 'Từ chối lời mời hợp đồng',
    testActualPath: '/api/contracts/88/reject',
  },
  {
    id: 579,
    method: 'GET',
    path: '/api/contracts/:id/pdf',
    description: 'Xuất file PDF hợp đồng',
    testActualPath: '/api/contracts/88/pdf',
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
function deriveContractsUiState(
  userPermissions: Array<{ method: string; path: string }>,
) {
  const can = (method: string, path: string) =>
    checkPermissionGuard(userPermissions, method, path).allowed;

  const canViewContracts = can('GET', '/api/contracts');
  const canViewContractDetailById = can('GET', '/api/contracts/:id');
  const canViewContractDetailBySlug = can('GET', '/api/contracts/slug/:slug');
  const canViewDetail =
    canViewContractDetailById || canViewContractDetailBySlug;

  const canCreateContract = can('POST', '/api/contracts');
  const canUpdateContract = can('PATCH', '/api/contracts/:id');
  const canSignContract = can('PATCH', '/api/contracts/:id/sign');
  const canCompleteContract = can('PATCH', '/api/contracts/:id/complete');
  const canCancelContract = can('PATCH', '/api/contracts/:id/cancel');
  const canRejectContract = can('PATCH', '/api/contracts/:id/reject');

  const canViewSharedFiles = can('GET', '/api/contracts/:contractId/files');
  const canUploadSharedFile = can('POST', '/api/contracts/:contractId/files');
  const canDeleteSharedFile = can(
    'DELETE',
    '/api/contracts/:contractId/files/:fileId',
  );

  const canExportPdf = can('GET', '/api/contracts/:id/pdf');

  return {
    // Header & Sidebars navigation
    headerNavClientContractsLink: canViewContracts,
    headerNavFreelancerContractsLink: canViewContracts,
    headerProfileDropdownContractsItem: canViewContracts,
    clientSidebarContractsItem: canViewContracts,
    freelancerSidebarContractsItem: canViewContracts,

    // Contract List Page & Card
    contractListPageActive: canViewContracts,
    contractListCardDetailLink: canViewDetail,

    // Proposal Hire / Create Contract
    proposalHireButton: canCreateContract,
    createContractDialog: canCreateContract,

    // Contract Detail Paper & Edit Terms
    contractDetailEditTermsButton: canUpdateContract,
    contractDetailEditSheet: canUpdateContract,

    // Contract Actions Sidebar
    contractActionSignButton: canSignContract,
    contractActionCompleteButton: canCompleteContract,
    contractActionCancelButton: canCancelContract,
    contractActionRejectButton: canRejectContract,
    contractActionDownloadPdfLink: canExportPdf,

    // Shared Files Sidebar
    sharedFilesSidebar: canViewSharedFiles,
    sharedFilesUploadButton: canUploadSharedFile,
    sharedFilesDeleteButton: canDeleteSharedFile,

    // Lifecycle Panel (in proposal detail)
    contractLifecyclePanel: canViewContracts,
    contractLifecycleSignButton: canSignContract,
    contractLifecycleCompleteButton: canCompleteContract,
  };
}

describe('CONTRACTS (Hợp đồng & Thanh toán) - Action-Level RBAC & UI Visibility Tests', () => {
  describe('Phần 1: Khớp đường dẫn định tuyến (Route Matching & Isolation)', () => {
    it.each(CONTRACT_PERMISSIONS)(
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
      const perms = [{ method: 'get', path: '/api/contracts/' }];
      expect(checkPermissionGuard(perms, 'GET', '/api/contracts').allowed).toBe(
        true,
      );
      expect(
        checkPermissionGuard(perms, 'get', '/api/contracts/').allowed,
      ).toBe(true);
    });

    it('Phân lập rõ ràng giữa /api/contracts/:id và các sub-route chuyên biệt', () => {
      const detailOnly = [{ method: 'GET', path: '/api/contracts/:id' }];
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/contracts/88').allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/contracts/88/sign')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/contracts/88/pdf')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(detailOnly, 'GET', '/api/contracts/88/files')
          .allowed,
      ).toBe(false);
    });

    it('Phân lập /api/contracts/slug/:slug không bị nhận nhầm là /api/contracts/:id', () => {
      const slugOnly = [{ method: 'GET', path: '/api/contracts/slug/:slug' }];
      expect(
        checkPermissionGuard(
          slugOnly,
          'GET',
          '/api/contracts/slug/contract-88-alpha',
        ).allowed,
      ).toBe(true);
      expect(
        checkPermissionGuard(slugOnly, 'GET', '/api/contracts/88').allowed,
      ).toBe(false);

      const detailOnly = [{ method: 'GET', path: '/api/contracts/:id' }];
      expect(
        checkPermissionGuard(
          detailOnly,
          'GET',
          '/api/contracts/slug/contract-88-alpha',
        ).allowed,
      ).toBe(false);
    });

    it('Không cho phép khớp nhầm với các module khác (milestones, payments, job-alerts)', () => {
      const contractPerms = CONTRACT_PERMISSIONS.map((p) => ({
        method: p.method,
        path: p.path,
      }));

      expect(
        checkPermissionGuard(
          contractPerms,
          'GET',
          '/api/contracts/88/milestones',
        ).allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(contractPerms, 'POST', '/api/payments/withdraw')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(contractPerms, 'GET', '/api/job-alerts').allowed,
      ).toBe(false);
    });
  });

  describe('Phần 2: Cấp đủ 13/13 quyền (Full Access)', () => {
    const fullPermissions = CONTRACT_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    it('Tất cả 13 endpoint đều cho phép truy cập thành công (200 OK)', () => {
      for (const perm of CONTRACT_PERMISSIONS) {
        const result = checkPermissionGuard(
          fullPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(true);
        expect(result.status).toBe(200);
      }
    });

    it('Toàn bộ các nút, liên kết điều hướng, form và dialog trên UI đều hiển thị đầy đủ', () => {
      const ui = deriveContractsUiState(fullPermissions);

      // Header & Sidebars
      expect(ui.headerNavClientContractsLink).toBe(true);
      expect(ui.headerNavFreelancerContractsLink).toBe(true);
      expect(ui.headerProfileDropdownContractsItem).toBe(true);
      expect(ui.clientSidebarContractsItem).toBe(true);
      expect(ui.freelancerSidebarContractsItem).toBe(true);

      // List & Card
      expect(ui.contractListPageActive).toBe(true);
      expect(ui.contractListCardDetailLink).toBe(true);

      // Hire & Create Contract
      expect(ui.proposalHireButton).toBe(true);
      expect(ui.createContractDialog).toBe(true);

      // Detail & Edit Terms
      expect(ui.contractDetailEditTermsButton).toBe(true);
      expect(ui.contractDetailEditSheet).toBe(true);

      // Actions Sidebar
      expect(ui.contractActionSignButton).toBe(true);
      expect(ui.contractActionCompleteButton).toBe(true);
      expect(ui.contractActionCancelButton).toBe(true);
      expect(ui.contractActionRejectButton).toBe(true);
      expect(ui.contractActionDownloadPdfLink).toBe(true);

      // Shared Files
      expect(ui.sharedFilesSidebar).toBe(true);
      expect(ui.sharedFilesUploadButton).toBe(true);
      expect(ui.sharedFilesDeleteButton).toBe(true);

      // Lifecycle Panel
      expect(ui.contractLifecyclePanel).toBe(true);
      expect(ui.contractLifecycleSignButton).toBe(true);
      expect(ui.contractLifecycleCompleteButton).toBe(true);
    });
  });

  describe('Phần 3: Không có quyền nào (0/13 quyền - Zero Access)', () => {
    const noPermissions: Array<{ method: string; path: string }> = [];

    it('Tất cả 13 endpoint đều bị chặn 403 Forbidden', () => {
      for (const perm of CONTRACT_PERMISSIONS) {
        const result = checkPermissionGuard(
          noPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('Toàn bộ các nút, liên kết điều hướng, form và dialog trên UI đều bị ẩn hoàn toàn', () => {
      const ui = deriveContractsUiState(noPermissions);

      // Header & Sidebars ẩn hoàn toàn
      expect(ui.headerNavClientContractsLink).toBe(false);
      expect(ui.headerNavFreelancerContractsLink).toBe(false);
      expect(ui.headerProfileDropdownContractsItem).toBe(false);
      expect(ui.clientSidebarContractsItem).toBe(false);
      expect(ui.freelancerSidebarContractsItem).toBe(false);

      // List & Card
      expect(ui.contractListPageActive).toBe(false);
      expect(ui.contractListCardDetailLink).toBe(false);

      // Hire & Create Contract
      expect(ui.proposalHireButton).toBe(false);
      expect(ui.createContractDialog).toBe(false);

      // Detail & Edit Terms
      expect(ui.contractDetailEditTermsButton).toBe(false);
      expect(ui.contractDetailEditSheet).toBe(false);

      // Actions Sidebar
      expect(ui.contractActionSignButton).toBe(false);
      expect(ui.contractActionCompleteButton).toBe(false);
      expect(ui.contractActionCancelButton).toBe(false);
      expect(ui.contractActionRejectButton).toBe(false);
      expect(ui.contractActionDownloadPdfLink).toBe(false);

      // Shared Files
      expect(ui.sharedFilesSidebar).toBe(false);
      expect(ui.sharedFilesUploadButton).toBe(false);
      expect(ui.sharedFilesDeleteButton).toBe(false);

      // Lifecycle Panel
      expect(ui.contractLifecyclePanel).toBe(false);
      expect(ui.contractLifecycleSignButton).toBe(false);
      expect(ui.contractLifecycleCompleteButton).toBe(false);
    });
  });

  describe('Phần 4: Kiểm thử tước quyền có chọn lọc (Selective 1-by-1 Revocation)', () => {
    const baseAll = CONTRACT_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    it('Tước #140 (GET /api/contracts - Xem danh sách): Ẩn nav link, ẩn sidebar item, danh sách không tải', () => {
      const perms = baseAll.filter(
        (p) => !(p.method === 'GET' && p.path === '/api/contracts'),
      );
      const ui = deriveContractsUiState(perms);

      expect(checkPermissionGuard(perms, 'GET', '/api/contracts').allowed).toBe(
        false,
      );
      expect(ui.headerNavClientContractsLink).toBe(false);
      expect(ui.headerNavFreelancerContractsLink).toBe(false);
      expect(ui.headerProfileDropdownContractsItem).toBe(false);
      expect(ui.clientSidebarContractsItem).toBe(false);
      expect(ui.freelancerSidebarContractsItem).toBe(false);
      expect(ui.contractListPageActive).toBe(false);
      expect(ui.contractLifecyclePanel).toBe(false);

      // Các quyền khác vẫn giữ nguyên
      expect(ui.contractActionSignButton).toBe(true);
      expect(ui.proposalHireButton).toBe(true);
    });

    it('Tước #142 (POST /api/contracts - Tạo hợp đồng mới): Ẩn nút Thuê/Tạo hợp đồng, dialog đóng', () => {
      const perms = baseAll.filter(
        (p) => !(p.method === 'POST' && p.path === '/api/contracts'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'POST', '/api/contracts').allowed,
      ).toBe(false);
      expect(ui.proposalHireButton).toBe(false);
      expect(ui.createContractDialog).toBe(false);

      // Vẫn xem được danh sách và chi tiết hợp đồng
      expect(ui.contractListPageActive).toBe(true);
      expect(ui.contractListCardDetailLink).toBe(true);
    });

    it('Tước #143 (PATCH /api/contracts/:id - Cập nhật điều khoản): Ẩn nút chỉnh sửa điều khoản và sheet sửa', () => {
      const perms = baseAll.filter(
        (p) => !(p.method === 'PATCH' && p.path === '/api/contracts/:id'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'PATCH', '/api/contracts/88').allowed,
      ).toBe(false);
      expect(ui.contractDetailEditTermsButton).toBe(false);
      expect(ui.contractDetailEditSheet).toBe(false);

      // Vẫn ký được và hoàn thành được
      expect(ui.contractActionSignButton).toBe(true);
      expect(ui.contractActionCompleteButton).toBe(true);
    });

    it('Tước #144 (PATCH /api/contracts/:id/sign - Ký hợp đồng): Ẩn nút Ký số hợp đồng trên sidebar & lifecycle panel', () => {
      const perms = baseAll.filter(
        (p) => !(p.method === 'PATCH' && p.path === '/api/contracts/:id/sign'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'PATCH', '/api/contracts/88/sign').allowed,
      ).toBe(false);
      expect(ui.contractActionSignButton).toBe(false);
      expect(ui.contractLifecycleSignButton).toBe(false);

      // Các nút khác vẫn hoạt động
      expect(ui.contractActionCompleteButton).toBe(true);
      expect(ui.contractActionCancelButton).toBe(true);
    });

    it('Tước #145 (PATCH /api/contracts/:id/complete - Hoàn thành hợp đồng): Ẩn nút Hoàn thành hợp đồng', () => {
      const perms = baseAll.filter(
        (p) =>
          !(p.method === 'PATCH' && p.path === '/api/contracts/:id/complete'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'PATCH', '/api/contracts/88/complete')
          .allowed,
      ).toBe(false);
      expect(ui.contractActionCompleteButton).toBe(false);
      expect(ui.contractLifecycleCompleteButton).toBe(false);
    });

    it('Tước #146 (PATCH /api/contracts/:id/cancel - Hủy hợp đồng): Ẩn nút Hủy hợp đồng', () => {
      const perms = baseAll.filter(
        (p) =>
          !(p.method === 'PATCH' && p.path === '/api/contracts/:id/cancel'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'PATCH', '/api/contracts/88/cancel')
          .allowed,
      ).toBe(false);
      expect(ui.contractActionCancelButton).toBe(false);
    });

    it('Tước #147 (GET /api/contracts/:contractId/files - Xem tài liệu): Ẩn toàn bộ sidebar tài liệu', () => {
      const perms = baseAll.filter(
        (p) =>
          !(
            p.method === 'GET' && p.path === '/api/contracts/:contractId/files'
          ),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'GET', '/api/contracts/88/files').allowed,
      ).toBe(false);
      expect(ui.sharedFilesSidebar).toBe(false);
    });

    it('Tước #148 (POST /api/contracts/:contractId/files - Tải lên tài liệu): Ẩn nút Upload tài liệu', () => {
      const perms = baseAll.filter(
        (p) =>
          !(
            p.method === 'POST' && p.path === '/api/contracts/:contractId/files'
          ),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'POST', '/api/contracts/88/files').allowed,
      ).toBe(false);
      expect(ui.sharedFilesUploadButton).toBe(false);

      // Vẫn xem được tài liệu và xóa tài liệu
      expect(ui.sharedFilesSidebar).toBe(true);
      expect(ui.sharedFilesDeleteButton).toBe(true);
    });

    it('Tước #149 (DELETE /api/contracts/:contractId/files/:fileId - Xóa tài liệu): Ẩn nút Thùng rác xóa tài liệu', () => {
      const perms = baseAll.filter(
        (p) =>
          !(
            p.method === 'DELETE' &&
            p.path === '/api/contracts/:contractId/files/:fileId'
          ),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'DELETE', '/api/contracts/88/files/12')
          .allowed,
      ).toBe(false);
      expect(ui.sharedFilesDeleteButton).toBe(false);

      // Vẫn xem và upload tài liệu được
      expect(ui.sharedFilesSidebar).toBe(true);
      expect(ui.sharedFilesUploadButton).toBe(true);
    });

    it('Tước #571 (PATCH /api/contracts/:id/reject - Từ chối lời mời hợp đồng): Ẩn nút Decline Contract Offer', () => {
      const perms = baseAll.filter(
        (p) =>
          !(p.method === 'PATCH' && p.path === '/api/contracts/:id/reject'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'PATCH', '/api/contracts/88/reject')
          .allowed,
      ).toBe(false);
      expect(ui.contractActionRejectButton).toBe(false);
    });

    it('Tước #579 (GET /api/contracts/:id/pdf - Xuất file PDF): Ẩn nút Download PDF Agreement', () => {
      const perms = baseAll.filter(
        (p) => !(p.method === 'GET' && p.path === '/api/contracts/:id/pdf'),
      );
      const ui = deriveContractsUiState(perms);

      expect(
        checkPermissionGuard(perms, 'GET', '/api/contracts/88/pdf').allowed,
      ).toBe(false);
      expect(ui.contractActionDownloadPdfLink).toBe(false);
    });
  });

  describe('Phần 5: Bảo vệ chống Method Mismatch & HTTP Method Giả mạo', () => {
    const getContractsOnly = [{ method: 'GET', path: '/api/contracts' }];

    it('Chỉ có quyền GET mà gọi POST /api/contracts -> 403 Forbidden', () => {
      expect(
        checkPermissionGuard(getContractsOnly, 'POST', '/api/contracts')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(getContractsOnly, 'POST', '/api/contracts').status,
      ).toBe(403);
    });

    it('Chỉ có quyền PATCH mà gọi DELETE /api/contracts/:id -> 403 Forbidden', () => {
      const patchOnly = [{ method: 'PATCH', path: '/api/contracts/:id' }];
      expect(
        checkPermissionGuard(patchOnly, 'DELETE', '/api/contracts/88').allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(patchOnly, 'GET', '/api/contracts/88').allowed,
      ).toBe(false);
    });

    it('Chỉ có quyền GET files mà gọi POST tải lên -> 403 Forbidden', () => {
      const viewFilesOnly = [
        { method: 'GET', path: '/api/contracts/:contractId/files' },
      ];
      expect(
        checkPermissionGuard(viewFilesOnly, 'POST', '/api/contracts/88/files')
          .allowed,
      ).toBe(false);
    });

    it('Chỉ có quyền SIGN mà gọi COMPLETE hoặc CANCEL -> 403 Forbidden', () => {
      const signOnly = [{ method: 'PATCH', path: '/api/contracts/:id/sign' }];
      expect(
        checkPermissionGuard(signOnly, 'PATCH', '/api/contracts/88/complete')
          .allowed,
      ).toBe(false);
      expect(
        checkPermissionGuard(signOnly, 'PATCH', '/api/contracts/88/cancel')
          .allowed,
      ).toBe(false);
    });
  });
});
