import { permissionApiRequest } from "@/apiRequests/permission";
import type { ApiResponse } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const permissionKeys = {
  all: ["permissions"] as const,
  lists: () => [...permissionKeys.all, "list"] as const,
  detail: (id: number) => [...permissionKeys.all, "detail", id] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: () => permissionApiRequest.getPermissions().then(extractData),
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
