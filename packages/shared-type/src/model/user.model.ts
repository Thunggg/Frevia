import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    otpCode: z.string().length(6),
    confirmPassword: z.string(),
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

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
