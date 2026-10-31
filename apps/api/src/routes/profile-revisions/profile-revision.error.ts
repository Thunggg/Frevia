import { ConflictException, NotFoundException } from '@nestjs/common';
import { ManageProfileRevisionMessage } from '@shared/types';

const details = (message: string, path: string) => [{ message, path }];

export const ProfileRevisionNotFoundException = () =>
  new NotFoundException(
    details(ManageProfileRevisionMessage.PROFILE_REVISION_NOT_FOUND, 'id'),
  );

export const ProfileRevisionAlreadyReviewedException = () =>
  new ConflictException(
    details(
      ManageProfileRevisionMessage.PROFILE_REVISION_ALREADY_REVIEWED,
      'status',
    ),
  );
