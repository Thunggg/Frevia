import { InternalServerErrorException } from '@nestjs/common';

export const FailedToLoadRolesException = () => {
  return new InternalServerErrorException([
    {
      message: 'Error.FailedToLoadRoles',
      path: 'roles',
    },
  ]);
};
