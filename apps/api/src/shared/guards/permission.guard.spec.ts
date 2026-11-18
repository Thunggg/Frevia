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

  it('checks database permissions dynamically for all roles including EXPERT', async () => {
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

  it('throws ForbiddenException when repository denies route permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    roleHasPermissionMock.mockResolvedValue(false);
    const context = createMockContext('GET', '/api/payments', {
      userId: 5,
      roleId: 4,
      roleName: RoleName.EXPERT,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(roleHasPermissionMock).toHaveBeenCalledWith(
      4,
      'GET',
      '/api/payments',
    );
  });
});
