import type {
  ApiResponse,
  ClientJobProposalsPageType,
  ClientProposalDetailType,
  CreateProposalBodyType,
  MyProposalsQueryType,
  MyProposalsResponseType,
  ProposalDetailType,
  ProposalStatusType,
  ProposalType,
  SaveProposalDraftBodyType,
  SubmittedProposalStatusType,
} from "@shared/types";

import { http } from "@/lib/http";

export const proposalApiRequest = {
  getClientJobProposals(
    jobId: number,
    query: {
      page?: number;
      limit?: number;
      status?: SubmittedProposalStatusType;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.status) params.set("status", query.status);
    const suffix = params.toString();
    return http.get<ClientJobProposalsPageType>(
      `/api/jobs/${jobId}/proposals${suffix ? `?${suffix}` : ""}`,
    );
  },

  create(jobId: number, body: CreateProposalBodyType) {
    return http.post<ProposalType>(`/api/proposals/jobs/${jobId}`, body);
  },

  saveDraft(jobId: number, body: SaveProposalDraftBodyType) {
    return http.post<ProposalType>(`/api/proposals/jobs/${jobId}/drafts`, body);
  },

  updateDraft(proposalId: number, body: SaveProposalDraftBodyType) {
    return http.patch<ProposalType>(`/api/proposals/${proposalId}/draft`, body);
  },

  submitDraft(proposalId: number) {
    return http.patch<ProposalType>(`/api/proposals/${proposalId}/submit`, {});
  },

  withdraw(proposalId: number) {
    return http.patch<ProposalType>(
      `/api/proposals/${proposalId}/withdraw`,
      {},
    );
  },

  reject(proposalId: number) {
    return http.patch<ProposalType>(`/api/proposals/${proposalId}/reject`, {});
  },

  // Khách hàng phản hồi và bắt đầu phỏng vấn/trao đổi với freelancer.
  interview(proposalId: number) {
    return http.patch<ProposalType>(
      `/api/proposals/${proposalId}/interview`,
      {},
    );
  },

  accept(proposalId: number) {
    return http.patch<ProposalType>(`/api/proposals/${proposalId}/accept`, {});
  },

  getMyProposals(query: Partial<MyProposalsQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.jobId) params.set("jobId", String(query.jobId));
    if (query.status) params.set("status", query.status);
    const suffix = params.toString();
    return http.get<MyProposalsResponseType>(
      `/api/proposals/my${suffix ? `?${suffix}` : ""}`,
    );
  },

  getDetail(proposalId: number) {
    return http.get<ProposalDetailType>(`/api/proposals/${proposalId}`);
  },

  getClientDetail(proposalId: number) {
    return http.get<ClientProposalDetailType>(
      `/api/proposals/${proposalId}/client`,
    );
  },

  getMyActiveForJob(jobId: number) {
    return http.get<ProposalType | null>(`/api/proposals/jobs/${jobId}/mine`);
  },

  async getMyProposalForJob(jobId: number) {
    const response = await this.getMyProposals({ jobId, page: 1, limit: 50 });
    const result = extractProposalData(response);
    // Giữ lại đề xuất đang có hiệu lực với job để hiển thị trạng thái trên trang job.
    const visibleStatuses: ProposalStatusType[] = [
      "DRAFT",
      "SUBMITTED",
      "INTERVIEWING",
      "HIRED",
      "REJECTED",
    ];
    return (
      result.data.find((proposal) =>
        visibleStatuses.includes(proposal.status),
      ) ?? null
    );
  },
};

export function extractProposalData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) return response.data;
  throw new Error("Unexpected proposal API response");
}
