import { cookies } from "next/headers";

import type {
  ApiResponse,
  MyProposalsQueryType,
  MyProposalsResponseType,
  ProposalDetailType,
} from "@shared/types";

import { envConfig } from "@/configs/validate-env";

async function proposalServerFetch<T>(path: string): Promise<T | null> {
  if (!envConfig?.NESTJS_API_URL) return null;
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("access_token")?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${envConfig.NESTJS_API_URL}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiResponse<T>;
    return response.ok && payload.success ? payload.data : null;
  } catch {
    return null;
  }
}

const proposalServerRequest = {
  getMyProposals(query: Partial<MyProposalsQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.jobId) params.set("jobId", String(query.jobId));
    if (query.status) params.set("status", query.status);
    const suffix = params.toString();
    return proposalServerFetch<MyProposalsResponseType>(
      `/api/proposals/my${suffix ? `?${suffix}` : ""}`,
    );
  },

  getProposalDetail(proposalId: number) {
    return proposalServerFetch<ProposalDetailType>(
      `/api/proposals/${proposalId}`,
    );
  },

  getMyActiveForJob(jobId: number) {
    return proposalServerFetch<import("@shared/types").ProposalType | null>(
      `/api/proposals/jobs/${jobId}/mine`,
    );
  },

  async getMyProposalForJob(jobId: number) {
    const result = await this.getMyProposals({ jobId, page: 1, limit: 50 });
    return (
      result?.data.find((proposal) =>
        ["DRAFT", "PENDING", "ACCEPTED", "REJECTED"].includes(proposal.status),
      ) ?? null
    );
  },
};

export default proposalServerRequest;
