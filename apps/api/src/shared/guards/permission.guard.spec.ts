import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY, RoleName } from '@shared/types';
import { SharedPermissionRepository } from '../repositories/shared-permission.repo';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let sharedPermissionRepository: SharedPermissionRepository;
  let roleHasPermissionMock: jest.Mock;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    roleHasPermissionMock = jest.fn();
    sharedPermissionRepository = {
      roleHasPermission: roleHasPermissionMock,
    } as unknown as SharedPermissionRepository;

    guard = new PermissionGuard(reflector, sharedPermissionRepository);
  });

  const createMockContext = (
    method: string,
    path: string,
    payload?: Record<string, unknown>,
  ): ExecutionContext => {
    const request: Record<string, unknown> = {
      method,
      path,
    };
    if (payload) {
      request[REQUEST_USER_KEY] = payload;
    }

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  it('allows public endpoints without querying repository', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = createMockContext('GET', '/api/jobs');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when roleId is missing in payload', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('GET', '/api/roles', { userId: 1 });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('allows CLIENT on hardcoded client marketplace endpoints and blocks admin endpoints', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    const clientJobCtx = createMockContext('POST', '/api/manage-jobs', {
      userId: 2,
      roleId: 2,
      roleName: RoleName.CLIENT,
    });
    await expect(guard.canActivate(clientJobCtx)).resolves.toBe(true);

    const clientAdminCtx = createMockContext('GET', '/api/admin/skills', {
      userId: 2,
      roleId: 2,
      roleName: RoleName.CLIENT,
    });
    await expect(guard.canActivate(clientAdminCtx)).rejects.toThrow(
      ForbiddenException,
    );

    const clientKycCtx = createMockContext(
      'GET',
      '/api/identity-verifications',
      {
        userId: 2,
        roleId: 2,
        roleName: RoleName.CLIENT,
      },
    );
    await expect(guard.canActivate(clientKycCtx)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('allows FREELANCER on hardcoded freelancer endpoints and blocks client-only & admin endpoints', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    const bookmarkCtx = createMockContext(
      'POST',
      '/api/manage-jobs/1/bookmark',
      {
        userId: 3,
        roleId: 3,
        roleName: RoleName.FREELANCER,
      },
    );
    await expect(guard.canActivate(bookmarkCtx)).resolves.toBe(true);

    const favCtx = createMockContext('GET', '/api/favorites/freelancers', {
      userId: 3,
      roleId: 3,
      roleName: RoleName.FREELANCER,
    });
    await expect(guard.canActivate(favCtx)).rejects.toThrow(ForbiddenException);
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('allows self-service account-profile and sessions for admin and custom roles without DB query', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    const accountCtx = createMockContext(
      'PUT',
      '/api/account-profile/password',
      {
        userId: 5,
        roleId: 10,
        roleName: 'Moderator',
      },
    );
    await expect(guard.canActivate(accountCtx)).resolves.toBe(true);

    const sessionsCtx = createMockContext('GET', '/api/sessions', {
      userId: 5,
      roleId: 10,
      roleName: 'Moderator',
    });
    await expect(guard.canActivate(sessionsCtx)).resolves.toBe(true);
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('allows ADMIN full Admin Portal access while denying non-admin marketplace endpoints', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    const adminCtx = createMockContext('GET', '/api/users', {
      userId: 1,
      roleId: 1,
      roleName: RoleName.ADMIN,
    });
    await expect(guard.canActivate(adminCtx)).resolves.toBe(true);

    const nonAdminCtx = createMockContext('POST', '/api/proposals', {
      userId: 1,
      roleId: 1,
      roleName: RoleName.ADMIN,
    });
    await expect(guard.canActivate(nonAdminCtx)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('checks database permissions dynamically for EXPERT and custom roles on Admin Portal routes', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    roleHasPermissionMock.mockResolvedValue(true);
    const context = createMockContext('GET', '/api/expert/disputes/12', {
      userId: 5,
      roleId: 4,
      roleName: RoleName.EXPERT,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(roleHasPermissionMock).toHaveBeenCalledWith(
      4,
      'GET',
      '/api/expert/disputes/12',
    );
  });

  it('blocks EXPERT and custom roles from calling non-admin marketplace APIs without querying RBAC table', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('GET', '/api/payments', {
      userId: 5,
      roleId: 4,
      roleName: RoleName.EXPERT,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when repository denies Admin route permission for custom role', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    roleHasPermissionMock.mockResolvedValue(false);
    const context = createMockContext('POST', '/api/users', {
      userId: 6,
      roleId: 12,
      roleName: 'Support',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).toHaveBeenCalledWith(
      12,
      'POST',
      '/api/users',
    );
  });

  it('allows CLIENT and FREELANCER on join-role/switch-role while blocking ADMIN, EXPERT, and custom roles', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    for (const path of ['/api/auth/join-role', '/api/auth/switch-role']) {
      await expect(
        guard.canActivate(
          createMockContext('POST', path, {
            userId: 2,
            roleId: 2,
            roleName: RoleName.CLIENT,
          }),
        ),
      ).resolves.toBe(true);

      await expect(
        guard.canActivate(
          createMockContext('POST', path, {
            userId: 3,
            roleId: 3,
            roleName: RoleName.FREELANCER,
          }),
        ),
      ).resolves.toBe(true);

      await expect(
        guard.canActivate(
          createMockContext('POST', path, {
            userId: 1,
            roleId: 1,
            roleName: RoleName.ADMIN,
          }),
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        guard.canActivate(
          createMockContext('POST', path, {
            userId: 4,
            roleId: 4,
            roleName: RoleName.EXPERT,
          }),
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        guard.canActivate(
          createMockContext('POST', path, {
            userId: 5,
            roleId: 12,
            roleName: 'Support',
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    }

    expect(roleHasPermissionMock).not.toHaveBeenCalled();
  });
});
