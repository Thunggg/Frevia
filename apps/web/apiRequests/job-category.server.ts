import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  JobCategoryBrowseListResponseType,
  JobCategoryBrowseQueryType,
  ViewJobCategoryDetailResponseType,
} from "@shared/types";

type ServerFetchResult<T> = {
  data: T | null;
  /** Mã HTTP của API (null khi không gọi được API). */
  status: number | null;
};

function buildQueryString(params: JobCategoryBrowseQueryType): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function jobCategoryServerFetch<T>(
  url: string,
): Promise<ServerFetchResult<T>> {
  if (!envConfig?.NESTJS_API_URL) {
    console.error("NESTJS_API_URL is not configured");
    return { data: null, status: null };
  }

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
      headers: {
        Accept: "application/json",
        // Danh mục công việc là dữ liệu công khai: token chỉ gửi kèm khi có.
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error(`Job category API returned non-JSON response: ${url}`);
      return { data: null, status: response.status };
    }

    const responseData = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !responseData.success) {
      console.error(`Job category API request failed: ${url}`, responseData);
      return { data: null, status: response.status };
    }

    return { data: responseData.data, status: response.status };
  } catch (error) {
    console.error(`Failed to fetch job category API: ${url}`, error);
    return { data: null, status: null };
  }
}

/**
 * UC-46.06 / UC-46.07 — đọc danh mục công việc từ Server Component.
 */
const jobCategoryServerRequest = {
  async getJobCategories(params: JobCategoryBrowseQueryType = {}) {
    const { data } = await jobCategoryServerFetch<JobCategoryBrowseListResponseType>(
      `/api/job-categories${buildQueryString(params)}`,
    );

    return data;
  },

  /**
   * Chi tiết danh mục kèm danh sách công việc đang mở.
   * Trả về cả mã HTTP để phân biệt EX-01 (không tìm thấy danh mục) và EX-02 (lỗi hệ thống).
   */
  getJobCategoryDetail(
    slug: string,
    params: Pick<JobCategoryBrowseQueryType, "page" | "limit"> = {},
  ) {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) {
      return Promise.resolve<ServerFetchResult<ViewJobCategoryDetailResponseType>>(
        { data: null, status: 404 },
      );
    }

    return jobCategoryServerFetch<ViewJobCategoryDetailResponseType>(
      `/api/job-categories/${encodeURIComponent(normalizedSlug)}${buildQueryString(params)}`,
    );
  },
};

export default jobCategoryServerRequest;
