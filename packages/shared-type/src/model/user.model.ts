import { z } from "zod";
import { RoleName } from "../constants/role.constant";
import { TypeOfVerificationCode } from "../constants/token.constant";
import { AuthMessage } from "../message/auth.message";
import { PaginationSchema } from "./forum-post.model";

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
  id: z.number(),
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

export const SwitchRoleBodySchema = z
  .object({
    role: z.enum([RoleName.FREELANCER, RoleName.CLIENT]),
  })
  .strict();

export const SwitchRoleResponseSchema = z.object({
  accessToken: z.string(),
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
export type SwitchRoleBodyType = z.infer<typeof SwitchRoleBodySchema>;
export type SwitchRoleResponseType = z.infer<typeof SwitchRoleResponseSchema>;

// --- Admin User Management ---

export const AdminUserRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export const AdminUserItemSchema = z.object({
  id: z.number(),
  email: z.string(),
  isBanned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  roles: z.array(AdminUserRoleSchema),
});

export const AdminUserListResponseSchema = z.object({
  users: z.array(AdminUserItemSchema),
  pagination: PaginationSchema,
});

export const AdminUserQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z
    .enum(["id", "email", "createdAt", "displayName"])
    .optional()
    .default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type AdminUserRoleType = z.infer<typeof AdminUserRoleSchema>;
export type AdminUserItemType = z.infer<typeof AdminUserItemSchema>;
export type AdminUserListResponseType = z.infer<
  typeof AdminUserListResponseSchema
>;
export type AdminUserQueryType = z.infer<typeof AdminUserQuerySchema>;

export const AdminUserSocialLinkSchema = z.object({
  id: z.number(),
  platform: z.string(),
  url: z.string(),
});

export const AdminUserStatsSchema = z.object({
  jobsPosted: z.number(),
  contractsAsClient: z.number(),
  contractsAsFreelancer: z.number(),
  proposals: z.number(),
  reviewsReceived: z.number(),
  idVerificationDocuments: z.number(),
});

export const AdminUserClientProfileSchema = z.object({
  id: z.number(),
  companyName: z.string().nullable().optional(),
  companyDescription: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AdminUserFreelancerSkillSchema = z.object({
  id: z.number(),
  skillName: z.string(),
  proficiencyLevel: z.number(),
});

export const AdminUserPortfolioItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  technologies: z.array(z.string()).default([]),
  mediaUrls: z.array(z.string()).default([]),
  projectUrl: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const AdminUserFreelancerProfileSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  education: z.any().nullable().optional(),
  certifications: z.any().nullable().optional(),
  languages: z.any().nullable().optional(),
  idVerified: z.boolean(),
  skills: z.array(AdminUserFreelancerSkillSchema).default([]),
  portfolioItems: z.array(AdminUserPortfolioItemSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AdminUserPermissionItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  path: z.string(),
  method: z.string(),
  module: z.string().nullable().optional(),
});

export const AdminUserCustomRoleProfileSchema = z.object({
  roleId: z.number(),
  roleName: z.string(),
  description: z.string().nullable().optional(),
  isPrimary: z.boolean(),
  permissions: z.array(AdminUserPermissionItemSchema).default([]),
});

export const AdminUserDetailResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  isBanned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  onlineStatus: z.boolean().optional(),
  availabilityStatus: z.string().optional(),
  profileCompletionPercent: z.number().optional(),
  roles: z.array(AdminUserRoleSchema),
  socialLinks: z.array(AdminUserSocialLinkSchema).default([]),
  stats: AdminUserStatsSchema,
  clientProfile: AdminUserClientProfileSchema.nullable().optional(),
  freelancerProfile: AdminUserFreelancerProfileSchema.nullable().optional(),
  customRoleProfiles: z.array(AdminUserCustomRoleProfileSchema).default([]),
});

export type AdminUserDetailResponseType = z.infer<
  typeof AdminUserDetailResponseSchema
>;
export type AdminUserSocialLinkType = z.infer<typeof AdminUserSocialLinkSchema>;
export type AdminUserStatsType = z.infer<typeof AdminUserStatsSchema>;
export type AdminUserClientProfileType = z.infer<
  typeof AdminUserClientProfileSchema
>;
export type AdminUserFreelancerProfileType = z.infer<
  typeof AdminUserFreelancerProfileSchema
>;
export type AdminUserCustomRoleProfileType = z.infer<
  typeof AdminUserCustomRoleProfileSchema
>;
