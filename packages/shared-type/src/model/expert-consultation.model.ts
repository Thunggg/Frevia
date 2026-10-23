import { z } from "zod";
import { RoleName } from "../constants/role.constant";

export const ExpertConsultationType = {
  PROFILE_REVIEW: "PROFILE_REVIEW",
  CV_REVIEW: "CV_REVIEW",
  JOB_REVIEW: "JOB_REVIEW",
  CAREER_GUIDANCE: "CAREER_GUIDANCE",
  DISPUTE_ADVICE: "DISPUTE_ADVICE",
  OTHER: "OTHER",
} as const;

export const ExpertConsultationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export const ExpertConsultationTypeSchema = z.nativeEnum(
  ExpertConsultationType,
);
export const ExpertConsultationStatusSchema = z.nativeEnum(
  ExpertConsultationStatus,
);
export const ExpertConsultationRequesterRoleSchema = z.enum([
  RoleName.CLIENT,
  RoleName.FREELANCER,
]);

const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);
const ConsultationUserSchema = z.object({
  id: z.number(),
  email: z.email(),
  profile: z
    .object({
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

const ConsultationExpertSchema = z.object({
  id: z.number(),
  profile: z.object({
    userId: z.number(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
});

export const ExpertConsultationSchema = z.object({
  id: z.number(),
  requesterId: z.number(),
  expertId: z.number(),
  requesterRole: ExpertConsultationRequesterRoleSchema,
  type: ExpertConsultationTypeSchema,
  status: ExpertConsultationStatusSchema,
  title: z.string(),
  description: z.string(),
  expertResponse: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  acceptedAt: DateTimeSchema.nullable(),
  startedAt: DateTimeSchema.nullable(),
  completedAt: DateTimeSchema.nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  requester: ConsultationUserSchema,
  expert: ConsultationExpertSchema,
});

export const CreateExpertConsultationSchema = z
  .object({
    expertId: z.number().int().positive(),
    type: ExpertConsultationTypeSchema,
    title: z.string().trim().min(5).max(255),
    description: z.string().trim().min(20).max(5000),
  })
  .strict();

export const RejectExpertConsultationSchema = z
  .object({ reason: z.string().trim().min(3).max(1000) })
  .strict();

export const CompleteExpertConsultationSchema = z
  .object({ response: z.string().trim().min(10).max(5000) })
  .strict();

export const ExpertConsultationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: ExpertConsultationStatusSchema.optional(),
});

export const ExpertConsultationListSchema = z.object({
  consultations: z.array(ExpertConsultationSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type ExpertConsultationTypeType = z.infer<
  typeof ExpertConsultationTypeSchema
>;
export type ExpertConsultationStatusType = z.infer<
  typeof ExpertConsultationStatusSchema
>;
export type ExpertConsultationType = z.infer<typeof ExpertConsultationSchema>;
export type CreateExpertConsultationType = z.infer<
  typeof CreateExpertConsultationSchema
>;
export type RejectExpertConsultationType = z.infer<
  typeof RejectExpertConsultationSchema
>;
export type CompleteExpertConsultationType = z.infer<
  typeof CompleteExpertConsultationSchema
>;
export type ExpertConsultationListQueryType = z.infer<
  typeof ExpertConsultationListQuerySchema
>;
export type ExpertConsultationListType = z.infer<
  typeof ExpertConsultationListSchema
>;
