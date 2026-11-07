import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type { ApiResponse, JobAlertType } from "@shared/types";

async function jobAlertServerFetch<T>(url: string): Promise<T | null> {
  if (!envConfig?.NESTJS_API_URL) return null;

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("access_token")?.value;

  if (!accessToken) return null;

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${url}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    const responseData = (await response.json()) as ApiResponse<T>;

    return response.ok && responseData.success ? responseData.data : null;
  } catch {
    return null;
  }
}

const jobAlertServerRequest = {
  getJobAlerts() {
    return jobAlertServerFetch<JobAlertType[]>("/api/job-alerts");
  },

  getJobAlertDetail(id: number) {
    return jobAlertServerFetch<JobAlertType>(`/api/job-alerts/${id}`);
  },
};

export default jobAlertServerRequest;
