import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";
import { ProfileRevisionSubmissionSchema } from "./profile-revision.model";

const NullableText = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional();

const normalizeStringList = (items: string[]) => {
  const unique = new Map<string, string>();
  for (const item of items) {
    const value = item.trim();
    const key = value.toLocaleLowerCase();
    if (value && !unique.has(key)) unique.set(key, value);
  }
  return Array.from(unique.values());
};

const CleanStringList = (itemMax: number) =>
  z
    .array(z.string())
    .max(100)
    .transform(normalizeStringList)
    .pipe(z.array(z.string().min(1).max(itemMax)).max(20));

export const UpdateExpertProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(255),
    title: NullableText(255),
    bio: NullableText(5000),
    expertise: CleanStringList(100),
    yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
    education: CleanStringList(500),
    certifications: CleanStringList(500),
    website: z.union([z.url().max(500), z.literal(""), z.null()]).optional(),
  })
  .strict();

export const AdminUpdateExpertProfileSchema = UpdateExpertProfileSchema.extend({
  isActive: z.boolean(),
}).strict();

export const ExpertProfileSchema = z.object({
  id: z.number(),
  userId: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  profileCompletionPercent: z.number().int().min(0).max(100),
  title: z.string().nullable(),
  expertise: z.array(z.string()),
  yearsOfExperience: z.number().int().nullable(),
  education: z.array(z.string()),
  certifications: z.array(z.string()),
  website: z.string().nullable(),
  isActive: z.boolean(),
});

export const PublicExpertQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(255).optional(),
  expertise: z.string().trim().max(500).optional(),
});

export const PublicExpertSchema = ExpertProfileSchema.pick({
  id: true,
  userId: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  profileCompletionPercent: true,
  title: true,
  expertise: true,
  yearsOfExperience: true,
  education: true,
  certifications: true,
  website: true,
  isActive: true,
});

export const PublicExpertListSchema = z.object({
  experts: z.array(PublicExpertSchema),
  pagination: PaginationSchema,
});

export { ProfileRevisionSubmissionSchema as ExpertProfileUpdateResponseSchema };
export type UpdateExpertProfileType = z.infer<typeof UpdateExpertProfileSchema>;
export type AdminUpdateExpertProfileType = z.infer<
  typeof AdminUpdateExpertProfileSchema
>;
export type ExpertProfileType = z.infer<typeof ExpertProfileSchema>;
export type PublicExpertQueryType = z.infer<typeof PublicExpertQuerySchema>;
export type PublicExpertType = z.infer<typeof PublicExpertSchema>;
export type PublicExpertListType = z.infer<typeof PublicExpertListSchema>;
