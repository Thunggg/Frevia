export const AuthMessage = {
  // --- Service ---
  EMAIL_ALREADY_EXISTS: "Error.EmailAlreadyExists",
  EMAIL_NOT_FOUND: "Error.EmailNotFound",
  PASSWORD_IS_REQUIRE: "Error.PasswordIsRequire",
  CONFIRM_PASSWORD_IS_REQUIRE: "Error.PasswordIsRequire",
  INVALID_EMAIL: "Error.InvalidEmail",
  USER_BANNED: "Error.UserBanned",
  INVALID_VERIFICATION_CODE: "Error.InvalidVerificationCode",
  OTP_EXPIRED: "Error.OTPExpired",
  TOO_MANY_ATTEMPTS: "Error.TooManyAttempts",
  FAILED_TO_SEND_OTP: "Error.FailedToSendOTP",
  REFRESH_TOKEN_REVOKED: "Error.RefreshTokenRevoked",
  EMAIL_REQUIRED: "Error.EmailRequired",
  ROLE_NOT_FOUND: "Error.RoleNotFound",
  INCORRECT_EMAIL: "Error.IncorrectEmail",
  INCORRECT_PASSWORD: "Error.IncorrectPassword",

  // --- Validation messages (dùng trong Zod schema) ---
  PASSWORD_REQUIRED: "Error.PasswordRequired",
  PASSWORD_TOO_SHORT: "Error.PasswordTooShort",
  PASSWORD_TOO_LONG: "Error.PasswordTooLong",
  PASSWORD_NOT_MATCH: "Error.PasswordNotMatch",
  PASSWORD_NEED_UPPERCASE: "Error.PasswordNeedUppercase",
  PASSWORD_NEED_NUMBER: "Error.PasswordNeedNumber",
  FULLNAME_REQUIRED: "Error.FullNameRequired",
  FULLNAME_TOO_LONG: "Error.FullNameTooLong",
  OTP_CODE_INVALID_LENGTH: "Error.OTPCodeInvalidLength",
  OTP_CODE_INVALID_FORMAT: "Error.OTPCodeInvalidFormat",

  // Error internal
  INTERNAL_ERROR: "Error.Internal",
} as const;
