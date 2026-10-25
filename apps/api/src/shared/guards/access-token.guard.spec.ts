import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY } from '@shared/types';
import { AuthGuard } from './access-token.guard';
import { PrismaService } from '../services/prisma.service';
import { TokenService } from '../services/token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let tokenService: TokenService;
  let prisma: PrismaService;
  let sessionFindFirstMock: jest.Mock;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    tokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as TokenService;

    sessionFindFirstMock = jest.fn();
    prisma = {
      session: {
        findFirst: sessionFindFirstMock,
      },
    } as unknown as PrismaService;

    guard = new AuthGuard(tokenService, prisma, reflector);
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
    sessionFindFirstMock.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessionFindFirstMock).toHaveBeenCalledWith({
      where: { id: 10, userId: 1 },
      select: {
        id: true,
        user: { select: { isBanned: true, deletedAt: true } },
      },
    });
  });

  it('throws ForbiddenException when user is banned (isBanned = true)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockContext('Bearer valid-token');
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({
      userId: 1,
      sessionId: 10,
    });
    sessionFindFirstMock.mockResolvedValue({
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
    sessionFindFirstMock.mockResolvedValue({
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
    sessionFindFirstMock.mockResolvedValue({
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
