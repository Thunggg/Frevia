import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenPayload, REQUEST_USER_KEY } from '@shared/types';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import { SharedPermissionRepository } from '../repositories/shared-permission.repo';

@Injectable()
export class PermissionGuard implements CanActivate {
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
      throw new ForbiddenException('Missing role in access token');
    }

    const method = request.method;
    const path = request.path; // vd: /api/roles/1

    const allowed = await this.sharedPermissionRepository.roleHasPermission(
      payload.roleId,
      method,
      path,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `You do not have permission to ${method} ${path}`,
      );
    }

    return true;
  }
}
