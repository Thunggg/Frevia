import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageRoleMessage } from '@shared/types';

export const RoleNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageRoleMessage.ROLE_NOT_FOUND,
      path: 'id',
    },
  ]);

export const RoleAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManageRoleMessage.ROLE_ALREADY_EXISTS,
      path: 'name',
    },
  ]);

export const FailedToLoadRolesException = () =>
  new InternalServerErrorException([
    {
      message: ManageRoleMessage.FAILED_TO_LOAD_ROLES,
      path: 'roles',
    },
  ]);

export const FailedToLoadRoleDetailException = () =>
  new InternalServerErrorException([
    {
      message: ManageRoleMessage.FAILED_TO_LOAD_ROLE_DETAIL,
      path: 'id',
    },
  ]);

export const FailedToCreateRoleException = () =>
  new InternalServerErrorException([
    {
      message: ManageRoleMessage.FAILED_TO_CREATE_ROLE,
      path: 'roles',
    },
  ]);
