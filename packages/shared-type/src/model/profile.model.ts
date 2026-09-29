import { z } from "zod";
import { AvailabilityStatus } from "../constants/profile.constant";
import { ProfileMessage } from "../message/profile.message";

export const AvailabilityStatusEnum = z.nativeEnum(AvailabilityStatus);

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
  createdAt: z.any(),
  updatedAt: z.any(),
  freelancerProfile: z.object({
    id: z.number(),
    profileId: z.number(),
    title: z.string().nullable(),
    education: z.any().nullable(),
    certifications: z.any().nullable(),
    languages: z.any().nullable(),
    idVerified: z.boolean(),
    createdAt: z.any(),
    updatedAt: z.any(),
  }).nullable(),
});

export type FreelancerProfileDetailType = z.infer<typeof FreelancerProfileDetailSchema>;

export const UpdateFreelancerProfileSchema = z.object({
  displayName: z
    .string({ message: ProfileMessage.DISPLAY_NAME_REQUIRED })
    .min(1, ProfileMessage.DISPLAY_NAME_REQUIRED)
    .max(255),
  title: z
    .string({ message: ProfileMessage.TITLE_REQUIRED })
    .min(1, ProfileMessage.TITLE_REQUIRED)
    .max(255),

  bio: z.string().nullable().optional(),
  availabilityStatus: AvailabilityStatusEnum.optional(),
  education: z.any().nullable().optional(),
  certifications: z.any().nullable().optional(),
  languages: z.any().nullable().optional(),
});

export type UpdateFreelancerProfileType = z.infer<typeof UpdateFreelancerProfileSchema>;

export const UpdateFreelancerProfileResponseSchema = FreelancerProfileDetailSchema;

export type UpdateFreelancerProfileResponseType = z.infer<
  typeof UpdateFreelancerProfileResponseSchema
>;
