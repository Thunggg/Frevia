import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ForumAdminStatsType,
  ForumPostListResponseType,
  ForumAdminCommentListResponseType,
  ForumReportListResponseType,
} from "@shared/types";
import { cookies } from "next/headers";

function buildQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

async function adminFetch<T>(url: string): Promise<T | null> {
  const accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}

export async function getAdminStatsServer(): Promise<ForumAdminStatsType | null> {
  return adminFetch<ForumAdminStatsType>("/api/forums/admin/stats");
}

export async function getAdminPostsServer(
  page: number = 1,
  limit: number = 10,
  search?: string,
  categoryId?: number,
): Promise<ForumPostListResponseType> {
  const query = buildQueryString({ page, limit, search, categoryId });
  const result = await adminFetch<ForumPostListResponseType>(
    `/api/forums/posts${query}`,
  );
  return result ?? { posts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
}

export async function getAdminCommentsServer(
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<ForumAdminCommentListResponseType> {
  const query = buildQueryString({ page, limit, search });
  const result = await adminFetch<ForumAdminCommentListResponseType>(
    `/api/forums/admin/comments${query}`,
  );
  return result ?? { comments: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
}

export async function getAdminReportsServer(
  page: number = 1,
  limit: number = 10,
  status?: string,
  search?: string,
): Promise<ForumReportListResponseType> {
  const query = buildQueryString({ page, limit, status, search });
  const result = await adminFetch<ForumReportListResponseType>(
    `/api/forums/reports${query}`,
  );
  return result ?? { reports: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
}
