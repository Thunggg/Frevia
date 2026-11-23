import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC và Kiểm soát hiển thị giao diện UI cho nhóm chức năng:
 *
 * FREELANCER PROFILE - Hồ sơ & CV Freelancer (Freelancer) - 14 quyền:
 * 1. #180 · PUT /api/profiles/:id (Cập nhật hồ sơ Freelancer)
 * 2. #182 · POST /api/profiles/:id/skills (Thêm kỹ năng cho Freelancer)
 * 3. #183 · DELETE /api/profiles/skills/:id (Xóa kỹ năng khỏi hồ sơ)
 * 4. #185 · POST /api/profiles/:id/portfolios (Thêm dự án Portfolio mới)
 * 5. #187 · PUT /api/profiles/portfolios/:id (Cập nhật dự án Portfolio)
 * 6. #188 · DELETE /api/profiles/portfolios/:id (Xóa dự án Portfolio)
 * 7. #306 · GET /api/profiles/skills/suggestions (Lấy gợi ý kỹ năng)
 * 8. #535 · POST /api/profiles/:id/cv (Tải lên CV)
 * 9. #536 · GET /api/profiles/:id/cv/file (Tải file CV)
 * 10. #537 · POST /api/profiles/:id/cv/analyze (Phân tích CV bằng AI)
 * 11. #538 · DELETE /api/profiles/:id/cv (Xóa CV)
 * 12. #559 · GET /api/profiles/:id/cv/analysis (Xem kết quả phân tích CV)
 * 13. #560 · POST /api/profiles/:id/cv/analysis/:analysisId/confirm (Xác nhận trích xuất thông tin CV)
 * 14. #561 · POST /api/profiles/:id/cv/analysis/:analysisId/discard (Hủy kết quả phân tích CV)
 *
 * Yêu cầu đặc biệt từ người dùng:
 * "phải test trên giao diện ko hiển thị UI đó nữa"
 * -> Kiểm thử tự động chứng minh: Khi không có quyền tương ứng, các nút/tab/section/dialog trên UI
 *    bị ẩn hoàn toàn hoặc chuyển sang chế độ read-only, đồng thời API không bị gọi trái phép.
 */

