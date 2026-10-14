import {
  ForbiddenException,
  InternalServerErrorException,
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
