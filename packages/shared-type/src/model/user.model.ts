import { z } from "zod";
import { RoleName } from "../constants/role.constant";
import { TypeOfVerificationCode } from "../constants/token.constant";

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string().nullable(),
  isBanned: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const EmailVerificationSchema = z.object({
  id: z.number(),
  email: z.email(),
  code: z.string().length(6),
  type: z.enum([
    TypeOfVerificationCode.EMAIL_VERIFICATION,
    TypeOfVerificationCode.PASSWORD_RESET,
  ]),
  attempts: z.number().default(0),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    otpCode: z.string().length(6),
    confirmPassword: z.string(),
    role: z.enum([RoleName.FREELANCER, RoleName.CLIENT]),
    fullName: z.string().min(1),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (!password) {
      ctx.addIssue({
        code: "custom",
        message: "Password is required",
        path: ["password"],
      });
    }

    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Password and confirm password do not match",
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

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;

export type SendOTPBodyType = z.infer<typeof SendOTPSchema>;
