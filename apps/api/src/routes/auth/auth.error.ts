import { HttpStatus } from '@nestjs/common';
import { AuthMessage, ErrorCode } from '@shared/types';
import { AppException } from '../../shared/exceptions/app.exception';

// =============================================================================
// Auth errors
// =============================================================================

export const EmailAlreadyExistsException = new AppException(
  ErrorCode.EMAIL_ALREADY_EXISTS as string,
  AuthMessage.EMAIL_ALREADY_EXISTS as string,
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const EmailNotFoundException = new AppException(
  ErrorCode.EMAIL_NOT_FOUND as string,
  AuthMessage.EMAIL_NOT_FOUND as string,
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const UserBannedException = new AppException(
  ErrorCode.USER_BANNED as string,
  AuthMessage.USER_BANNED as string,
  HttpStatus.FORBIDDEN,
);

export const InvalidVerificationCodeException = new AppException(
  ErrorCode.INVALID_OTP as string,
  AuthMessage.INVALID_VERIFICATION_CODE as string,
  HttpStatus.NOT_FOUND,
);

export const OTPExpiredException = new AppException(
  ErrorCode.OTP_EXPIRED as string,
  AuthMessage.OTP_EXPIRED as string,
  HttpStatus.NOT_FOUND,
);

export const TooManyAttemptsException = new AppException(
  ErrorCode.TOO_MANY_ATTEMPTS as string,
  AuthMessage.TOO_MANY_ATTEMPTS as string,
  HttpStatus.TOO_MANY_REQUESTS,
);

export const IncorrectPasswordException = new AppException(
  ErrorCode.INCORRECT_PASSWORD as string,
  AuthMessage.INCORRECT_PASSWORD as string,
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const FailedToSendOTPException = new AppException(
  ErrorCode.FAILED_TO_SEND_OTP as string,
  AuthMessage.FAILED_TO_SEND_OTP as string,
  HttpStatus.UNPROCESSABLE_ENTITY,
);

export const RefreshTokenRevokedException = new AppException(
  ErrorCode.REFRESH_TOKEN_REVOKED as string,
  AuthMessage.REFRESH_TOKEN_REVOKED as string,
  HttpStatus.UNAUTHORIZED,
);

export const EmailRequiredException = new AppException(
  ErrorCode.EMAIL_REQUIRED as string,
  AuthMessage.EMAIL_REQUIRED as string,
  HttpStatus.BAD_REQUEST,
);

export const RoleNotFoundException = new AppException(
  ErrorCode.ROLE_NOT_FOUND as string,
  AuthMessage.ROLE_NOT_FOUND as string,
  HttpStatus.NOT_FOUND,
);
