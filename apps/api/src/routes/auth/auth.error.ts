import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthMessage } from '@shared/types';

export const EmailAlreadyExistsException = new UnprocessableEntityException([
  { message: AuthMessage.EMAIL_ALREADY_EXISTS, path: 'email' },
]);

export const EmailNotFoundException = new UnprocessableEntityException([
  { message: AuthMessage.EMAIL_NOT_FOUND, path: 'email' },
]);

export const UserBannedException = new ForbiddenException([
  { message: AuthMessage.USER_BANNED, path: 'email' },
]);

export const InvalidVerificationCodeException =
  new UnprocessableEntityException([
    { message: AuthMessage.INVALID_VERIFICATION_CODE, path: 'code' },
  ]);

export const OTPExpiredException = new UnprocessableEntityException([
  { message: AuthMessage.OTP_EXPIRED, path: 'code' },
]);

export const TooManyAttemptsException = new UnprocessableEntityException([
  { message: AuthMessage.TOO_MANY_ATTEMPTS, path: 'code' },
]);

export const IncorrectPasswordException = new UnprocessableEntityException([
  { message: AuthMessage.INCORRECT_PASSWORD, path: 'password' },
]);

export const FailedToSendOTPException = new UnprocessableEntityException([
  { message: AuthMessage.FAILED_TO_SEND_OTP, path: 'email' },
]);

export const RefreshTokenRevokedException = new UnauthorizedException([
  { message: AuthMessage.REFRESH_TOKEN_REVOKED, path: 'token' },
]);

export const EmailRequiredException = new BadRequestException([
  { message: AuthMessage.EMAIL_REQUIRED, path: 'email' },
]);

export const RoleNotFoundException = new NotFoundException([
  { message: AuthMessage.ROLE_NOT_FOUND, path: 'role' },
]);

export const UniqueViolationException = new ConflictException([
  { message: AuthMessage.EMAIL_ALREADY_EXISTS, path: 'email' },
]);

export const IncorrectCredentialsException = new UnauthorizedException([
  { message: AuthMessage.INCORRECT_CREDENTIALS, path: 'email' },
]);
