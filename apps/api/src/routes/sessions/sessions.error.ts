import { InternalServerErrorException } from '@nestjs/common';
import { ManageSessionMessage } from '@shared/types';

export const FailedToLoadSessionsException = () =>
  new InternalServerErrorException([
    {
      message: ManageSessionMessage.FAILED_TO_LOAD_SESSIONS,
      path: 'sessions',
    },
  ]);
