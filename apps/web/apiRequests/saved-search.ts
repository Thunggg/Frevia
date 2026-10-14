import type {
  CreateSavedSearchBodyType,
  SavedSearchType,
  UpdateSavedSearchBodyType,
} from "@shared/types";

import { http } from "@/lib/http";

const savedSearchApiRequest = {
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
