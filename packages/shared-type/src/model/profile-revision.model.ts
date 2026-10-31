import { z } from "zod";

export const ProfileRevisionType = {
  CLIENT: "CLIENT",
  FREELANCER: "FREELANCER",
  EXPERT: "EXPERT",
} as const;

export const ProfileRevisionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const ProfileRevisionTypeSchema = z.nativeEnum(ProfileRevisionType);
export const ProfileRevisionStatusSchema = z.nativeEnum(ProfileRevisionStatus);
const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
const SnapshotSchema = z.record(z.string(), z.unknown());

const RevisionUserSchema = z.object({
  id: z.number(),
  email: z.email(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

export const ProfileRevisionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  profileId: z.number(),
  profileType: ProfileRevisionTypeSchema,
  status: ProfileRevisionStatusSchema,
  currentData: SnapshotSchema,
  proposedData: SnapshotSchema,
  profileStrength: z.number().int().min(0).max(100),
  reviewNotes: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  reviewedAt: DateTimeSchema.nullable(),
  user: RevisionUserSchema.optional(),
  admin: RevisionUserSchema.nullable().optional(),
});

export const ProfileRevisionSubmissionSchema = z.object({
  message: z.string(),
  reviewRequired: z.boolean(),
  profileStrength: z.number().int().min(0).max(100),
  revision: ProfileRevisionSchema.nullable(),
});

export const MyProfileRevisionSchema = z.object({
  revision: ProfileRevisionSchema.nullable(),
});

export const ProfileRevisionAdminFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: ProfileRevisionStatusSchema.optional(),
  profileType: ProfileRevisionTypeSchema.optional(),
  search: z.string().trim().max(255).optional(),
});

export const ProfileRevisionAdminListSchema = z.object({
  revisions: z.array(ProfileRevisionSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const ApproveProfileRevisionSchema = z
  .object({ reviewNotes: z.string().trim().max(1000).nullable().optional() })
  .strict();

export const RejectProfileRevisionSchema = z
  .object({
    reviewNotes: z
      .string()
      .trim()
      .min(1, "A rejection reason is required.")
      .max(1000),
  })
  .strict();

export type ProfileRevisionTypeType = z.infer<typeof ProfileRevisionTypeSchema>;
export type ProfileRevisionStatusType = z.infer<
  typeof ProfileRevisionStatusSchema
>;
export type ProfileRevisionType = z.infer<typeof ProfileRevisionSchema>;
export type ProfileRevisionSubmissionType = z.infer<
  typeof ProfileRevisionSubmissionSchema
>;
export type ProfileRevisionAdminFilterType = z.infer<
  typeof ProfileRevisionAdminFilterSchema
>;
export type ProfileRevisionAdminListType = z.infer<
  typeof ProfileRevisionAdminListSchema
>;
export type ApproveProfileRevisionType = z.infer<
  typeof ApproveProfileRevisionSchema
>;
export type RejectProfileRevisionType = z.infer<
  typeof RejectProfileRevisionSchema
>;
