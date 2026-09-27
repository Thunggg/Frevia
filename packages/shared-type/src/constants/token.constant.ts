export const TypeOfVerificationCode = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type TypeOfVerificationCode =
  (typeof TypeOfVerificationCode)[keyof typeof TypeOfVerificationCode];
