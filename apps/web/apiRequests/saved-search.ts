import type {
  CreateSavedSearchBodyType,
  SavedSearchType,
  UpdateSavedSearchBodyType,
} from "@shared/types";

import { http } from "@/lib/http";

const savedSearchApiRequest = {
  getSavedSearches(query?: { search?: string; order?: "asc" | "desc" }) {
    const params = new URLSearchParams();
    if (query?.search) params.set("search", query.search);
    if (query?.order) params.set("order", query.order);
    const queryString = params.toString();
    return http.get<SavedSearchType[]>(
      queryString ? `/api/saved-searches?${queryString}` : "/api/saved-searches",
    );
  },
  create(body: CreateSavedSearchBodyType) {
    return http.post<SavedSearchType>("/api/saved-searches", body);
  },
  update(id: number, body: UpdateSavedSearchBodyType) {
    return http.patch<SavedSearchType>(`/api/saved-searches/${id}`, body);
  },
  delete(id: number) {
    return http.delete<void>(`/api/saved-searches/${id}`);
  },
};

export default savedSearchApiRequest;
