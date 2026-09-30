import { ViewListJobFilterType, ViewListJobResponseType } from "@shared/types";
import { http } from "@/lib/http";

const buildJobListUrl = (filter?: ViewListJobFilterType) => {
  const params = new URLSearchParams();

  if (filter?.page !== undefined) {
    params.set("page", String(filter.page));
  }

  if (filter?.limit !== undefined) {
    params.set("limit", String(filter.limit));
  }

  const queryString = params.toString();
  return queryString ? `/api/jobs?${queryString}` : "/api/jobs";
};

export const browseJobApiRequest = {
  viewListJob: (filter?: ViewListJobFilterType) =>
    http.get<ViewListJobResponseType>(buildJobListUrl(filter)),
};
