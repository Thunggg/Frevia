import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageSessionMessage } from '@shared/types';

export const SessionNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageSessionMessage.SESSION_NOT_FOUND,
      path: 'id',
    },
  ]);

export const SessionAlreadyExpiredException = () =>
  new BadRequestException([
    {
      message: ManageSessionMessage.SESSION_ALREADY_EXPIRED,
      path: 'id',
    },
  ]);

export const FailedToLoadSessionsException = () =>
  new InternalServerErrorException([
    {
      message: ManageSessionMessage.FAILED_TO_LOAD_SESSIONS,
      path: 'sessions',
    },
  ]);

export const FailedToLoadSessionDetailException = () =>
  new InternalServerErrorException([
    {
      message: ManageSessionMessage.FAILED_TO_LOAD_SESSION_DETAIL,
      path: 'id',
    },
  ]);

export const FailedToRevokeSessionException = () =>
  new InternalServerErrorException([
    {
      message: ManageSessionMessage.FAILED_TO_REVOKE_SESSION,
      path: 'id',
    },
  ]);