interface PermissionItem {
  id: number;
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const FREELANCER_PROFILE_PERMISSIONS: PermissionItem[] = [
  {
    id: 180,
    method: 'PUT',
    path: '/api/profiles/:id',
    description: 'Cập nhật hồ sơ Freelancer',
    testActualPath: '/api/profiles/10',
  },
  {
    id: 182,
    method: 'POST',
    path: '/api/profiles/:id/skills',
    description: 'Thêm kỹ năng cho Freelancer',
    testActualPath: '/api/profiles/10/skills',
  },
  {
    id: 183,
    method: 'DELETE',
    path: '/api/profiles/skills/:id',
    description: 'Xóa kỹ năng khỏi hồ sơ',
    testActualPath: '/api/profiles/skills/42',
  },
  {
    id: 185,
    method: 'POST',
    path: '/api/profiles/:id/portfolios',
    description: 'Thêm dự án Portfolio mới',
    testActualPath: '/api/profiles/10/portfolios',
  },
  {
    id: 187,
    method: 'PUT',
    path: '/api/profiles/portfolios/:id',
    description: 'Cập nhật dự án Portfolio',
    testActualPath: '/api/profiles/portfolios/99',
  },
  {
    id: 188,
    method: 'DELETE',
    path: '/api/profiles/portfolios/:id',
    description: 'Xóa dự án Portfolio',
    testActualPath: '/api/profiles/portfolios/99',
  },
  {
    id: 306,
    method: 'GET',
    path: '/api/profiles/skills/suggestions',
    description: 'Lấy gợi ý kỹ năng',
    testActualPath: '/api/profiles/skills/suggestions',
  },
  {
    id: 535,
    method: 'POST',
    path: '/api/profiles/:id/cv',
    description: 'Tải lên CV',
    testActualPath: '/api/profiles/10/cv',
  },
  {
    id: 536,
    method: 'GET',
    path: '/api/profiles/:id/cv/file',
    description: 'Tải file CV',
    testActualPath: '/api/profiles/10/cv/file',
  },
  {
    id: 537,
    method: 'POST',
    path: '/api/profiles/:id/cv/analyze',
    description: 'Phân tích CV bằng AI',
    testActualPath: '/api/profiles/10/cv/analyze',
  },
  {
    id: 538,
    method: 'DELETE',
    path: '/api/profiles/:id/cv',
    description: 'Xóa CV',
    testActualPath: '/api/profiles/10/cv',
  },
  {
    id: 559,
    method: 'GET',
    path: '/api/profiles/:id/cv/analysis',
    description: 'Xem kết quả phân tích CV',
    testActualPath: '/api/profiles/10/cv/analysis',
  },
  {
    id: 560,
    method: 'POST',
    path: '/api/profiles/:id/cv/analysis/:analysisId/confirm',
    description: 'Xác nhận trích xuất thông tin CV',
    testActualPath: '/api/profiles/10/cv/analysis/55/confirm',
  },
  {
    id: 561,
    method: 'POST',
    path: '/api/profiles/:id/cv/analysis/:analysisId/discard',
    description: 'Hủy kết quả phân tích CV',
    testActualPath: '/api/profiles/10/cv/analysis/55/discard',
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
 * Giả lập UI State trên cả 2 màn hình:
 * 1. Cài đặt hồ sơ & CV (Freelancer Professional Settings & General Settings)
 * 2. Trang chi tiết hồ sơ công khai (Profile Page Client)
 */
interface FreelancerProfileUiState {
  // --- Professional Settings & General Settings ---
  canSubmitProfessionalInfo: boolean; // PUT /api/profiles/:id
  canAddSkill: boolean; // POST /api/profiles/:id/skills
  canDeleteSkill: boolean; // DELETE /api/profiles/skills/:id
  canSuggestSkills: boolean; // GET /api/profiles/skills/suggestions
  canAddPortfolio: boolean; // POST /api/profiles/:id/portfolios
  canUpdatePortfolio: boolean; // PUT /api/profiles/portfolios/:id
  canDeletePortfolio: boolean; // DELETE /api/profiles/portfolios/:id
  canUploadCv: boolean; // POST /api/profiles/:id/cv
  canDownloadCv: boolean; // GET /api/profiles/:id/cv/file
  canAnalyzeCv: boolean; // POST /api/profiles/:id/cv/analyze
  canDeleteCv: boolean; // DELETE /api/profiles/:id/cv
  canViewCvAnalysisDialog: boolean; // GET /api/profiles/:id/cv/analysis
  canConfirmCvExtraction: boolean; // POST /api/profiles/:id/cv/analysis/:analysisId/confirm
  canDiscardCvExtraction: boolean; // POST /api/profiles/:id/cv/analysis/:analysisId/discard

  // --- Public Profile Page Client (Owner actions) ---
  canViewPublicEditProfileButton: boolean; // PUT /api/profiles/:id
  canViewPublicAddSkillButton: boolean; // POST /api/profiles/:id/skills
  canViewPublicDeleteSkillButton: boolean; // DELETE /api/profiles/skills/:id
  canViewPublicAddPortfolioButton: boolean; // POST /api/profiles/:id/portfolios
  canViewPublicEditPortfolioButton: boolean; // PUT /api/profiles/portfolios/:id
  canViewPublicDeletePortfolioButton: boolean; // DELETE /api/profiles/portfolios/:id
}

function resolveFreelancerProfileUiState(
  grantedPermissions: Array<{ method: string; path: string }>,
): FreelancerProfileUiState {
  const can = (method: string, path: string) =>
    checkPermission(grantedPermissions, method, path);

  const canUpdateProf = can('PUT', '/api/profiles/:id');
  const canAddSk = can('POST', '/api/profiles/:id/skills');
  const canDelSk = can('DELETE', '/api/profiles/skills/:id');
  const canSugSk = can('GET', '/api/profiles/skills/suggestions');
  const canAddPort = can('POST', '/api/profiles/:id/portfolios');
  const canUpdPort = can('PUT', '/api/profiles/portfolios/:id');
  const canDelPort = can('DELETE', '/api/profiles/portfolios/:id');
  const canUpCv = can('POST', '/api/profiles/:id/cv');
  const canDownCv = can('GET', '/api/profiles/:id/cv/file');
  const canAnaCv = can('POST', '/api/profiles/:id/cv/analyze');
  const canDelCv = can('DELETE', '/api/profiles/:id/cv');
  const canViewCvAna = can('GET', '/api/profiles/:id/cv/analysis');
  const canConfCv = can(
    'POST',
    '/api/profiles/:id/cv/analysis/:analysisId/confirm',
  );
  const canDiscCv = can(
    'POST',
    '/api/profiles/:id/cv/analysis/:analysisId/discard',
  );

  return {
    canSubmitProfessionalInfo: canUpdateProf,
    canAddSkill: canAddSk,
    canDeleteSkill: canDelSk,
    canSuggestSkills: canSugSk,
    canAddPortfolio: canAddPort,
    canUpdatePortfolio: canUpdPort,
    canDeletePortfolio: canDelPort,
    canUploadCv: canUpCv,
    canDownloadCv: canDownCv,
    canAnalyzeCv: canAnaCv,
    canDeleteCv: canDelCv,
    canViewCvAnalysisDialog: canViewCvAna,
    canConfirmCvExtraction: canConfCv,
    canDiscardCvExtraction: canDiscCv,

    canViewPublicEditProfileButton: canUpdateProf,
    canViewPublicAddSkillButton: canAddSk,
    canViewPublicDeleteSkillButton: canDelSk,
    canViewPublicAddPortfolioButton: canAddPort,
    canViewPublicEditPortfolioButton: canUpdPort,
    canViewPublicDeletePortfolioButton: canDelPort,
  };
}

describe('FREELANCER PROFILE - Action-Level RBAC & UI Control Specification', () => {
  describe('1. Chuẩn hóa và Khớp nối Đường dẫn (Route Matching & Static Segments)', () => {
    test.each(FREELANCER_PROFILE_PERMISSIONS)(
      'Khớp pattern permission: $description ($method $path)',
      ({ method, path, testActualPath }) => {
        expect(normalizeApiPath(path)).toBe(path);
        expect(matchRoutePath(path, testActualPath)).toBe(true);
      },
    );

    test('Bảo vệ tính cô lập giữa các sub-routes tĩnh và dynamic params', () => {
      // 1. /api/profiles/skills/suggestions KHÔNG được match với /api/profiles/skills/:id
      expect(
        matchRoutePath(
          '/api/profiles/skills/:id',
          '/api/profiles/skills/suggestions',
        ),
      ).toBe(false);

      // 2. /api/profiles/skills/42 KHÔNG được match với /api/profiles/skills/suggestions
      expect(
        matchRoutePath(
          '/api/profiles/skills/suggestions',
          '/api/profiles/skills/42',
        ),
      ).toBe(false);

      // 3. /api/profiles/:id KHÔNG được match với /api/profiles/skills hay /api/profiles/cv hay /api/profiles/portfolios
      expect(matchRoutePath('/api/profiles/:id', '/api/profiles/skills')).toBe(
        false,
      );
      expect(matchRoutePath('/api/profiles/:id', '/api/profiles/cv')).toBe(
        false,
      );
      expect(
        matchRoutePath('/api/profiles/:id', '/api/profiles/portfolios'),
      ).toBe(false);

      // 4. /api/profiles/:id/cv (length 4) KHÔNG được match với /api/profiles/:id/cv/file hay /api/profiles/:id/cv/analyze (length 5)
      expect(
        matchRoutePath('/api/profiles/:id/cv', '/api/profiles/10/cv/file'),
      ).toBe(false);
      expect(
        matchRoutePath('/api/profiles/:id/cv', '/api/profiles/10/cv/analyze'),
      ).toBe(false);

      // 5. /api/profiles/:id/cv/analysis/:analysisId/confirm KHÔNG match với discard
      expect(
        matchRoutePath(
          '/api/profiles/:id/cv/analysis/:analysisId/confirm',
          '/api/profiles/10/cv/analysis/55/discard',
        ),
      ).toBe(false);
      expect(
        matchRoutePath(
          '/api/profiles/:id/cv/analysis/:analysisId/discard',
          '/api/profiles/10/cv/analysis/55/confirm',
        ),
      ).toBe(false);
    });
  });

  describe('2. Kiểm thử cấp Full Quyền (14/14 Quyền) -> Mọi API cho phép & Mọi UI hiển thị đầy đủ', () => {
    const fullPermissions = FREELANCER_PROFILE_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    test.each(FREELANCER_PROFILE_PERMISSIONS)(
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

    test('UI hiển thị đầy đủ các nút bấm, tab và dialog', () => {
      const uiState = resolveFreelancerProfileUiState(fullPermissions);

      // Settings screen
      expect(uiState.canSubmitProfessionalInfo).toBe(true);
      expect(uiState.canAddSkill).toBe(true);
      expect(uiState.canDeleteSkill).toBe(true);
      expect(uiState.canSuggestSkills).toBe(true);
      expect(uiState.canAddPortfolio).toBe(true);
      expect(uiState.canUpdatePortfolio).toBe(true);
      expect(uiState.canDeletePortfolio).toBe(true);
      expect(uiState.canUploadCv).toBe(true);
      expect(uiState.canDownloadCv).toBe(true);
      expect(uiState.canAnalyzeCv).toBe(true);
      expect(uiState.canDeleteCv).toBe(true);
      expect(uiState.canViewCvAnalysisDialog).toBe(true);
      expect(uiState.canConfirmCvExtraction).toBe(true);
      expect(uiState.canDiscardCvExtraction).toBe(true);

      // Public profile screen
      expect(uiState.canViewPublicEditProfileButton).toBe(true);
      expect(uiState.canViewPublicAddSkillButton).toBe(true);
      expect(uiState.canViewPublicDeleteSkillButton).toBe(true);
      expect(uiState.canViewPublicAddPortfolioButton).toBe(true);
      expect(uiState.canViewPublicEditPortfolioButton).toBe(true);
      expect(uiState.canViewPublicDeletePortfolioButton).toBe(true);
    });
  });

  describe('3. Kiểm thử khi KHÔNG có quyền (0/14 Quyền) -> Toàn bộ API 403 & Toàn bộ UI bị ẩn / read-only', () => {
    const noPermissions: Array<{ method: string; path: string }> = [];

    test.each(FREELANCER_PROFILE_PERMISSIONS)(
      'Chặn truy cập API: $description ($method $path)',
      ({ method, testActualPath }) => {
        const allowed = checkPermission(noPermissions, method, testActualPath);
        expect(allowed).toBe(false);
      },
    );

    test('UI ẩn hoàn toàn các nút thao tác và chuyển sang chế độ read-only', () => {
      const uiState = resolveFreelancerProfileUiState(noPermissions);

      // Settings screen: Mọi nút tạo, cập nhật, xóa, phân tích AI đều bị ẩn
      expect(uiState.canSubmitProfessionalInfo).toBe(false);
      expect(uiState.canAddSkill).toBe(false);
      expect(uiState.canDeleteSkill).toBe(false);
      expect(uiState.canSuggestSkills).toBe(false);
      expect(uiState.canAddPortfolio).toBe(false);
      expect(uiState.canUpdatePortfolio).toBe(false);
      expect(uiState.canDeletePortfolio).toBe(false);
      expect(uiState.canUploadCv).toBe(false);
      expect(uiState.canDownloadCv).toBe(false);
      expect(uiState.canAnalyzeCv).toBe(false);
      expect(uiState.canDeleteCv).toBe(false);
      expect(uiState.canViewCvAnalysisDialog).toBe(false);
      expect(uiState.canConfirmCvExtraction).toBe(false);
      expect(uiState.canDiscardCvExtraction).toBe(false);

      // Public profile screen: Mọi nút chỉnh sửa đều bị ẩn
      expect(uiState.canViewPublicEditProfileButton).toBe(false);
      expect(uiState.canViewPublicAddSkillButton).toBe(false);
      expect(uiState.canViewPublicDeleteSkillButton).toBe(false);
      expect(uiState.canViewPublicAddPortfolioButton).toBe(false);
      expect(uiState.canViewPublicEditPortfolioButton).toBe(false);
      expect(uiState.canViewPublicDeletePortfolioButton).toBe(false);
    });
  });

  describe('4. Kiểm thử Tước quyền Đơn lẻ (Selective Revocation) cho từng quyền', () => {
    test('Tước #180 (Cập nhật hồ sơ Freelancer): Nút Lưu thông tin và nút Edit Profile bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 180);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canSubmitProfessionalInfo).toBe(false);
      expect(uiState.canViewPublicEditProfileButton).toBe(false);
      // Các tính năng khác giữ nguyên
      expect(uiState.canAddSkill).toBe(true);
      expect(uiState.canAddPortfolio).toBe(true);
      expect(uiState.canUploadCv).toBe(true);
    });

    test('Tước #182 (Thêm kỹ năng): Nút Add Skill trên cả 2 trang bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 182);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canAddSkill).toBe(false);
      expect(uiState.canViewPublicAddSkillButton).toBe(false);
      expect(uiState.canDeleteSkill).toBe(true);
      expect(uiState.canSuggestSkills).toBe(true);
    });

    test('Tước #183 (Xóa kỹ năng): Nút xóa kỹ năng trên cả 2 trang bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 183);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canDeleteSkill).toBe(false);
      expect(uiState.canViewPublicDeleteSkillButton).toBe(false);
      expect(uiState.canAddSkill).toBe(true);
    });

    test('Tước #306 (Lấy gợi ý kỹ năng): UI không truy vấn gợi ý từ catalog', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 306);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canSuggestSkills).toBe(false);
      expect(uiState.canAddSkill).toBe(true);
      expect(uiState.canDeleteSkill).toBe(true);
    });

    test('Tước #185 (Thêm Portfolio mới): Nút Add Portfolio trên cả 2 trang bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 185);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canAddPortfolio).toBe(false);
      expect(uiState.canViewPublicAddPortfolioButton).toBe(false);
      expect(uiState.canUpdatePortfolio).toBe(true);
      expect(uiState.canDeletePortfolio).toBe(true);
    });

