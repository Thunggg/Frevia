import { roleApiRequest } from "@/apiRequests/role";
import type {
  ApiResponse,
  CreateRoleBodyType,
  UpdateRoleBodyType,
} from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  detail: (id: number) => [...roleKeys.all, "detail", id] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => roleApiRequest.getRoles().then(extractData),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleApiRequest.getRole(id).then(extractData),
    enabled: id > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRoleBodyType) =>
      roleApiRequest.createRole(body).then(extractData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateRoleBodyType }) =>
      roleApiRequest.updateRole(id, body).then(extractData),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(role.id) });
    },
  });
}
