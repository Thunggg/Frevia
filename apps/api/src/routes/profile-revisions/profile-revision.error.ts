import { ConflictException, NotFoundException } from '@nestjs/common';

const details = (message: string, path: string) => [{ message, path }];

export const ProfileRevisionNotFoundException = () =>
  new NotFoundException(details('Profile revision request not found.', 'id'));

export const ProfileRevisionAlreadyReviewedException = () =>
  new ConflictException(
    details('This profile revision has already been reviewed.', 'status'),
  );
