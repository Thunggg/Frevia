import { sessionApiRequest } from "@/apiRequests/session";
import type { ApiResponse, SessionFilterType } from "@shared/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (filter: Partial<SessionFilterType>) =>
    [...sessionKeys.lists(), filter] as const,
  detail: (id: number) => [...sessionKeys.all, "detail", id] as const,
};

export function useSessions(filter: Partial<SessionFilterType> = {}) {
  const normalized: Partial<SessionFilterType> = {
    page: filter.page ?? 1,
    limit: filter.limit ?? 10,
    search: filter.search || undefined,
    sortBy: filter.sortBy ?? "createdAt",
    order: filter.order ?? "desc",
  };

  return useQuery({
    queryKey: sessionKeys.list(normalized),
    queryFn: () => sessionApiRequest.getSessions(normalized).then(extractData),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSession(id: number, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => sessionApiRequest.getSession(id).then(extractData),
    enabled: enabled && id > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      sessionApiRequest.revokeSession(id).then(extractData),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.removeQueries({ queryKey: sessionKeys.detail(id) });
    },
  });
}
