import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export const RoleNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.RoleNotFound',
      path: 'id',
    },
  ]);

export const FailedToLoadRolesException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToLoadRoles',
      path: 'roles',
    },
  ]);

export const FailedToLoadRoleDetailException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToLoadRoleDetail',
      path: 'id',
    },
  ]);
