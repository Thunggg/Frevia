import {
  matchRoutePath,
  normalizeApiPath,
} from '../../shared/helper/match-route-path';

/**
 * Bộ kiểm thử Action-Level RBAC cho nhóm chức năng:
 * PROPOSALS & BIDS (Đề xuất & Báo giá - Khách hàng / Freelancer) - 15 quyền:
 *
 * #332 · GET /api/proposals/my (Xem toàn bộ đề xuất của tôi)
 * #333 · GET /api/proposals/jobs/:jobId/mine (Xem đề xuất của tôi cho công việc)
 * #334 · GET /api/proposals/jobs/:jobId/submitted (Xem danh sách đề xuất đã nộp cho công việc)
 * #335 · GET /api/proposals/:id (Xem chi tiết đề xuất)
 * #336 · GET /api/proposals/:id/client (Xem thông tin khách hàng cho đề xuất)
 * #337 · POST /api/proposals/jobs/:jobId (Nộp đề xuất cho công việc)
 * #338 · POST /api/proposals/jobs/:jobId/drafts (Lưu nháp đề xuất cho công việc)
 * #339 · PATCH /api/proposals/:id/draft (Cập nhật bản nháp đề xuất)
 * #340 · PATCH /api/proposals/:id/submit (Nộp chính thức bản nháp đề xuất)
 * #341 · PATCH /api/proposals/:id/withdraw (Rút lại đề xuất)
 * #342 · PATCH /api/proposals/:id/reject (Từ chối đề xuất)
 * #343 · PATCH /api/proposals/:id/accept (Chấp nhận đề xuất)
 * #344 · GET /api/jobs/:jobId/proposals (Xem danh sách ứng viên nộp cho công việc)
 * #539 · PATCH /api/proposals/:id/interview (Mời phỏng vấn đề xuất)
 * #578 · PATCH /api/proposals/:id (Cập nhật đề xuất)
 */

interface PermissionItem {
  id: number;
  method: string;
  path: string;
  description: string;
  testActualPath: string;
}

const PROPOSAL_PERMISSIONS: PermissionItem[] = [
  {
    id: 332,
    method: 'GET',
    path: '/api/proposals/my',
    description: 'Xem toàn bộ đề xuất của tôi',
    testActualPath: '/api/proposals/my',
  },
  {
    id: 333,
    method: 'GET',
    path: '/api/proposals/jobs/:jobId/mine',
    description: 'Xem đề xuất của tôi cho công việc',
    testActualPath: '/api/proposals/jobs/42/mine',
  },
  {
    id: 334,
    method: 'GET',
    path: '/api/proposals/jobs/:jobId/submitted',
    description: 'Xem danh sách đề xuất đã nộp cho công việc',
    testActualPath: '/api/proposals/jobs/42/submitted',
  },
  {
    id: 335,
    method: 'GET',
    path: '/api/proposals/:id',
    description: 'Xem chi tiết đề xuất',
    testActualPath: '/api/proposals/101',
  },
  {
    id: 336,
    method: 'GET',
    path: '/api/proposals/:id/client',
    description: 'Xem thông tin khách hàng cho đề xuất',
    testActualPath: '/api/proposals/101/client',
  },
  {
    id: 337,
    method: 'POST',
    path: '/api/proposals/jobs/:jobId',
    description: 'Nộp đề xuất cho công việc',
    testActualPath: '/api/proposals/jobs/42',
  },
  {
    id: 338,
    method: 'POST',
    path: '/api/proposals/jobs/:jobId/drafts',
    description: 'Lưu nháp đề xuất cho công việc',
    testActualPath: '/api/proposals/jobs/42/drafts',
  },
  {
    id: 339,
    method: 'PATCH',
    path: '/api/proposals/:id/draft',
    description: 'Cập nhật bản nháp đề xuất',
    testActualPath: '/api/proposals/101/draft',
  },
  {
    id: 340,
    method: 'PATCH',
    path: '/api/proposals/:id/submit',
    description: 'Nộp chính thức bản nháp đề xuất',
    testActualPath: '/api/proposals/101/submit',
  },
  {
    id: 341,
    method: 'PATCH',
    path: '/api/proposals/:id/withdraw',
    description: 'Rút lại đề xuất',
    testActualPath: '/api/proposals/101/withdraw',
  },
  {
    id: 342,
    method: 'PATCH',
    path: '/api/proposals/:id/reject',
    description: 'Từ chối đề xuất',
    testActualPath: '/api/proposals/101/reject',
  },
  {
    id: 343,
    method: 'PATCH',
    path: '/api/proposals/:id/accept',
    description: 'Chấp nhận đề xuất',
    testActualPath: '/api/proposals/101/accept',
  },
  {
    id: 344,
    method: 'GET',
    path: '/api/jobs/:jobId/proposals',
    description: 'Xem danh sách ứng viên nộp cho công việc',
    testActualPath: '/api/jobs/42/proposals',
  },
  {
    id: 539,
    method: 'PATCH',
    path: '/api/proposals/:id/interview',
    description: 'Mời phỏng vấn đề xuất',
    testActualPath: '/api/proposals/101/interview',
  },
  {
    id: 578,
    method: 'PATCH',
    path: '/api/proposals/:id',
    description: 'Cập nhật đề xuất',
    testActualPath: '/api/proposals/101',
  },
];

/**
 * Giả lập hàm kiểm tra quyền RBAC dựa trên danh sách quyền người dùng được cấp.
 */
