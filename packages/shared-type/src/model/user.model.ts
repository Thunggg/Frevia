import { z } from "zod";
import { RoleName } from "../constants/role.constant";
import { TypeOfVerificationCode } from "../constants/token.constant";
import { AuthMessage } from "../message/auth.message";
import { ManageUserMessage } from "../message/manage-user.message";
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
export type AdminUserFreelancerSkillType = z.infer<
  typeof AdminUserFreelancerSkillSchema
>;
export type AdminUserPortfolioItemType = z.infer<
  typeof AdminUserPortfolioItemSchema
>;
export type AdminUserCustomRoleProfileType = z.infer<
  typeof AdminUserCustomRoleProfileSchema
>;

// --- Admin Create User ---

// ====== Admin: body/response khi admin TẠO tài khoản mới ======
export const AdminCreateUserBodySchema = z
  .object({
    email: z.email(AuthMessage.INVALID_EMAIL).trim().toLowerCase().max(254),
    fullName: z
      .string()
      .trim()
      .min(1, AuthMessage.FULLNAME_REQUIRED)
      .max(100, AuthMessage.FULLNAME_TOO_LONG),
    password: z
      .string()
      .nonempty(AuthMessage.PASSWORD_IS_REQUIRE)
      .min(8, AuthMessage.PASSWORD_TOO_SHORT)
      .max(32, AuthMessage.PASSWORD_TOO_LONG)
      .regex(/[A-Z]/, AuthMessage.PASSWORD_NEED_UPPERCASE)
      .regex(/[0-9]/, AuthMessage.PASSWORD_NEED_NUMBER),
    confirmPassword: z
      .string()
      .nonempty(AuthMessage.CONFIRM_PASSWORD_IS_REQUIRE),
    roleId: z
      .number({
        message: ManageUserMessage.ROLE_ID_REQUIRED,
      })
      .int(ManageUserMessage.ROLE_ID_REQUIRED)
      .positive(ManageUserMessage.ROLE_ID_REQUIRED),
  })
  .strict()
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: AuthMessage.PASSWORD_NOT_MATCH,
        path: ["confirmPassword"],
      });
    }
  });

// Role trả về sau khi tạo user (dùng chung cho các response của user)
export const AdminCreateUserRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  isPrimary: z.boolean(),
});

export const AdminCreateUserResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  displayName: z.string().nullable(),
  roles: z.array(AdminCreateUserRoleSchema),
});

export type AdminCreateUserBodyType = z.infer<typeof AdminCreateUserBodySchema>;
export type AdminCreateUserRoleType = z.infer<typeof AdminCreateUserRoleSchema>;
export type AdminCreateUserResponseType = z.infer<
  typeof AdminCreateUserResponseSchema
>;

// --- Admin Update User ---

// ====== Admin: SỬA thông tin chung account (email / tên / trạng thái ban) ======
// Tất cả trường đều tuỳ chọn; superRefine yêu cầu ít nhất 1 trường được gửi lên.
export const AdminUpdateUserBodySchema = z
  .object({
    email: z
      .email(AuthMessage.INVALID_EMAIL)
      .trim()
      .toLowerCase()
      .max(254)
      .optional(),
    fullName: z
      .union([
        z
          .string()
          .trim()
          .min(1, AuthMessage.FULLNAME_REQUIRED)
          .max(100, AuthMessage.FULLNAME_TOO_LONG),
        z.null(),
      ])
      .optional(),
    isBanned: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.email === undefined &&
      value.fullName === undefined &&
      value.isBanned === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: ManageUserMessage.NOTHING_TO_UPDATE,
        path: ["email"],
      });
    }
  });

// Response chuẩn cho thao tác sửa user (gồm id/email/tên/trạng thái + roles)
export const AdminUpdateUserResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  displayName: z.string().nullable(),
  isBanned: z.boolean(),
  roles: z.array(AdminCreateUserRoleSchema),
});

export type AdminUpdateUserBodyType = z.infer<typeof AdminUpdateUserBodySchema>;
export type AdminUpdateUserResponseType = z.infer<
  typeof AdminUpdateUserResponseSchema
>;

// --- Admin Edit Client Profile ---

// ====== Admin: SỬA hồ sơ CLIENT (công ty) ======
// companyName/description/website: để null hoặc chuỗi rỗng = xoá nội dung đó.
export const AdminUpdateClientProfileBodySchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .max(255, ManageUserMessage.COMPANY_NAME_TOO_LONG)
      .nullable()
      .optional(),
    companyDescription: z
      .string()
      .trim()
      .max(5000, ManageUserMessage.COMPANY_DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),
    website: z
      .string()
      .trim()
      .url(ManageUserMessage.INVALID_WEBSITE)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.companyName === undefined &&
      value.companyDescription === undefined &&
      value.website === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: ManageUserMessage.NOTHING_TO_UPDATE,
        path: ["companyName"],
      });
    }
  });

