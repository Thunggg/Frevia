import { z } from "zod";
import {
  DocumentTypeSchema,
  VerificationStatusSchema,
  DateTimeSchema,
} from "./account-profile.model";
import { PaginationSchema } from "./forum-post.model";

export const IdentityVerificationAdminListItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  documentType: DocumentTypeSchema,
  fileUrl: z.string().min(1),
  status: VerificationStatusSchema,
  reviewNotes: z.string().nullable(),
  createdAt: DateTimeSchema,
  reviewedAt: DateTimeSchema.nullable(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
});

export const IdentityVerificationAdminDetailSchema =
  IdentityVerificationAdminListItemSchema.extend({
    admin: z
      .object({
        id: z.number(),
        email: z.string(),
        profile: z
          .object({
            displayName: z.string().nullable(),
          })
          .nullable(),
      })
      .nullable(),
    user: z.object({
      id: z.number(),
      email: z.string(),
      createdAt: DateTimeSchema,
      profile: z
        .object({
          displayName: z.string().nullable(),
          avatarUrl: z.string().nullable(),
          bio: z.string().nullable(),
          freelancerProfile: z
            .object({
              title: z.string().nullable(),
              idVerified: z.boolean(),
            })
            .nullable(),
        })
        .nullable(),
    }),
  });

export const IdentityVerificationAdminListResponseSchema = z.object({
  documents: z.array(IdentityVerificationAdminListItemSchema),
  pagination: PaginationSchema,
});

export const IdentityVerificationAdminFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: VerificationStatusSchema.optional(),
  search: z.string().optional(),
});

export const ApproveIdentityVerificationBodySchema = z
  .object({
    reviewNotes: z.string().max(1000).nullable().optional(),
  })
  .strict();

export const RejectIdentityVerificationBodySchema = z
  .object({
    reviewNotes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const IdentityVerificationAdminActionResponseSchema =
  IdentityVerificationAdminDetailSchema;

export type IdentityVerificationAdminListItemType = z.infer<
  typeof IdentityVerificationAdminListItemSchema
>;
export type IdentityVerificationAdminDetailType = z.infer<
  typeof IdentityVerificationAdminDetailSchema
>;
export type IdentityVerificationAdminListResponseType = z.infer<
  typeof IdentityVerificationAdminListResponseSchema
>;
export type IdentityVerificationAdminFilterType = z.infer<
  typeof IdentityVerificationAdminFilterSchema
>;
export type ApproveIdentityVerificationBodyType = z.infer<
  typeof ApproveIdentityVerificationBodySchema
>;
export type RejectIdentityVerificationBodyType = z.infer<
  typeof RejectIdentityVerificationBodySchema
>;
export type IdentityVerificationAdminActionResponseType = z.infer<
  typeof IdentityVerificationAdminActionResponseSchema
>;