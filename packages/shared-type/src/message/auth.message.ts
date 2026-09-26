export const AuthMessage = {
  // --- Service ---
  EMAIL_ALREADY_EXISTS: "Error.EmailAlreadyExists",
  EMAIL_NOT_FOUND: "Error.EmailNotFound",
  USER_BANNED: "Error.UserBanned",
  INVALID_VERIFICATION_CODE: "Error.InvalidVerificationCode",
  OTP_EXPIRED: "Error.OTPExpired",
  TOO_MANY_ATTEMPTS: "Error.TooManyAttempts",
  INCORRECT_PASSWORD: "Error.IncorrectPassword",
  FAILED_TO_SEND_OTP: "Error.FailedToSendOTP",
  REFRESH_TOKEN_REVOKED: "Error.RefreshTokenRevoked",
  EMAIL_REQUIRED: "Error.EmailRequired",
  ROLE_NOT_FOUND: "Error.RoleNotFound",

  // --- Validation messages (dùng trong Zod schema) ---
  PASSWORD_REQUIRED: "Error.PasswordRequired",
  PASSWORD_TOO_SHORT: "Error.PasswordTooShort",
  PASSWORD_TOO_LONG: "Error.PasswordTooLong",
  PASSWORD_NOT_MATCH: "Error.PasswordNotMatch",
  FULLNAME_REQUIRED: "Error.FullNameRequired",
  OTP_CODE_INVALID_LENGTH: "Error.OTPCodeInvalidLength",

  // Error internal
  INTERNAL_ERROR: "Error.Internal",
} as const;
