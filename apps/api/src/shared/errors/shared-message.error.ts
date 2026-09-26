import { InternalServerErrorException } from '@nestjs/common';
import { AuthMessage } from '@shared/types';

export const ServerErrorException = new InternalServerErrorException([
  { message: AuthMessage.INTERNAL_ERROR, path: 'unknown' },
]);
