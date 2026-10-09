import type {
  CreateRoleBodyType,
  CreateRoleResponseType,
  DeleteRoleResponseType,
  RoleDetailResponseType,
  RoleListResponseType,
  UpdateRoleBodyType,
  UpdateRoleResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

export const roleApiRequest = {
  getRoles: () => http.get<RoleListResponseType>("/api/roles"),
  getRole: (id: number) => http.get<RoleDetailResponseType>(`/api/roles/${id}`),
  createRole: (body: CreateRoleBodyType) =>
    http.post<CreateRoleResponseType>("/api/roles", body),
  updateRole: (id: number, body: UpdateRoleBodyType) =>
    http.patch<UpdateRoleResponseType>(`/api/roles/${id}`, body),
  deleteRole: (id: number) =>
    http.delete<DeleteRoleResponseType>(`/api/roles/${id}`),
};
