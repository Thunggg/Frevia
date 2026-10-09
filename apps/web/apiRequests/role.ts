import type {
  CreateRoleBodyType,
  CreateRoleResponseType,
  RoleDetailResponseType,
  RoleListResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

export const roleApiRequest = {
  getRoles: () => http.get<RoleListResponseType>("/api/roles"),
  getRole: (id: number) => http.get<RoleDetailResponseType>(`/api/roles/${id}`),
  createRole: (body: CreateRoleBodyType) =>
    http.post<CreateRoleResponseType>("/api/roles", body),
};
