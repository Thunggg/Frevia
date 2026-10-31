import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ManageIdentityVerificationMessage } from '@shared/types';

const details = (message: string, path: string) => [{ message, path }];

export const IdentityVerificationNotFoundException = () =>
  new NotFoundException(
    details(
      ManageIdentityVerificationMessage.IDENTITY_VERIFICATION_NOT_FOUND,
      'id',
    ),
  );
export const IdentityVerificationAlreadyReviewedException = () =>
  new ConflictException(
    details(
      ManageIdentityVerificationMessage.IDENTITY_VERIFICATION_ALREADY_REVIEWED,
      'status',
    ),
  );
export const IdentityVerificationFileInvalidException = () =>
  new BadRequestException(
    details(
      ManageIdentityVerificationMessage.IDENTITY_VERIFICATION_FILE_NOT_AVAILABLE,
      'file',
    ),
  );
