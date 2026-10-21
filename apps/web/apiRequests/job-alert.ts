import type {
  CreateJobAlertBodyType,
  GetJobAlertsQueryType,
  GetJobAlertsResponseType,
  JobAlertType,
  UpdateJobAlertBodyType,
} from "@shared/types";

import { http } from "@/lib/http";

export const jobAlertApiRequest = {
  getAll(query: GetJobAlertsQueryType) {
    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
      sortBy: query.sortBy,
      order: query.order,
    });
    return http.get<GetJobAlertsResponseType>(
      `/api/job-alerts?${params.toString()}`,
    );
  },

  getById(id: number) {
    return http.get<JobAlertType>(`/api/job-alerts/${id}`);
  },

  create(body: CreateJobAlertBodyType) {
    return http.post<JobAlertType>("/api/job-alerts", body);
  },

  update(id: number, body: UpdateJobAlertBodyType) {
    return http.patch<JobAlertType>(`/api/job-alerts/${id}`, body);
  },

  delete(id: number) {
    return http.delete<{ message: string }>(`/api/job-alerts/${id}`);
  },
};
