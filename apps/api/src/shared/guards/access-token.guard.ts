import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY } from '@shared/types';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import { PrismaService } from '../services/prisma.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      // Token cũ (chưa có sessionId) → bắt login lại
      if (!payload.sessionId) {
        throw new UnauthorizedException();
      }

      // Kiểm tra session còn hiệu lực (session đã revoke/xóa → 401)
      const sessionWithUser = await this.prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.userId,
        },
        select: {
          id: true,
          user: {
            select: {
              isBanned: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!sessionWithUser) {
        throw new UnauthorizedException();
      }

      // BR-06: user bị ban hoặc đã xóa → 403 Forbidden (phân biệt với 401 Unauthorized)
      if (sessionWithUser.user.isBanned || sessionWithUser.user.deletedAt) {
        throw new ForbiddenException();
      }

      request[REQUEST_USER_KEY] = payload;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
