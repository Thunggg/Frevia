import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AccessTokenPayload,
  AuthMessage,
  REQUEST_USER_KEY,
} from '@shared/types';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import { SharedPermissionRepository } from '../repositories/shared-permission.repo';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly sharedPermissionRepository: SharedPermissionRepository,
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
    const payload = request[REQUEST_USER_KEY] as AccessTokenPayload | undefined;

    if (!payload?.roleId) {
      throw new ForbiddenException(AuthMessage.MISSING_ROLE_IN_TOKEN);
    }

    const method = request.method;
    const path = request.path; // vd: /api/roles/1

    const allowed = await this.sharedPermissionRepository.roleHasPermission(
      payload.roleId,
      method,
      path,
    );

    if (!allowed) {
      // Method + path chỉ dùng để ghi log phía server: đưa chúng vào message
      // sẽ lộ nội bộ API cho người dùng.
      this.logger.warn(
        `Permission denied: roleId=${payload.roleId}, ${method} ${path}`,
      );
      throw new ForbiddenException(AuthMessage.PERMISSION_DENIED);
    }

    return true;
  }
}
