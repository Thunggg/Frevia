import { HttpException, Injectable } from '@nestjs/common';
import {
  AdminUserDetailResponseType,
  AdminUserListResponseType,
  AdminUserQueryType,
} from '@shared/types';
import { UsersRepository } from './users.repo';
import {
  FailedToGetUserException,
  FailedToGetUsersException,
  UserNotFoundException,
} from './users.error';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

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
}
