import type {
  ChangeJobStatusBodyType,
  ChangeJobStatusResponseType,
  CreateJobBodyType,
  JobType,
  UpdateJobBodyType,
  UpdateJobResponseType,
} from "@shared/types";

import { http } from "@/lib/http";

const jobApiRequest = {
  createJob(body: CreateJobBodyType) {
    return http.post<JobType>("/api/manage-jobs", body);
  },

  updateJob(jobId: number, body: UpdateJobBodyType) {
    return http.patch<UpdateJobResponseType>(`/api/manage-jobs/${jobId}`, body);
  },

  deleteJob(jobId: number) {
    return http.delete<void>(`/api/manage-jobs/${jobId}`);
  },

  changeJobStatus(jobId: number, body: ChangeJobStatusBodyType) {
    return http.patch<ChangeJobStatusResponseType>(
      `/api/manage-jobs/${jobId}/status`,
      body,
    );
  },

  bookmarkJob(slug: string) {
    return http.post<void>(
      `/api/manage-jobs/jobs/${encodeURIComponent(slug)}/bookmark`,
      {},
    );
  },

  removeBookmark(slug: string) {
    return http.delete<void>(
      `/api/manage-jobs/bookmarks/${encodeURIComponent(slug)}`,
    );
  },

  getBookmarkStatus(slug: string) {
    return http.get<{ isBookmarked: boolean }>(
      `/api/manage-jobs/jobs/${encodeURIComponent(slug)}/bookmark`,
    );
  },

  searchSkills(search: string) {
    return http.get<Array<{ id: number; name: string }>>(
      `/api/manage-jobs/skills?search=${encodeURIComponent(search)}`,
    );
  },
};

export default jobApiRequest;
