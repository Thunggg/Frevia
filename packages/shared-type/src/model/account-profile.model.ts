import { z } from "zod";

export const DocumentType = {
  PASSPORT: "PASSPORT",
  ID_CARD: "ID_CARD",
  DRIVER_LICENSE: "DRIVER_LICENSE",
  RESIDENCE_PERMIT: "RESIDENCE_PERMIT",
  OTHER: "OTHER",
} as const;

export const VerificationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const SocialPlatform = {
  GITHUB: "GITHUB",
  LINKEDIN: "LINKEDIN",
  TWITTER: "TWITTER",
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  YOUTUBE: "YOUTUBE",
  WEBSITE: "WEBSITE",
  OTHER: "OTHER",
} as const;

export const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
export const DocumentTypeSchema = z.nativeEnum(DocumentType);
export const VerificationStatusSchema = z.nativeEnum(VerificationStatus);
export const SocialPlatformSchema = z.nativeEnum(SocialPlatform);

export const IdentityVerificationDocumentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  documentType: DocumentTypeSchema,
  fileUrl: z.string().min(1),
  status: VerificationStatusSchema,
  reviewNotes: z.string().nullable(),
  createdAt: DateTimeSchema,
  reviewedAt: DateTimeSchema.nullable(),
});

export const IdentityVerificationStatusSchema = z.object({
  status: VerificationStatusSchema.nullable(),
  documents: z.array(IdentityVerificationDocumentSchema),
});

export const UploadIdentityDocumentSchema = z
  .object({ documentType: DocumentTypeSchema })
  .strict();

export const SocialLinkSchema = z.object({
  id: z.number(),
  profileId: z.number(),
  platform: SocialPlatformSchema,
  url: z.url(),
});

export const AddSocialLinkSchema = z
  .object({
    platform: SocialPlatformSchema,
    url: z.url("Please enter a valid social URL."),
  })
  .strict();

export const ClientProfileDetailSchema = z.object({
  id: z.number(),
  userId: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: DateTimeSchema,
  clientProfile: z.object({
    id: z.number(),
    profileId: z.number(),
    companyName: z.string().nullable(),
    companyDescription: z.string().nullable(),
    website: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  }),
  socialLinks: z.array(SocialLinkSchema),
});

export const UpdateClientProfileSchema = z
  .object({
    companyName: z.string().trim().min(1).max(255),
    companyDescription: z.string().trim().max(5000).nullable().optional(),
    website: z
      .url("Please enter a valid company website.")
      .nullable()
      .optional(),
  })
  .strict();

const FreelancerRelationshipProfileSchema = z.object({
  id: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  availabilityStatus: z.string(),
  freelancerProfile: z.object({
    title: z.string().nullable(),
    idVerified: z.boolean(),
    skills: z.array(
      z.object({
        id: z.number(),
        skillId: z.number(),
        proficiencyLevel: z.number(),
        skill: z.object({
          id: z.number(),
          name: z.string(),
        }),
      }),
    ),
  }),
});

export const FavoriteFreelancerSchema = z.object({
  freelancerId: z.number(),
  createdAt: DateTimeSchema,
  profile: FreelancerRelationshipProfileSchema,
});

export const FollowingFreelancerSchema = FavoriteFreelancerSchema;

export const DiscoverFreelancerSchema = z.object({
  freelancerId: z.number(),
  isFollowing: z.boolean(),
  profile: FreelancerRelationshipProfileSchema,
});

export const GeneralProfileSchema = z.object({
  id: z.number(),
  userId: z.number(),
  email: z.email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  bio: z.string().nullable(),
  onlineStatus: z.boolean(),
  availabilityStatus: z.string(),
  profileCompletionPercent: z.number(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  roles: z.array(
    z.object({
      name: z.string(),
      isPrimary: z.boolean(),
    }),
  ),
});

export const UpdateGeneralProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(255),
    bio: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();

const PasswordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(32, "Password must contain at most 32 characters.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .superRefine(({ currentPassword, newPassword, confirmPassword }, context) => {
    if (newPassword !== confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Password confirmation does not match.",
        path: ["confirmPassword"],
      });
    }
    if (currentPassword === newPassword) {
      context.addIssue({
        code: "custom",
        message: "New password must be different from the current password.",
        path: ["newPassword"],
      });
    }
  });

export const AvatarUploadResponseSchema = z.object({
  avatarUrl: z.string().min(1),
});

export type DocumentTypeType = z.infer<typeof DocumentTypeSchema>;
export type VerificationStatusType = z.infer<typeof VerificationStatusSchema>;
export type SocialPlatformType = z.infer<typeof SocialPlatformSchema>;
export type IdentityVerificationDocumentType = z.infer<
  typeof IdentityVerificationDocumentSchema
>;
export type IdentityVerificationStatusType = z.infer<
  typeof IdentityVerificationStatusSchema
>;
export type UploadIdentityDocumentType = z.infer<
  typeof UploadIdentityDocumentSchema
>;
export type SocialLinkType = z.infer<typeof SocialLinkSchema>;
export type AddSocialLinkType = z.infer<typeof AddSocialLinkSchema>;
export type ClientProfileDetailType = z.infer<typeof ClientProfileDetailSchema>;
export type UpdateClientProfileType = z.infer<typeof UpdateClientProfileSchema>;
export type FavoriteFreelancerType = z.infer<typeof FavoriteFreelancerSchema>;
export type FollowingFreelancerType = z.infer<typeof FollowingFreelancerSchema>;
export type DiscoverFreelancerType = z.infer<typeof DiscoverFreelancerSchema>;
export type GeneralProfileType = z.infer<typeof GeneralProfileSchema>;
export type UpdateGeneralProfileType = z.infer<
  typeof UpdateGeneralProfileSchema
>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
export type AvatarUploadResponseType = z.infer<
  typeof AvatarUploadResponseSchema
>;
