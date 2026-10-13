import { z } from "zod";

export const NotificationType = {
  JOB_ALERT: "JOB_ALERT",
  PROPOSAL_NEW: "PROPOSAL_NEW",
  PROPOSAL_ACCEPTED: "PROPOSAL_ACCEPTED",
  CONTRACT_CREATED: "CONTRACT_CREATED",
  PAYMENT_RELEASED: "PAYMENT_RELEASED",
  DISPUTE_OPENED: "DISPUTE_OPENED",
  REVIEW_RECEIVED: "REVIEW_RECEIVED",
  SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
  MESSAGE_NEW: "MESSAGE_NEW",
  MILESTONE_COMPLETED: "MILESTONE_COMPLETED",
  TASK_OVERDUE: "TASK_OVERDUE",
} as const;

const DateTimeSchema = z.union([z.date(), z.iso.datetime()]);

export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: z.nativeEnum(NotificationType),
  title: z.string().nullable(),
  message: z.string().nullable(),
  data: z.unknown().nullable(),
  isRead: z.boolean(),
  createdAt: DateTimeSchema,
});

export const NotificationListSchema = z.array(NotificationSchema);
export const NotificationTypeSchema = z.nativeEnum(NotificationType);

export type NotificationTypeType = z.infer<typeof NotificationTypeSchema>;
export type NotificationItemType = z.infer<typeof NotificationSchema>;
