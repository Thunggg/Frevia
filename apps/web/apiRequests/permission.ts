import { http } from "@/lib/http";
import type {
  PermissionDetailResponseType,
  PermissionFilterType,
  PermissionListItemType,
  PermissionListResponseType,
} from "@shared/types";

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
  getAllPermissions: async () => {
    const limit = 100;
    const first = await permissionApiRequest.getPermissions({
      page: 1,
      limit,
      sortBy: "id",
      order: "asc",
    });

    if (!first.success || !("data" in first)) {
      return first;
    }

    const permissions: PermissionListItemType[] = [...first.data.permissions];

    for (let page = 2; page <= first.data.pagination.totalPages; page++) {
      const next = await permissionApiRequest.getPermissions({
        page,
        limit,
        sortBy: "id",
        order: "asc",
      });
      if (!next.success || !("data" in next)) {
        return next;
      }
      permissions.push(...next.data.permissions);
    }

    return {
      ...first,
      data: {
        permissions,
        pagination: {
          page: 1,
          limit: permissions.length,
          total: permissions.length,
          totalPages: 1,
        },
        modules: first.data.modules,
      },
    };
  },
  getPermission: (id: number) =>
    http.get<PermissionDetailResponseType>(`/api/permissions/${id}`),
};
