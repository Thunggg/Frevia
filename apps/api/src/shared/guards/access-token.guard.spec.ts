import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY } from '@shared/types';
import { AuthGuard } from './access-token.guard';
import { SharedSessionRepository } from '../repositories/shared-session.repo';
import { TokenService } from '../services/token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let tokenService: TokenService;
  let sharedSessionRepository: SharedSessionRepository;
  let findSessionMock: jest.Mock;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    tokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as TokenService;

    findSessionMock = jest.fn();
    sharedSessionRepository = {
      findByIdAndUserIdWithUser: findSessionMock,
    } as unknown as SharedSessionRepository;

    guard = new AuthGuard(tokenService, sharedSessionRepository, reflector);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    } as Record<string, unknown>;

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  it('allows public endpoints without checking token', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('attaches user payload on public endpoints when valid bearer token and active session exist', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = createMockContext('Bearer valid-token');
    const payload = { userId: 1, sessionId: 10, roleId: 2, roleName: 'CLIENT' };
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue(payload);
    findSessionMock.mockResolvedValue({
      id: 10,
      user: { isBanned: false, deletedAt: null },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(findSessionMock).toHaveBeenCalledWith(10, 1);
    const request = context.switchToHttp().getRequest() as Record<
      string,
      unknown
    >;
    expect(request[REQUEST_USER_KEY]).toEqual(payload);
  });

  it('throws UnauthorizedException when authorization header is missing', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when payload does not contain sessionId', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({
      userId: 1,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when session is not found or revoked', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({
      userId: 1,
      sessionId: 10,
    });
    findSessionMock.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findSessionMock).toHaveBeenCalledWith(10, 1);
  });

  it('throws ForbiddenException when user is banned (isBanned = true)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({
      userId: 1,
      sessionId: 10,
    });
    findSessionMock.mockResolvedValue({
      id: 10,
      user: { isBanned: true, deletedAt: null },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when user is soft-deleted', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({
      userId: 1,
      sessionId: 10,
    });
    findSessionMock.mockResolvedValue({
      id: 10,
      user: { isBanned: false, deletedAt: new Date() },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access and attaches user payload when token and session are active and user is not banned', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    const payload = { userId: 1, sessionId: 10, roleId: 2, roleName: 'CLIENT' };
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue(payload);
    findSessionMock.mockResolvedValue({
      id: 10,
      user: { isBanned: false, deletedAt: null },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const request = context.switchToHttp().getRequest() as Record<
      string,
      unknown
    >;
    expect(request[REQUEST_USER_KEY]).toEqual(payload);
  });
});
