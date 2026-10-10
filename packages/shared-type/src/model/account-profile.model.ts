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

const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
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

export const FavoriteFreelancerSchema = z.object({
  freelancerId: z.number(),
  createdAt: DateTimeSchema,
  profile: z.object({
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
          skillName: z.string(),
          proficiencyLevel: z.number(),
        }),
      ),
    }),
  }),
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
