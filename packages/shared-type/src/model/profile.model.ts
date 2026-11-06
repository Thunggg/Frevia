import { z } from "zod";
import { AvailabilityStatus } from "../constants/profile.constant";
import { ProfileMessage } from "../message/profile.message";

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

export const CvAnalysisStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "DISCARDED",
]);

export const CvSourceTypeEnum = z.enum([
  "PDF_TEXT",
  "PDF_OCR",
  "DOCX",
  "DOC",
]);

export const CvAnalysisSkillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  proficiencyLevel: z.number().int().min(1).max(10).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  evidence: z.string().max(200).nullable(),
});

export const CvAnalysisExperienceSchema = z.object({
  title: z.string().max(150).nullable(),
  company: z.string().max(150).nullable(),
  startDate: z.string().max(10).nullable(),
  endDate: z.string().max(10).nullable(),
  isCurrent: z.boolean(),
  description: z.string().max(1000).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const CvAnalysisEducationSchema = z.object({
  degree: z.string().max(150).nullable(),
  school: z.string().max(150).nullable(),
  startYear: z.number().int().nullable(),
  endYear: z.number().int().nullable(),
  description: z.string().max(1000).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const CvAnalysisProjectSchema = z.object({
  name: z.string().max(150).nullable(),
  technologies: z.array(z.string().max(60)).max(30),
  description: z.string().max(1000).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const CvAnalysisPayloadSchema = z.object({
  skills: z.array(CvAnalysisSkillSchema).max(50),
  experience: z.array(CvAnalysisExperienceSchema).max(20),
  education: z.array(CvAnalysisEducationSchema).max(10),
  projects: z.array(CvAnalysisProjectSchema).max(20),
  summary: z.string().max(1500).nullable(),
});

export const CvAnalysisMetaSchema = z.object({
  source: CvSourceTypeEnum,
  pages: z.number().int().min(0),
  chars: z.number().int().min(0),
  truncated: z.boolean(),
  ocrUsed: z.boolean(),
  model: z.string().max(100).nullable(),
  durationMs: z.number().int().nullable(),
  warnings: z.array(z.string().max(200)).max(50),
});

export const CvAnalysisDraftSchema = z.object({
  id: z.number(),
  status: CvAnalysisStatusEnum,
  cvFileName: z.string().nullable(),
  cvUploadedAt: DateTimeSchema.nullable(),
  isStale: z.boolean(),
  payload: CvAnalysisPayloadSchema,
  meta: CvAnalysisMetaSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const CvAnalyzeResponseSchema = z.object({
  suggestions: z.array(CvAnalyzeSkillSchema).max(50),
  analysis: CvAnalysisDraftSchema,
});

export const CvAnalysisConfirmSkillSchema = z.object({
  skillName: z.string().trim().min(1).max(100),
  proficiencyLevel: z.number().int().min(1).max(10),
});

export const CvAnalysisConfirmExperienceSchema = z.object({
  title: z.string().trim().max(150).nullable(),
  company: z.string().trim().max(150).nullable(),
  startDate: z.string().trim().max(10).nullable(),
  endDate: z.string().trim().max(10).nullable(),
  isCurrent: z.boolean(),
  description: z.string().trim().max(1000).nullable(),
});

export const CvAnalysisConfirmEducationSchema = z.object({
  degree: z.string().trim().max(150).nullable(),
  school: z.string().trim().max(150).nullable(),
  startYear: z.number().int().min(1950).max(2100).nullable(),
  endYear: z.number().int().min(1950).max(2100).nullable(),
  description: z.string().trim().max(1000).nullable(),
});

export const CvAnalysisConfirmProjectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30),
  description: z.string().trim().max(1000).nullable(),
});

export const CvAnalysisConfirmSchema = z
  .object({
    skills: z.array(CvAnalysisConfirmSkillSchema).max(50).optional(),
    experience: z.array(CvAnalysisConfirmExperienceSchema).max(20).optional(),
    education: z.array(CvAnalysisConfirmEducationSchema).max(10).optional(),
    projects: z.array(CvAnalysisConfirmProjectSchema).max(20).optional(),
  })
  .strict();

export const CvAnalysisConfirmResultSchema = z.object({
  message: z.string(),
  status: CvAnalysisStatusEnum,
  counts: z.object({
    skills: z.number(),
    experience: z.number(),
    education: z.number(),
    projects: z.number(),
  }),
  profileCompletionPercent: z.number(),
});

export const CvAnalysisDiscardResultSchema = z.object({
  message: z.string(),
  status: CvAnalysisStatusEnum,
});

export type UpdateFreelancerProfileResponseType = z.infer<
  typeof UpdateFreelancerProfileResponseSchema
>;
export type CvUploadResponseType = z.infer<typeof CvUploadResponseSchema>;
export type CvAnalyzeSkillType = z.infer<typeof CvAnalyzeSkillSchema>;
export type CvAnalyzeResponseType = z.infer<typeof CvAnalyzeResponseSchema>;
export type CvAnalysisStatusType = z.infer<typeof CvAnalysisStatusEnum>;
export type CvSourceType = z.infer<typeof CvSourceTypeEnum>;
export type CvAnalysisSkillType = z.infer<typeof CvAnalysisSkillSchema>;
export type CvAnalysisExperienceType = z.infer<
  typeof CvAnalysisExperienceSchema
>;
export type CvAnalysisEducationType = z.infer<
  typeof CvAnalysisEducationSchema
>;
export type CvAnalysisProjectType = z.infer<typeof CvAnalysisProjectSchema>;
export type CvAnalysisPayloadType = z.infer<typeof CvAnalysisPayloadSchema>;
export type CvAnalysisMetaType = z.infer<typeof CvAnalysisMetaSchema>;
export type CvAnalysisDraftType = z.infer<typeof CvAnalysisDraftSchema>;
export type CvAnalysisConfirmType = z.infer<typeof CvAnalysisConfirmSchema>;
export type CvAnalysisConfirmResultType = z.infer<
  typeof CvAnalysisConfirmResultSchema
>;
export type CvAnalysisDiscardResultType = z.infer<
  typeof CvAnalysisDiscardResultSchema
>;

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
