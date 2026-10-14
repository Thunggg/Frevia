import {
  ConflictException,
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

export const EmailAlreadyExistsException = () =>
  new ConflictException([
    {
      message: 'Error.EmailAlreadyExists',
      path: 'email',
    },
  ]);

export const CreateUserRoleNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.CreateUserRoleNotFound',
      path: 'roleId',
    },
  ]);

export const CannotAssignAdminRoleException = () =>
  new ForbiddenException([
    {
      message: 'Error.CannotAssignAdminRole',
      path: 'roleId',
    },
  ]);

export const FailedToCreateUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToCreateUser',
      path: 'users',
    },
  ]);

export const FailedToUpdateUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateUser',
      path: 'users',
    },
  ]);

export const CannotBanSelfException = () =>
  new ForbiddenException([
    {
      message: 'Error.CannotBanSelf',
      path: 'isBanned',
    },
  ]);

export const NoClientRoleForClientProfileException = () =>
  new ForbiddenException([
    {
      message: 'Error.UserHasNoClientRole',
      path: 'userId',
    },
  ]);

export const FailedToUpdateClientProfileException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateClientProfile',
      path: 'userId',
    },
  ]);
