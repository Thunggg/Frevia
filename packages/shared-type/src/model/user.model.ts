import { z } from "zod";
import { RoleName } from "../constants/role.constant";
import { TypeOfVerificationCode } from "../constants/token.constant";
import { AuthMessage } from "../message/auth.message";

export const UserSchema = z.object({
  id: z.number(),
  email: z.email().trim().toLowerCase().max(254),
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
  email: z.email().trim().toLowerCase(),
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

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    otpCode: z.string().regex(/^\d{6}$/, AuthMessage.OTP_CODE_INVALID_FORMAT),
    confirmPassword: z.string(),
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
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, AuthMessage.PASSWORD_REQUIRED),
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

export type UserType = z.infer<typeof UserSchema>;
export type EmailVerificationType = z.infer<typeof EmailVerificationSchema>;

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;

export type SendOTPBodyType = z.infer<typeof SendOTPSchema>;

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export type RefreshTokenBodySchemaType = z.infer<typeof RefreshTokenBodySchema>;

export type LogoutBodySchemaType = z.infer<typeof LogoutBodySchema>;
