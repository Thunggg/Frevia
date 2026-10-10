import { permissionApiRequest } from "@/apiRequests/permission";
import type { ApiResponse, PermissionFilterType } from "@shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const permissionKeys = {
  all: ["permissions"] as const,
  lists: () => [...permissionKeys.all, "list"] as const,
  list: (filter: Partial<PermissionFilterType>) =>
    [...permissionKeys.lists(), filter] as const,
  detail: (id: number) => [...permissionKeys.all, "detail", id] as const,
};

export function usePermissions(filter: Partial<PermissionFilterType> = {}) {
  const normalized: Partial<PermissionFilterType> = {
    page: filter.page ?? 1,
    limit: filter.limit ?? 10,
    search: filter.search || undefined,
    method: filter.method || undefined,
    module: filter.module || undefined,
    sortBy: filter.sortBy ?? "id",
    order: filter.order ?? "asc",
  };

  return useQuery({
    queryKey: permissionKeys.list(normalized),
    queryFn: () =>
      permissionApiRequest.getPermissions(normalized).then(extractData),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePermission(id: number) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: () => permissionApiRequest.getPermission(id).then(extractData),
    enabled: id > 0,
    staleTime: 2 * 60 * 1000,
  });
}
