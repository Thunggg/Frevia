import { RoleName } from "../constants/role.constant";
import { z } from "zod";

export const RoleSchema = z.object({
  id: z.number(),
  name: z.enum([RoleName.CLIENT, RoleName.FREELANCER, RoleName.ADMIN]),
  description: z.string().nullable(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const RoleListItemSchema = RoleSchema.pick({
  id: true,
  name: true,
  description: true,
  createdAt: true,
});

export const RoleListResponseSchema = z.array(RoleListItemSchema);

export const RoleDetailResponseSchema = RoleListItemSchema;

export type RoleType = z.infer<typeof RoleSchema>;
export type RoleListItemType = z.infer<typeof RoleListItemSchema>;
export type RoleListResponseType = z.infer<typeof RoleListResponseSchema>;
export type RoleDetailResponseType = z.infer<typeof RoleDetailResponseSchema>;
