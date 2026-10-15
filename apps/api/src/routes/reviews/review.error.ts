import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const details = (message: string, path: string) => [{ message, path }];

export const ReviewContractNotFoundException = () =>
  new NotFoundException(details('Contract not found.', 'contractId'));
export const ReviewNotFoundException = () =>
  new NotFoundException(details('Review not found.', 'reviewId'));
export const ReviewResponseNotFoundException = () =>
  new NotFoundException(details('Review response not found.', 'responseId'));
export const ReviewForbiddenException = () =>
  new ForbiddenException(
    details('You are not allowed to perform this review action.', 'review'),
  );
export const ReviewAlreadyExistsException = () =>
  new ConflictException(
    details('You have already reviewed this contract.', 'contractId'),
  );
export const ReviewResponseAlreadyExistsException = () =>
  new ConflictException(
    details('This review already has a response.', 'reviewId'),
  );
