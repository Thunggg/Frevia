import type {
  PermissionDetailResponseType,
  PermissionFilterType,
  PermissionListResponseType,
} from "@shared/types";
import { http } from "@/lib/http";

function buildQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export const permissionApiRequest = {
  getPermissions: (filter: Partial<PermissionFilterType> = {}) => {
    const query = buildQueryString({
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      method: filter.method,
      module: filter.module,
      sortBy: filter.sortBy,
      order: filter.order,
    });
    return http.get<PermissionListResponseType>(`/api/permissions${query}`);
  },
  getPermission: (id: number) =>
    http.get<PermissionDetailResponseType>(`/api/permissions/${id}`),
};
