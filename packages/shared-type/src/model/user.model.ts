import { z } from "zod";
import { RoleName } from "../constants/role.constant";
import { TypeOfVerificationCode } from "../constants/token.constant";
import { AuthMessage } from "../message/auth.message";

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(AuthMessage.INVALID_EMAIL).trim().toLowerCase().max(254),
  password: z
    .string()
    .min(8, AuthMessage.PASSWORD_TOO_SHORT)
    .max(32, AuthMessage.PASSWORD_TOO_LONG)
    .regex(/[A-Z]/, AuthMessage.PASSWORD_NEED_UPPERCASE)
    .regex(/[0-9]/, AuthMessage.PASSWORD_NEED_NUMBER)
    .nullable(),
  isBanned: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const EmailVerificationSchema = z.object({
  id: z.number(),
  email: z.email(AuthMessage.INVALID_EMAIL).trim().toLowerCase(),
  code: z.string().regex(/^\d{6}$/, AuthMessage.OTP_CODE_INVALID_FORMAT),
  type: z.enum([
    TypeOfVerificationCode.EMAIL_VERIFICATION,
    TypeOfVerificationCode.PASSWORD_RESET,
  ]),
  attempts: z.number().default(0),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const SessionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  refreshToken: z.string(),
  deviceInfo: z.string(),
  ipAddress: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const RegisterBodySchema = z
  .object({
    email: z.email(AuthMessage.INVALID_EMAIL).trim().toLowerCase().max(254),
    password: z
      .string()
      .nonempty(AuthMessage.PASSWORD_IS_REQUIRE)
      .min(8, AuthMessage.PASSWORD_TOO_SHORT)
      .max(32, AuthMessage.PASSWORD_TOO_LONG)
      .regex(/[A-Z]/, AuthMessage.PASSWORD_NEED_UPPERCASE)
      .regex(/[0-9]/, AuthMessage.PASSWORD_NEED_NUMBER),
  })
  .extend({
    code: z.string().regex(/^\d{6}$/, AuthMessage.OTP_CODE_INVALID_FORMAT),
    confirmPassword: z
      .string()
      .nonempty(AuthMessage.CONFIRM_PASSWORD_IS_REQUIRE),
    role: z.enum([RoleName.FREELANCER, RoleName.CLIENT]),
    fullName: z
      .string()
      .trim()
      .min(1, AuthMessage.FULLNAME_REQUIRED)
      .max(100, AuthMessage.FULLNAME_TOO_LONG),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (!password) {
      ctx.addIssue({
        code: "custom",
        message: AuthMessage.PASSWORD_REQUIRED,
        path: ["password"],
      });
    } else if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: AuthMessage.PASSWORD_NOT_MATCH,
        path: ["confirmPassword"],
      });
    }
  });

export const RegisterResSchema = UserSchema.omit({
  password: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const SendOTPSchema = EmailVerificationSchema.pick({
  email: true,
  type: true,
}).strict();

export const LoginBodySchema = z.object({
  email: z.email(AuthMessage.INVALID_EMAIL).trim().toLowerCase().max(254),
  password: z.string().min(1, AuthMessage.PASSWORD_IS_REQUIRE),
});

export const LoginResSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .strict();

export const RefreshTokenBodySchema = SessionSchema.pick({
  refreshToken: true,
}).strict();

export const LogoutBodySchema = SessionSchema.pick({
  refreshToken: true,
}).strict();

export const ForgotPasswordBodySchema = z
  .object({
    email: z.email(AuthMessage.INVALID_EMAIL),
    code: z.string().length(6).min(6, AuthMessage.OTP_CODE_INVALID_FORMAT),
    newPassword: z
      .string()
      .min(8, AuthMessage.PASSWORD_TOO_SHORT)
      .max(32, AuthMessage.PASSWORD_TOO_LONG)
      .regex(/[A-Z]/, AuthMessage.PASSWORD_NEED_UPPERCASE)
      .regex(/[0-9]/, AuthMessage.PASSWORD_NEED_NUMBER),
    confirmNewPassword: z
      .string()
      .min(8, AuthMessage.PASSWORD_TOO_SHORT)
      .max(32, AuthMessage.PASSWORD_TOO_LONG),
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        message: AuthMessage.PASSWORD_NOT_MATCH,
        path: ["confirmNewPassword"],
      });
    }
  });

export const GetAuthorizationUrlResSchema = z.object({
  url: z.url("Error.InvalidUrl"),
});

export const GetMeProfileSchema = z.object({
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const GetMeRoleSchema = z.object({
  name: z.enum([RoleName.FREELANCER, RoleName.CLIENT, RoleName.ADMIN]),
  isPrimary: z.boolean(),
});

export const GetMeResSchema = z.object({
  id: z.number(),
  email: z.email(),
  isBanned: z.boolean(),
  profile: GetMeProfileSchema.nullable(),
  roles: z.array(GetMeRoleSchema),
});

export type UserType = z.infer<typeof UserSchema>;
export type EmailVerificationType = z.infer<typeof EmailVerificationSchema>;

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;

export type SendOTPBodyType = z.infer<typeof SendOTPSchema>;

export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;

export type RefreshTokenBodySchemaType = z.infer<typeof RefreshTokenBodySchema>;

export type LogoutBodySchemaType = z.infer<typeof LogoutBodySchema>;

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;

export type GetAuthorizationUrlResType = z.infer<
  typeof GetAuthorizationUrlResSchema
>;

export type GetMeResType = z.infer<typeof GetMeResSchema>;
