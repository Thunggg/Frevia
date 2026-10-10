import type {
  PermissionDetailResponseType,
  PermissionListResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

export const permissionApiRequest = {
  getPermissions: () =>
    http.get<PermissionListResponseType>("/api/permissions"),
  getPermission: (id: number) =>
    http.get<PermissionDetailResponseType>(`/api/permissions/${id}`),
};