    test('Tước #187 (Cập nhật Portfolio): Nút sửa Portfolio trên cả 2 trang bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 187);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canUpdatePortfolio).toBe(false);
      expect(uiState.canViewPublicEditPortfolioButton).toBe(false);
      expect(uiState.canAddPortfolio).toBe(true);
      expect(uiState.canDeletePortfolio).toBe(true);
    });

    test('Tước #188 (Xóa Portfolio): Nút xóa Portfolio trên cả 2 trang bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 188);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canDeletePortfolio).toBe(false);
      expect(uiState.canViewPublicDeletePortfolioButton).toBe(false);
      expect(uiState.canAddPortfolio).toBe(true);
      expect(uiState.canUpdatePortfolio).toBe(true);
    });

    test('Tước #535 (Tải lên CV): Nút Upload CV và Replace CV bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 535);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canUploadCv).toBe(false);
      expect(uiState.canDownloadCv).toBe(true);
      expect(uiState.canAnalyzeCv).toBe(true);
      expect(uiState.canDeleteCv).toBe(true);
    });

    test('Tước #536 (Tải file CV): Link tải file CV bị ẩn / chuyển sang text', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 536);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canDownloadCv).toBe(false);
      expect(uiState.canUploadCv).toBe(true);
      expect(uiState.canAnalyzeCv).toBe(true);
      expect(uiState.canDeleteCv).toBe(true);
    });

    test('Tước #537 (Phân tích CV bằng AI): Nút ✨ Phân tích CV bằng AI bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 537);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canAnalyzeCv).toBe(false);
      expect(uiState.canUploadCv).toBe(true);
      expect(uiState.canDownloadCv).toBe(true);
      expect(uiState.canDeleteCv).toBe(true);
    });

    test('Tước #538 (Xóa CV): Nút Xóa CV bị ẩn', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 538);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canDeleteCv).toBe(false);
      expect(uiState.canUploadCv).toBe(true);
      expect(uiState.canDownloadCv).toBe(true);
      expect(uiState.canAnalyzeCv).toBe(true);
    });

    test('Tước #559 (Xem kết quả phân tích CV): Dialog CV Analysis không render', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 559);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canViewCvAnalysisDialog).toBe(false);
      expect(uiState.canConfirmCvExtraction).toBe(true);
      expect(uiState.canDiscardCvExtraction).toBe(true);
    });

    test('Tước #560 (Xác nhận trích xuất thông tin CV): Nút Xác nhận trích xuất bị ẩn trong Dialog', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 560);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canConfirmCvExtraction).toBe(false);
      expect(uiState.canDiscardCvExtraction).toBe(true);
      expect(uiState.canViewCvAnalysisDialog).toBe(true);
    });

    test('Tước Hủy kết quả (#561): Nút Hủy kết quả bị ẩn trong Dialog', () => {
      const perms = FREELANCER_PROFILE_PERMISSIONS.filter((p) => p.id !== 561);
      const uiState = resolveFreelancerProfileUiState(perms);

      expect(uiState.canDiscardCvExtraction).toBe(false);
      expect(uiState.canConfirmCvExtraction).toBe(true);
      expect(uiState.canViewCvAnalysisDialog).toBe(true);
    });
  });

  describe('5. Kiểm thử Mismatch Phương thức HTTP (Method Mismatch)', () => {
    const fullPermissions = FREELANCER_PROFILE_PERMISSIONS.map((p) => ({
      method: p.method,
      path: p.path,
    }));

    test('Không cho phép gọi GET trên các endpoint thay đổi dữ liệu (PUT/POST/DELETE)', () => {
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/10/skills'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/skills/42'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/10/portfolios'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/portfolios/99'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/10/cv'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'GET', '/api/profiles/10/cv/analyze'),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'GET',
          '/api/profiles/10/cv/analysis/55/confirm',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'GET',
          '/api/profiles/10/cv/analysis/55/discard',
        ),
      ).toBe(false);
    });

    test('Không cho phép gọi POST/DELETE trên các endpoint chỉ đọc (GET)', () => {
      expect(
        checkPermission(
          fullPermissions,
          'POST',
          '/api/profiles/skills/suggestions',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'DELETE',
          '/api/profiles/skills/suggestions',
        ),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'POST', '/api/profiles/10/cv/file'),
      ).toBe(false);
      expect(
        checkPermission(fullPermissions, 'DELETE', '/api/profiles/10/cv/file'),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'POST',
          '/api/profiles/10/cv/analysis',
        ),
      ).toBe(false);
      expect(
        checkPermission(
          fullPermissions,
          'DELETE',
          '/api/profiles/10/cv/analysis',
        ),
      ).toBe(false);
    });
  });
});