function checkUserPermission(
  grantedPermissions: Array<{ method: string; path: string }>,
  targetMethod: string,
  targetActualPath: string,
): boolean {
  const normTargetMethod = targetMethod.toUpperCase();
  return grantedPermissions.some((perm) => {
    if (perm.path === '*') return true;
    if (perm.method.toUpperCase() !== normTargetMethod) return false;
    return matchRoutePath(perm.path, targetActualPath);
  });
}

describe('Proposal RBAC Permissions Verification (15 permissions)', () => {
  it('should have exactly 15 permissions in PROPOSALS & BIDS group', () => {
    expect(PROPOSAL_PERMISSIONS.length).toBe(15);
  });

  describe('Route Path Matching', () => {
    PROPOSAL_PERMISSIONS.forEach((perm) => {
      it(`should correctly match pattern "${perm.path}" with actual path "${perm.testActualPath}" (#${perm.id})`, () => {
        expect(matchRoutePath(perm.path, perm.testActualPath)).toBe(true);
      });
    });

    it('should normalize paths with query strings or leading slashes', () => {
      expect(
        normalizeApiPath('/proposals/jobs/1/submitted?page=1&limit=10'),
      ).toBe('/api/proposals/jobs/1/submitted');
      expect(normalizeApiPath('jobs/10/proposals')).toBe(
        '/api/jobs/10/proposals',
      );
    });
  });

  describe('RBAC Access Control Scenarios', () => {
    it('Scenario 1: Allows ALL 15 actions when user is granted all 15 permissions', () => {
      const fullPermissions = PROPOSAL_PERMISSIONS.map((p) => ({
        method: p.method,
        path: p.path,
      }));

      PROPOSAL_PERMISSIONS.forEach((perm) => {
        const allowed = checkUserPermission(
          fullPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(allowed).toBe(true);
      });
    });

    it('Scenario 2: Denies ALL 15 actions when user has 0 permissions (0/15)', () => {
      const emptyPermissions: Array<{ method: string; path: string }> = [];

      PROPOSAL_PERMISSIONS.forEach((perm) => {
        const allowed = checkUserPermission(
          emptyPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(allowed).toBe(false);
      });
    });

    it('Scenario 3: Allows all actions when user has wildcard "*" permission', () => {
      const adminPermissions = [{ method: '*', path: '*' }];

      PROPOSAL_PERMISSIONS.forEach((perm) => {
        const allowed = checkUserPermission(
          adminPermissions,
          perm.method,
          perm.testActualPath,
        );
        expect(allowed).toBe(true);
      });
    });

    describe('Scenario 4: Denies ONLY the specific revoked permission (15 isolated test cases)', () => {
      PROPOSAL_PERMISSIONS.forEach((revokedPerm) => {
        it(`when permission #${revokedPerm.id} (${revokedPerm.method} ${revokedPerm.path}) is revoked, it is denied and remaining 14 are allowed`, () => {
          // Cấp 14 quyền, loại trừ revokedPerm
          const partialPermissions = PROPOSAL_PERMISSIONS.filter(
            (p) => p.id !== revokedPerm.id,
          ).map((p) => ({ method: p.method, path: p.path }));

          // 1. Quyền bị tước phải bị CHẶN (false)
          const isRevokedAllowed = checkUserPermission(
            partialPermissions,
            revokedPerm.method,
            revokedPerm.testActualPath,
          );
          expect(isRevokedAllowed).toBe(false);

          // 2. Các quyền còn lại phải ĐƯỢC PHÉP (true)
          PROPOSAL_PERMISSIONS.filter((p) => p.id !== revokedPerm.id).forEach(
            (otherPerm) => {
              const isOtherAllowed = checkUserPermission(
                partialPermissions,
                otherPerm.method,
                otherPerm.testActualPath,
              );
              expect(isOtherAllowed).toBe(true);
            },
          );
        });
      });
    });

    describe('Scenario 5: Method mismatch rejection', () => {
      PROPOSAL_PERMISSIONS.forEach((perm) => {
        it(`rejects wrong HTTP method for #${perm.id} (e.g. DELETE against ${perm.method} ${perm.path})`, () => {
          const grantedPermissions = [{ method: perm.method, path: perm.path }];
          const wrongMethod = perm.method === 'DELETE' ? 'GET' : 'DELETE';

          const allowed = checkUserPermission(
            grantedPermissions,
            wrongMethod,
            perm.testActualPath,
          );
          expect(allowed).toBe(false);
        });
      });
    });

    describe('Scenario 6: Dynamic Parameter resolution', () => {
      it('matches dynamic parameters :jobId and :id across varied values', () => {
        expect(
          matchRoutePath(
            '/api/proposals/jobs/:jobId/mine',
            '/api/proposals/jobs/9999/mine',
          ),
        ).toBe(true);
        expect(
          matchRoutePath(
            '/api/jobs/:jobId/proposals',
            '/api/jobs/8888/proposals',
          ),
        ).toBe(true);
        expect(
          matchRoutePath(
            '/api/proposals/:id/interview',
            '/api/proposals/7777/interview',
          ),
        ).toBe(true);
        expect(
          matchRoutePath(
            '/api/proposals/:id/reject',
            '/api/proposals/1234/reject',
          ),
        ).toBe(true);
      });

      it('does not match paths with different segment lengths', () => {
        expect(
          matchRoutePath(
            '/api/proposals/:id',
            '/api/proposals/123/extra/segment',
          ),
        ).toBe(false);
        expect(
          matchRoutePath('/api/proposals/my', '/api/proposals/my/extra'),
        ).toBe(false);
      });
    });
  });
});
