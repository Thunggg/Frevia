import type {
  RoleDetailResponseType,
  RoleListResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

export const roleApiRequest = {
  getRoles: () => http.get<RoleListResponseType>("/api/roles"),
  getRole: (id: number) => http.get<RoleDetailResponseType>(`/api/roles/${id}`),
};
