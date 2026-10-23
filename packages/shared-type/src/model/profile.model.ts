import { z } from "zod";
import { AvailabilityStatus } from "../constants/profile.constant";
import { ProfileMessage } from "../message/profile.message";
import { SocialLinkSchema } from "./account-profile.model";

export const AvailabilityStatusEnum = z.nativeEnum(AvailabilityStatus);
const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
const ProfileStringListSchema = z
  .array(z.string().trim().min(1).max(255))
  .max(20);

export const FreelancerProfileDetailSchema = z.object({
  id: z.number(),
  userId: z.number(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  bio: z.string().nullable(),
  onlineStatus: z.boolean(),
  availabilityStatus: AvailabilityStatusEnum,
  profileCompletionPercent: z.number(),
  walletAddress: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  socialLinks: z.array(SocialLinkSchema),
  freelancerProfile: z
    .object({
      id: z.number(),
      profileId: z.number(),
      title: z.string().nullable(),
      education: ProfileStringListSchema.nullable(),
      certifications: ProfileStringListSchema.nullable(),
      languages: ProfileStringListSchema.nullable(),
      experience: ProfileStringListSchema.nullable(),
      cvFileName: z.string().min(1).nullable(),
      idVerified: z.boolean(),
      createdAt: DateTimeSchema,
      updatedAt: DateTimeSchema,
    })
    .nullable(),
});

export type FreelancerProfileDetailType = z.infer<
  typeof FreelancerProfileDetailSchema
>;

export const UpdateFreelancerProfileSchema = z
  .object({
    displayName: z
      .string({ message: ProfileMessage.DISPLAY_NAME_REQUIRED })
      .trim()
      .min(1, ProfileMessage.DISPLAY_NAME_REQUIRED)
      .max(255),
    title: z
      .string({ message: ProfileMessage.TITLE_REQUIRED })
      .trim()
      .min(1, ProfileMessage.TITLE_REQUIRED)
      .max(255),
    bio: z.string().trim().max(5000).nullable().optional(),
    availabilityStatus: AvailabilityStatusEnum.optional(),
    education: ProfileStringListSchema.nullable().optional(),
    certifications: ProfileStringListSchema.nullable().optional(),
    languages: ProfileStringListSchema.nullable().optional(),
    experience: ProfileStringListSchema.nullable().optional(),
  })
  .strict();

export type UpdateFreelancerProfileType = z.infer<
  typeof UpdateFreelancerProfileSchema
>;

export const UpdateFreelancerProfileResponseSchema =
  FreelancerProfileDetailSchema;

export const CvUploadResponseSchema = z.object({
  cvUrl: z.string().min(1),
  cvFileName: z.string().min(1),
});

export const CvAnalyzeSkillSchema = z.object({
  skillName: z.string().trim().min(1).max(100),
  proficiencyLevel: z
    .number()
    .int()
    .min(1)
    .max(10)
    .nullable(),
});

export const CvAnalyzeResponseSchema = z.object({
  suggestions: z.array(CvAnalyzeSkillSchema).max(50),
});

export type UpdateFreelancerProfileResponseType = z.infer<
  typeof UpdateFreelancerProfileResponseSchema
>;
export type CvUploadResponseType = z.infer<typeof CvUploadResponseSchema>;
export type CvAnalyzeSkillType = z.infer<typeof CvAnalyzeSkillSchema>;
export type CvAnalyzeResponseType = z.infer<typeof CvAnalyzeResponseSchema>;

export const FreelancerSkillSchema = z.object({
  id: z.number(),
  freelancerProfileId: z.number(),
  skillId: z.number(),
  proficiencyLevel: z.number(),
  skill: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export const FreelancerSkillListResponseSchema = z.array(FreelancerSkillSchema);

export type FreelancerSkillType = z.infer<typeof FreelancerSkillSchema>;
export type FreelancerSkillListResponseType = z.infer<
  typeof FreelancerSkillListResponseSchema
>;

export const AddFreelancerSkillSchema = z
  .object({
    skillName: z
      .string({ message: ProfileMessage.SKILL_NAME_REQUIRED })
      .trim()
      .min(1, ProfileMessage.SKILL_NAME_REQUIRED)
      .max(100),
    proficiencyLevel: z
      .number({ message: ProfileMessage.PROFICIENCY_LEVEL_REQUIRED })
      .int()
      .min(1, ProfileMessage.PROFICIENCY_LEVEL_RANGE)
      .max(10, ProfileMessage.PROFICIENCY_LEVEL_RANGE),
  })
  .strict();

export const AddFreelancerSkillResponseSchema = FreelancerSkillSchema;

export type AddFreelancerSkillType = z.infer<typeof AddFreelancerSkillSchema>;
export type AddFreelancerSkillResponseType = z.infer<
  typeof AddFreelancerSkillResponseSchema
>;
