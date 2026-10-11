import { PaginationSchema } from "./forum-post.model";
import { z } from "zod";

export const SessionListItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  deviceInfo: z.string().nullable(),
  ipAddress: z.string().nullable(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const SessionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(["id", "createdAt", "expiresAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionListItemSchema),
  pagination: PaginationSchema,
});

export type SessionListItemType = z.infer<typeof SessionListItemSchema>;
export type SessionFilterType = z.infer<typeof SessionFilterSchema>;
export type SessionListResponseType = z.infer<typeof SessionListResponseSchema>;
