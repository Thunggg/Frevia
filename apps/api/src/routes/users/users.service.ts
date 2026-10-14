import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  AdminCreateUserBodyType,
  AdminCreateUserResponseType,
  AdminUpdateUserBodyType,
  AdminUpdateUserResponseType,
  AdminUserDetailResponseType,
  AdminUserListResponseType,
  AdminUserQueryType,
  RoleName,
} from '@shared/types';
import { HashingService } from '../../shared/services/hashing.service';
import { UsersRepository } from './users.repo';
import {
  CannotAssignAdminRoleException,
  CannotBanSelfException,
  CreateUserRoleNotFoundException,
  EmailAlreadyExistsException,
  FailedToCreateUserException,
  FailedToGetUserException,
  FailedToGetUsersException,
  FailedToUpdateUserException,
  UserNotFoundException,
} from './users.error';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly hashingService: HashingService,
  ) {}

  async createUser(
    body: AdminCreateUserBodyType,
  ): Promise<AdminCreateUserResponseType> {
    try {
      // 1. Email đã tồn tại (chưa soft-delete) → báo trùng
      const existing = await this.repository.findUserByEmail(body.email);
      if (existing) {
        throw EmailAlreadyExistsException();
      }

      // 2. Role khởi tạo phải tồn tại & active; không cho gán role Admin
      const role = await this.repository.findActiveRoleById(body.roleId);
      if (!role) {
        throw CreateUserRoleNotFoundException();
      }
      if (role.name.toLowerCase() === RoleName.ADMIN.toLowerCase()) {
        throw CannotAssignAdminRoleException();
      }

      // 3. Hash password rồi tạo user + profile + userRole (primary)
      const hashedPassword = await this.hashingService.hash(body.password);

      const created = await this.repository.createUserByAdmin({
        email: body.email,
        password: hashedPassword,
        fullName: body.fullName,
        roleId: role.id,
      });

      return {
        id: created.id,
        email: created.email,
        displayName: created.profile?.displayName ?? null,
        roles: created.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          isPrimary: ur.isPrimary,
        })),
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race condition: email bị tạo song song → unique violation
        throw EmailAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateUserException();
    }
  }

  async getUsers(
    query: AdminUserQueryType,
  ): Promise<AdminUserListResponseType> {
    try {
      return await this.repository.getUsers(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToGetUsersException();
    }
  }

  async getUserById(id: number): Promise<AdminUserDetailResponseType> {
    try {
      const user = await this.repository.getUserById(id);
      if (!user) {
        throw UserNotFoundException();
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToGetUserException();
    }
  }

  async updateUser(
    id: number,
    actorId: number,
    body: AdminUpdateUserBodyType,
  ): Promise<AdminUpdateUserResponseType> {
    try {
      // Admin không được tự ban chính tài khoản của mình
      if (body.isBanned === true && id === actorId) {
        throw CannotBanSelfException();
      }

      // Email đổi sang email đã tồn tại của user khác → báo trùng
      if (body.email !== undefined) {
        const existing = await this.repository.findUserByEmail(body.email);
        if (existing && existing.id !== id) {
          throw EmailAlreadyExistsException();
        }
      }

      const updated = await this.repository.updateUserByAdmin(id, {
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.isBanned !== undefined ? { isBanned: body.isBanned } : {}),
      });

      if (!updated) {
        throw UserNotFoundException();
      }

      return {
        id: updated.id,
        email: updated.email,
        displayName: updated.profile?.displayName ?? null,
        isBanned: updated.isBanned,
        roles: updated.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          isPrimary: ur.isPrimary,
        })),
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race condition: email vừa bị user khác chiếm → unique violation
        throw EmailAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateUserException();
    }
  }
}
