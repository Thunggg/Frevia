import { HttpMethod } from "../constants/http-method.constant";
import { ManagePermissionMessage } from "../message/manage-permission.message";
import { PaginationSchema } from "./forum-post.model";
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

export const PermissionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  method: z
    .enum([
      HttpMethod.GET,
      HttpMethod.POST,
      HttpMethod.PUT,
      HttpMethod.PATCH,
      HttpMethod.DELETE,
    ])
    .optional(),
  module: z.string().trim().optional(),
  sortBy: z.enum(["id", "createdAt"]).default("id"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const PermissionListResponseSchema = z.object({
  permissions: z.array(PermissionListItemSchema),
  pagination: PaginationSchema,
  modules: z.array(z.string()),
});

export const PermissionDetailResponseSchema = PermissionListItemSchema;

export type PermissionType = z.infer<typeof PermissionSchema>;
export type PermissionListItemType = z.infer<typeof PermissionListItemSchema>;
export type PermissionFilterType = z.infer<typeof PermissionFilterSchema>;
export type PermissionListResponseType = z.infer<
  typeof PermissionListResponseSchema
>;
export type PermissionDetailResponseType = z.infer<
  typeof PermissionDetailResponseSchema
>;
