import type {
  ApiResponse,
  ApproveMilestoneResponseType,
  ContractDetailType,
  ContractType,
  CreateContractBodyType,
  CreateMilestoneBodyType,
  GetContractListQueryType,
  GetContractListResponseType,
  GetMilestoneListQueryType,
  GetMilestoneListResponseType,
  GetSubmissionsResponseType,
  MilestoneSubmissionType,
  MilestoneType,
  RequestChangesBodyType,
  SubmitMilestoneBodyType,
  UpdateContractBodyType,
  UpdateMilestoneBodyType,
} from "@shared/types";

import { http } from "@/lib/http";

export const contractApiRequest = {
  // --- Contracts ---
  getContractList(query: Partial<GetContractListQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.status) params.set("status", query.status);
    const suffix = params.toString();
    return http.get<GetContractListResponseType>(
      `/api/contracts${suffix ? `?${suffix}` : ""}`,
    );
  },

  getContractDetail(contractId: number) {
    return http.get<ContractDetailType>(`/api/contracts/${contractId}`);
  },

  create(body: CreateContractBodyType) {
    return http.post<ContractType>("/api/contracts", body);
  },

  update(contractId: number, body: UpdateContractBodyType) {
    return http.patch<ContractType>(`/api/contracts/${contractId}`, body);
  },

  sign(contractId: number) {
    return http.patch<ContractType>(`/api/contracts/${contractId}/sign`, {});
  },

  complete(contractId: number) {
    return http.patch<ContractType>(`/api/contracts/${contractId}/complete`, {});
  },

  cancel(contractId: number) {
    return http.patch<ContractType>(`/api/contracts/${contractId}/cancel`, {});
  },

  // --- Milestones ---
  getMilestones(contractId: number, query: Partial<GetMilestoneListQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    if (query.status) params.set("status", query.status);
    const suffix = params.toString();
    return http.get<GetMilestoneListResponseType>(
      `/api/contracts/${contractId}/milestones${suffix ? `?${suffix}` : ""}`,
    );
  },

  getMilestoneDetail(contractId: number, milestoneId: number) {
    return http.get<MilestoneType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}`,
    );
  },

  createMilestone(contractId: number, body: CreateMilestoneBodyType) {
    return http.post<MilestoneType>(
      `/api/contracts/${contractId}/milestones`,
      body,
    );
  },

  updateMilestone(
    contractId: number,
    milestoneId: number,
    body: UpdateMilestoneBodyType,
  ) {
    return http.patch<MilestoneType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}`,
      body,
    );
  },

  deleteMilestone(contractId: number, milestoneId: number) {
    return http.delete<MilestoneType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}`,
    );
  },

  progressMilestone(contractId: number, milestoneId: number) {
    return http.patch<MilestoneType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}/progress`,
      {},
    );
  },

  // --- Submissions ---
  getSubmissions(contractId: number, milestoneId: number) {
    return http.get<GetSubmissionsResponseType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}/submissions`,
    );
  },

  submitMilestone(
    contractId: number,
    milestoneId: number,
    body: SubmitMilestoneBodyType,
  ) {
    return http.post<MilestoneSubmissionType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}/submissions`,
      body,
    );
  },

  approveSubmission(
    contractId: number,
    milestoneId: number,
    submissionId: number,
  ) {
    return http.patch<ApproveMilestoneResponseType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}/submissions/${submissionId}/approve`,
      {},
    );
  },

  requestChanges(
    contractId: number,
    milestoneId: number,
    submissionId: number,
    body: RequestChangesBodyType,
  ) {
    return http.patch<MilestoneSubmissionType>(
      `/api/contracts/${contractId}/milestones/${milestoneId}/submissions/${submissionId}/request-changes`,
      body,
    );
  },
};

export function extractContractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) return response.data;
  throw new Error("Unexpected contract API response");
}
