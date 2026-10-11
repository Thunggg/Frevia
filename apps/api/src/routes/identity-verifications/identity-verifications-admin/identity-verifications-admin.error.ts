import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

const details = (message: string, path: string) => [{ message, path }];

export const IdentityVerificationNotFoundException = () =>
  new NotFoundException(
    details('Identity verification request not found.', 'id'),
  );
export const IdentityVerificationAlreadyReviewedException = () =>
  new ConflictException(
    details('This request has already been reviewed.', 'status'),
  );
export const IdentityVerificationFileInvalidException = () =>
  new BadRequestException(
    details('Identity document file is not available.', 'file'),
  );
