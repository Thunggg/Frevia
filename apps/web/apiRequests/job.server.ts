import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ViewBookmarkedJobFilterType,
  ViewBookmarkedJobResponseType,
  ViewJobDetailResType,
  ViewListJobFilterType,
  ViewListJobResponseType,
} from "@shared/types";

type ServerFetchOptions = {
  requireAuth?: boolean;
};

function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }

    if (value instanceof Date) {
      searchParams.set(key, value.toISOString());
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function jobServerFetch<T>(
  url: string,
  options: ServerFetchOptions = {},
): Promise<T | null> {
  const { requireAuth = false } = options;

  if (!envConfig?.NESTJS_API_URL) {
    console.error("NESTJS_API_URL is not configured");
    return null;
  }

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("access_token")?.value;

  if (requireAuth && !accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error(`Job API returned non-JSON response: ${url}`);
      return null;
    }

    const responseData = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !responseData.success) {
      console.error(`Job API request failed: ${url}`, responseData);
      return null;
    }

    return responseData.data;
  } catch (error) {
    console.error(`Failed to fetch job API: ${url}`, error);
    return null;
  }
}

/**
 * Server-side job reads (RSC).
 * Client mutations stay in `apiRequests/job.ts`.
 */
const jobServerRequest = {
  /** UC-03.01 GET /api/jobs */
  getJobs(params: ViewListJobFilterType = {}) {
    return jobServerFetch<ViewListJobResponseType>(
      `/api/jobs${buildQueryString(params)}`,
    );
  },

  /** UC-03.02 GET /api/jobs/:slug */
  getJobDetail(slug: string) {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return Promise.resolve(null);
    return jobServerFetch<ViewJobDetailResType>(
      `/api/jobs/${encodeURIComponent(normalizedSlug)}`,
    );
  },

  /** UC-06.06 GET /api/manage-jobs/bookmarks */
  getBookmarkedJobs(params: ViewBookmarkedJobFilterType = {}) {
    return jobServerFetch<ViewBookmarkedJobResponseType>(
      `/api/manage-jobs/bookmarks${buildQueryString(params)}`,
      { requireAuth: true },
    );
  },

  getClientJobs(params: ViewListJobFilterType = {}) {
    return jobServerFetch<ViewListJobResponseType>(
      `/api/manage-jobs${buildQueryString(params)}`,
      { requireAuth: true },
    );
  },

  getClientJobDetail(jobId: number | string) {
    return jobServerFetch<ViewJobDetailResType>(
      `/api/manage-jobs/${encodeURIComponent(String(jobId))}`,
      { requireAuth: true },
    );
  },

  getBookmarkStatus(slug: string) {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug) return Promise.resolve(null);
    return jobServerFetch<{ isBookmarked: boolean }>(
      `/api/manage-jobs/jobs/${encodeURIComponent(normalizedSlug)}/bookmark`,
      { requireAuth: true },
    );
  },
};

export default jobServerRequest;
