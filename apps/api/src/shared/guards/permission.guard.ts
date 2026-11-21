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
  RoleName,
} from '@shared/types';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorator';
import {
  isAdminPermissionPath,
  isHardcodedMarketplaceAllowed,
  isSelfAccountOrSessionPath,
} from '../helper/admin-permission';
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
    const roleName = payload.roleName;

    // 1. Role marketplace (Client / Freelancer) sử dụng quy tắc hardcode cố định.
    if (roleName === RoleName.CLIENT || roleName === RoleName.FREELANCER) {
      if (!isHardcodedMarketplaceAllowed(roleName, method, path)) {
        this.logger.warn(
          `Marketplace role denied: role=${roleName}, ${method} ${path}`,
        );
        throw new ForbiddenException(AuthMessage.PERMISSION_DENIED);
      }
      return true;
    }

    // 2. Role quản trị (Admin, Expert, custom role): tự quản lý tài khoản & session của mình.
    if (isSelfAccountOrSessionPath(path)) {
      return true;
    }

    // 3. Chặn Admin/Custom role gọi các API nghiệp vụ riêng của Client/Freelancer/Homepage.
    if (!isAdminPermissionPath(path, method)) {
      this.logger.warn(
        `Non-admin endpoint denied for admin/custom role: roleId=${payload.roleId}, ${method} ${path}`,
      );
      throw new ForbiddenException(AuthMessage.PERMISSION_DENIED);
    }

    // 4. Role ADMIN gốc giữ toàn quyền trong Admin Portal.
    if (roleName === RoleName.ADMIN) {
      return true;
    }

    // 5. Kiểm tra quyền Admin động trong DB cho EXPERT và các custom role.
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
