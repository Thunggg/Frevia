import type {
  JobCategoryBrowseListResponseType,
  JobCategoryBrowseQueryType,
} from "@shared/types";

import { http } from "@/lib/http";

function buildQueryString(params: JobCategoryBrowseQueryType): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * UC-46.06 — danh mục công việc đang hoạt động, dùng cho form đăng tin
 * và các bộ lọc phía client. Dữ liệu công khai nên gọi được cả khi chưa đăng nhập.
 */
const jobCategoryApiRequest = {
  getJobCategories(params: JobCategoryBrowseQueryType = {}) {
    return http.get<JobCategoryBrowseListResponseType>(
      `/api/job-categories${buildQueryString(params)}`,
    );
  },
};

export default jobCategoryApiRequest;
