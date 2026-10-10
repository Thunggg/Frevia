import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManagePermissionMessage } from '@shared/types';

export const PermissionNotFoundException = () =>
  new NotFoundException([
    {
      message: ManagePermissionMessage.PERMISSION_NOT_FOUND,
      path: 'id',
    },
  ]);

export const PermissionAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManagePermissionMessage.PERMISSION_ALREADY_EXISTS,
      path: 'name',
    },
  ]);

export const FailedToLoadPermissionsException = () =>
  new InternalServerErrorException([
    {
      message: ManagePermissionMessage.FAILED_TO_LOAD_PERMISSIONS,
      path: 'permissions',
    },
  ]);

export const FailedToLoadPermissionDetailException = () =>
  new InternalServerErrorException([
    {
      message: ManagePermissionMessage.FAILED_TO_LOAD_PERMISSION_DETAIL,
      path: 'id',
    },
  ]);

export const FailedToCreatePermissionException = () =>
  new InternalServerErrorException([
    {
      message: ManagePermissionMessage.FAILED_TO_CREATE_PERMISSION,
      path: 'permissions',
    },
  ]);