// Response của hồ sơ Client sau khi admin lưu
export const AdminClientProfileResponseSchema = z.object({
  id: z.number(),
  profileId: z.number(),
  userId: z.number(),
  companyName: z.string().nullable(),
  companyDescription: z.string().nullable(),
  website: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AdminUpdateClientProfileBodyType = z.infer<
  typeof AdminUpdateClientProfileBodySchema
>;
export type AdminClientProfileResponseType = z.infer<
  typeof AdminClientProfileResponseSchema
>;

// --- Admin Edit Freelancer Profile ---

// ====== Admin: SỬA hồ sơ FREELANCER (tiêu đề + bio) ======
// title/bio: để null hoặc chuỗi rỗng = xoá nội dung đó.
export const AdminUpdateFreelancerProfileBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(255, ManageUserMessage.FREELANCER_TITLE_TOO_LONG)
      .nullable()
      .optional(),
    bio: z
      .string()
      .trim()
      .max(5000, ManageUserMessage.BIO_TOO_LONG)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.title === undefined && value.bio === undefined) {
      ctx.addIssue({
        code: "custom",
        message: ManageUserMessage.NOTHING_TO_UPDATE,
        path: ["title"],
      });
    }
  });

// Một kỹ năng trong danh sách thay thế (chọn từ catalog Skill của hệ thống)
export const AdminFreelancerSkillInputSchema = z.object({
  skillName: z
    .string()
    .trim()
    .min(1, ManageUserMessage.SKILL_NAME_REQUIRED)
    .max(100, ManageUserMessage.SKILL_NAME_TOO_LONG),
  proficiencyLevel: z
    .number({ message: ManageUserMessage.SKILL_LEVEL_INVALID })
    .int(ManageUserMessage.SKILL_LEVEL_INVALID)
    .min(1, ManageUserMessage.SKILL_LEVEL_INVALID)
    .max(10, ManageUserMessage.SKILL_LEVEL_INVALID),
});

// Body "thay thế toàn bộ kỹ năng" — server xoá hết kỹ năng cũ rồi tạo lại theo mảng này
export const AdminReplaceFreelancerSkillsBodySchema = z
  .object({
    skills: z
      .array(AdminFreelancerSkillInputSchema)
      .max(100, ManageUserMessage.TOO_MANY_SKILLS),
  })
  .strict();

// Body TẠO portfolio item — title bắt buộc, technologies nhập mảng chuỗi
export const AdminCreatePortfolioItemBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, ManageUserMessage.PORTFOLIO_TITLE_REQUIRED)
      .max(255, ManageUserMessage.PORTFOLIO_TITLE_TOO_LONG),
    description: z
      .string()
      .trim()
      .max(5000, ManageUserMessage.PORTFOLIO_DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),
    technologies: z
      .array(
        z
          .string()
          .trim()
          .min(1, ManageUserMessage.SKILL_NAME_REQUIRED)
          .max(100, ManageUserMessage.SKILL_NAME_TOO_LONG),
      )
      .max(50)
      .default([]),
    projectUrl: z
      .string()
      .trim()
      .url(ManageUserMessage.INVALID_URL)
      .nullable()
      .optional(),
  })
  .strict();

// Body SỬA portfolio item — trường nào gửi thì cập nhật trường đó (tối thiểu 1 trường)
export const AdminUpdatePortfolioItemBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, ManageUserMessage.PORTFOLIO_TITLE_REQUIRED)
      .max(255, ManageUserMessage.PORTFOLIO_TITLE_TOO_LONG)
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, ManageUserMessage.PORTFOLIO_DESCRIPTION_TOO_LONG)
      .nullable()
      .optional(),
    technologies: z
      .array(
        z
          .string()
          .trim()
          .min(1, ManageUserMessage.SKILL_NAME_REQUIRED)
          .max(100, ManageUserMessage.SKILL_NAME_TOO_LONG),
      )
      .max(50)
      .optional(),
    projectUrl: z
      .string()
      .trim()
      .url(ManageUserMessage.INVALID_URL)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.title === undefined &&
      value.description === undefined &&
      value.technologies === undefined &&
      value.projectUrl === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: ManageUserMessage.NOTHING_TO_UPDATE,
        path: ["title"],
      });
    }
  });

export type AdminUpdateFreelancerProfileBodyType = z.infer<
  typeof AdminUpdateFreelancerProfileBodySchema
>;
export type AdminFreelancerSkillInputType = z.infer<
  typeof AdminFreelancerSkillInputSchema
>;
export type AdminReplaceFreelancerSkillsBodyType = z.infer<
  typeof AdminReplaceFreelancerSkillsBodySchema
>;

// --- Admin Skill Catalog (freelancer skills picker) ---

// ====== Admin: catalog Skill (nguồn chọn kỹ năng trong dialog) ======
export const AdminSkillCatalogItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const AdminSkillCatalogListSchema = z.array(AdminSkillCatalogItemSchema);

export type AdminSkillCatalogItemType = z.infer<
  typeof AdminSkillCatalogItemSchema
>;
export type AdminSkillCatalogListType = z.infer<
  typeof AdminSkillCatalogListSchema
>;
export type AdminCreatePortfolioItemBodyType = z.infer<
  typeof AdminCreatePortfolioItemBodySchema
>;
export type AdminUpdatePortfolioItemBodyType = z.infer<
  typeof AdminUpdatePortfolioItemBodySchema
>;
