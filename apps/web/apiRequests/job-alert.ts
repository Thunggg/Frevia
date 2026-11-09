import type {
  CreateJobAlertBodyType,
  DeleteJobAlertResponseType,
  JobAlertType,
  MatchingJobItemType,
  UpdateJobAlertBodyType,
} from "@shared/types";

import { http } from "@/lib/http";

const jobAlertApiRequest = {
  getJobAlerts() {
    return http.get<JobAlertType[]>("/api/job-alerts");
  },
  getJobAlertDetail(id: number) {
    return http.get<JobAlertType>(`/api/job-alerts/${id}`);
  },
  getMatchingJobs(id: number) {
    return http.get<MatchingJobItemType[]>(`/api/job-alerts/${id}/matching-jobs`);
  },
  create(body: CreateJobAlertBodyType) {
    return http.post<JobAlertType>("/api/job-alerts", body);
  },
  update(id: number, body: UpdateJobAlertBodyType) {
    return http.patch<JobAlertType>(`/api/job-alerts/${id}`, body);
  },
  delete(id: number) {
    return http.delete<DeleteJobAlertResponseType>(`/api/job-alerts/${id}`);
  },
};

export default jobAlertApiRequest;

