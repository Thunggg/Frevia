import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewMessage } from '@shared/types';

const details = (message: string, path: string) => [{ message, path }];

export const ReviewContractNotFoundException = () =>
  new NotFoundException(details(ReviewMessage.CONTRACT_NOT_FOUND, 'contractId'));
export const ReviewContractNotCompletedException = () =>
  new BadRequestException(
    details(ReviewMessage.CONTRACT_NOT_COMPLETED, 'contractId'),
  );
export const ReviewNotFoundException = () =>
  new NotFoundException(details(ReviewMessage.NOT_FOUND, 'reviewId'));
export const ReviewResponseNotFoundException = () =>
  new NotFoundException(details(ReviewMessage.RESPONSE_NOT_FOUND, 'responseId'));
export const ReviewForbiddenException = () =>
  new ForbiddenException(details(ReviewMessage.FORBIDDEN, 'review'));
export const ReviewAlreadyExistsException = () =>
  new ConflictException(details(ReviewMessage.ALREADY_EXISTS, 'contractId'));
export const ReviewResponseAlreadyExistsException = () =>
  new ConflictException(
    details(ReviewMessage.RESPONSE_ALREADY_EXISTS, 'reviewId'),
  );
