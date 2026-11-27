import { http } from "@/lib/http";
import type {
  CreateDisputeBodyType,
  DisputeDetailType,
  DisputeFileType,
  RespondDisputeBodyType,
} from "@shared/types";

export const disputeApiRequest = {
  /**
   * Lấy danh sách yêu cầu giải quyết / tranh chấp của tôi (Client / Freelancer)
   */
  getMyDisputes(
    query: {
      page?: number;
      limit?: number;
      status?: string;
      contractId?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.status) params.append("status", query.status);
    if (query.contractId) params.append("contractId", query.contractId.toString());
    const qs = params.toString();
    return http.get<{
      data: DisputeDetailType[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/disputes${qs ? `?${qs}` : ""}`);
  },

  /**
   * API 2: Mở yêu cầu Resolution Center mới cho một Milestone
   */
  createDispute(body: CreateDisputeBodyType) {
    return http.post<DisputeDetailType>("/disputes", body);
  },

  /**
   * Upload tệp bằng chứng cho tranh chấp (tối đa 5 tệp, lưu bảng DisputeFile, bất biến không thể sửa/xóa)
   */
  uploadEvidenceFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return http.post<DisputeFileType>("/disputes/files/upload", formData);
  },

  /**
   * API 3: Lấy chi tiết theo disputeId
   */
  getDisputeDetail(disputeId: number) {
    return http.get<DisputeDetailType>(`/disputes/${disputeId}`);
  },

  /**
   * Lấy chi tiết theo milestoneId
   */
  getByMilestoneId(milestoneId: number) {
    return http.get<DisputeDetailType>(`/disputes/milestone/${milestoneId}`);
  },

  /**
   * API 4: Bên còn lại phản hồi yêu cầu (ACCEPT hoặc DECLINE kèm lý do)
   */
  respondToDispute(disputeId: number, body: RespondDisputeBodyType) {
    return http.patch<DisputeDetailType>(`/disputes/${disputeId}/respond`, body);
  },

  /**
   * API 5: Người tạo rút lại yêu cầu
   */
  withdrawDispute(disputeId: number) {
    return http.patch<DisputeDetailType>(`/disputes/${disputeId}/withdraw`, {});
  },

  /**
   * API 6: Gửi khiếu nại leo thang lên Chuyên gia (Expert) khi bị Decline hoặc quá 48h
   */
  escalateDispute(disputeId: number) {
    return http.post<DisputeDetailType>(`/disputes/${disputeId}/escalate`, {});
  },

  /**
   * API 7 (Expert): Lấy danh sách tranh chấp
   */
  expertListDisputes(
    query: { page?: number; limit?: number; status?: string } = {},
  ) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.status) params.append("status", query.status);
    const qs = params.toString();
    return http.get<{
      data: DisputeDetailType[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/expert/disputes${qs ? `?${qs}` : ""}`);
  },

  /**
   * API 7 (Expert): Lấy chi tiết tranh chấp
   */
  expertGetDisputeDetail(disputeId: number) {
    return http.get<DisputeDetailType>(`/expert/disputes/${disputeId}`);
  },

  /**
   * API 7 (Expert): Đưa ra phán quyết sơ bộ (DECISION_MADE)
   */
  expertMakeDecision(
    disputeId: number,
    body: {
      freelancerAmount: number;
      clientAmount: number;
      decisionReason: string;
    },
  ) {
    return http.post<DisputeDetailType>(
      `/expert/disputes/${disputeId}/decision`,
      body,
    );
  },

  /**
   * API 7 (Expert): Đưa ra phán quyết cuối cùng (FINALIZED)
   */
  expertFinalDecision(
    disputeId: number,
    body: {
      freelancerAmount: number;
      clientAmount: number;
      decisionReason: string;
    },
  ) {
    return http.post<DisputeDetailType>(
      `/expert/disputes/${disputeId}/final-decision`,
      body,
    );
  },
};
