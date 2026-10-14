import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export const UserForbiddenException = () =>
  new ForbiddenException([
    {
      message: 'Error.UserForbidden',
      path: 'roleName',
    },
  ]);

export const FailedToGetUsersException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToGetUsers',
      path: 'users',
    },
  ]);

export const UserNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.UserNotFound',
      path: 'userId',
    },
  ]);

export const FailedToGetUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToGetUser',
      path: 'userId',
    },
  ]);
