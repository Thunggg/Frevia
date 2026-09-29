import { RoleName } from "../constants/role.constant";
import { ManageRoleMessage } from "../message/manage-role.message";
import { z } from "zod";

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().trim().max(500, ManageRoleMessage.ROLE_NAME_TOO_LONG),
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

export const CreateRoleBodySchema = z.object({
  name: z.string().trim().max(500, ManageRoleMessage.ROLE_NAME_TOO_LONG),
  description: z
    .string()
    .trim()
    .max(500, ManageRoleMessage.ROLE_DESCRIPTION_TOO_LONG)
    .nullable()
    .optional(),
});
export const CreateRoleResponseSchema = RoleListItemSchema;

export type RoleType = z.infer<typeof RoleSchema>;
export type RoleListItemType = z.infer<typeof RoleListItemSchema>;
export type RoleListResponseType = z.infer<typeof RoleListResponseSchema>;
export type RoleDetailResponseType = z.infer<typeof RoleDetailResponseSchema>;
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>;
export type CreateRoleResponseType = z.infer<typeof CreateRoleResponseSchema>;
