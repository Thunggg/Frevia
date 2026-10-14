import { HttpException, Injectable } from '@nestjs/common';
import {
  AdminUserListResponseType,
  AdminUserQueryType,
  RoleName,
} from '@shared/types';
import { UsersRepository } from './users.repo';
import {
  FailedToGetUsersException,
  UserForbiddenException,
} from './users.error';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getUsers(
    roleName: string,
    query: AdminUserQueryType,
  ): Promise<AdminUserListResponseType> {
    if (roleName !== RoleName.ADMIN) {
      throw UserForbiddenException();
    }
    try {
      return await this.repository.getUsers(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToGetUsersException();
    }
  }
}
