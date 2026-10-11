import { http } from "@/lib/http";
import type {
  RevokeSessionResponseType,
  SessionDetailResponseType,
  SessionFilterType,
  SessionListResponseType,
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

export const sessionApiRequest = {
  getSessions: (filter: Partial<SessionFilterType> = {}) => {
    const query = buildQueryString({
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      sortBy: filter.sortBy,
      order: filter.order,
    });
    return http.get<SessionListResponseType>(`/api/sessions${query}`);
  },
  getSession: (id: number) =>
    http.get<SessionDetailResponseType>(`/api/sessions/${id}`),
  revokeSession: (id: number) =>
    http.delete<RevokeSessionResponseType>(`/api/sessions/${id}`),
};
