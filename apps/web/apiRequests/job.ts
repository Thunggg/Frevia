import type {
  CreateJobBodyType,
  JobType,
  PublishJobResponseType,
  CloseJobResponseType,
  ReopenJobResponseType,
  UpdateJobBodyType,
  UpdateJobResponseType,
  ViewListJobResponseType,
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

  publishJob(jobId: number) {
    return http.patch<PublishJobResponseType>(
      `/api/manage-jobs/${jobId}/publish`,
      {},
    );
  },

  closeJob(jobId: number) {
    return http.patch<CloseJobResponseType>(
      `/api/manage-jobs/${jobId}/close`,
      {},
    );
  },

  reopenJob(jobId: number) {
    return http.patch<ReopenJobResponseType>(
      `/api/manage-jobs/${jobId}/reopen`,
      {},
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

  checkLanguage(body: { title?: string; description?: string }) {
    return http.post<{
      title: { isEnglish: boolean };
      description: { isEnglish: boolean };
      isEnglish: boolean;
    }>("/api/manage-jobs/check-language", body);
  },

  getBookmarkStatus(slug: string) {
    return http.get<{ isBookmarked: boolean }>(
      `/api/manage-jobs/jobs/${encodeURIComponent(slug)}/bookmark`,
    );
  },

  getClientJobs(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
    const qs = query.toString();
    return http.get<ViewListJobResponseType>(
      `/api/manage-jobs${qs ? `?${qs}` : ""}`,
    );
  },

  searchSkills(search: string) {
    return http.get<Array<{ id: number; name: string }>>(
      `/api/manage-jobs/skills?search=${encodeURIComponent(search)}`,
    );
  },
};

export default jobApiRequest;
