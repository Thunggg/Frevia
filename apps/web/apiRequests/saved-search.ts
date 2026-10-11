import type { CreateSavedSearchBodyType, SavedSearchType } from "@shared/types";

import { http } from "@/lib/http";

const savedSearchApiRequest = {
  create(body: CreateSavedSearchBodyType) {
    return http.post<SavedSearchType>("/api/saved-searches", body);
  },
};

export default savedSearchApiRequest;
