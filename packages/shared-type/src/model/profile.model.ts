import { z } from "zod";
import { AvailabilityStatus } from "../constants/profile.constant";

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
