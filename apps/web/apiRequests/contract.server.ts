import "server-only";

import { cookies } from "next/headers";

import { envConfig } from "@/configs/validate-env";
import type {
  ApiResponse,
  ContractDetailType,
  GetContractListQueryType,
  GetContractListResponseType,
  GetMilestoneListQueryType,
  GetMilestoneListResponseType,
  GetSharedFilesResponseType,
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

async function contractServerFetch<T>(
  url: string,
  options: ServerFetchOptions = {},
): Promise<T | null> {
  const { requireAuth = true } = options;

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
      console.error(`Contract API returned non-JSON response: ${url}`);
      return null;
    }

    const responseData = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !responseData.success) {
      console.error(`Contract API request failed: ${url}`, responseData);
      return null;
    }

    return responseData.data;
  } catch (error) {
    console.error(`Failed to fetch contract API: ${url}`, error);
    return null;
  }
}

/**
 * Server-side contract reads (RSC).
 * Client mutations stay in `apiRequests/contract.ts`.
 */
const contractServerRequest = {
  getContracts(params: Partial<GetContractListQueryType> = {}) {
    return contractServerFetch<GetContractListResponseType>(
      `/api/contracts${buildQueryString(params)}`,
    );
  },

  getContractDetail(contractId: number) {
    return contractServerFetch<ContractDetailType>(
      `/api/contracts/${encodeURIComponent(String(contractId))}`,
    );
  },

  getMilestones(
    contractId: number,
    params: Partial<GetMilestoneListQueryType> = {},
  ) {
    return contractServerFetch<GetMilestoneListResponseType>(
      `/api/contracts/${encodeURIComponent(String(contractId))}/milestones${buildQueryString(params)}`,
    );
  },

  getSharedFiles(contractId: number) {
    return contractServerFetch<GetSharedFilesResponseType>(
      `/api/contracts/${encodeURIComponent(String(contractId))}/files`,
    );
  },
};

export default contractServerRequest;
