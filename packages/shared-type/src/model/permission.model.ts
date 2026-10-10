import { HttpMethod } from "../constants/http-method.constant";
import { ManagePermissionMessage } from "../message/manage-permission.message";
import { z } from "zod";

export const PermissionSchema = z.object({
  id: z.number(),
  name: z
    .string()
    .trim()
    .min(1, ManagePermissionMessage.PERMISSION_NAME_REQUIRED)
    .max(500, ManagePermissionMessage.PERMISSION_NAME_TOO_LONG),
  path: z
    .string()
    .trim()
    .min(1, ManagePermissionMessage.PERMISSION_PATH_REQUIRED)
    .max(1000, ManagePermissionMessage.PERMISSION_PATH_TOO_LONG),
  method: z.enum([
    HttpMethod.GET,
    HttpMethod.POST,
    HttpMethod.PUT,
    HttpMethod.PATCH,
    HttpMethod.DELETE,
  ]),
  module: z
    .string()
    .trim()
    .max(500, ManagePermissionMessage.PERMISSION_MODULE_TOO_LONG)
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const PermissionListItemSchema = PermissionSchema.pick({
  id: true,
  name: true,
  path: true,
  method: true,
  module: true,
  createdAt: true,
});

export const PermissionListResponseSchema = z.array(PermissionListItemSchema);

export const PermissionDetailResponseSchema = PermissionListItemSchema;

export type PermissionType = z.infer<typeof PermissionSchema>;
export type PermissionListItemType = z.infer<typeof PermissionListItemSchema>;
export type PermissionListResponseType = z.infer<
  typeof PermissionListResponseSchema
>;
export type PermissionDetailResponseType = z.infer<
  typeof PermissionDetailResponseSchema
>;
