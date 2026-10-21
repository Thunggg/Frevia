import { http } from "@/lib/http";
import type {
  CreateDisputeBodyType,
  DisputeDetailType,
  PayDisputeFeeBodyType,
  ReviewDisputeDecisionBodyType,
  SubmitDisputeResponseBodyType,
} from "@shared/types";

export const disputeApiRequest = {
  /**
   * Lấy danh sách tranh chấp của tôi (Freelancer / Client)
   */
  getMyDisputes(query: { page?: number; limit?: number; status?: string } = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.status) params.append("status", query.status);
    const qs = params.toString();
    return http.get<{
      data: DisputeDetailType[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/disputes${qs ? `?${qs}` : ""}`);
  },

  /**
   * Mở tranh chấp mới cho một Milestone
   */
  createDispute(body: CreateDisputeBodyType) {
    return http.post<DisputeDetailType>("/disputes", body);
  },

  /**
   * Lấy chi tiết Dispute theo disputeId
   */
  getDisputeDetail(disputeId: number) {
    return http.get<DisputeDetailType>(`/disputes/${disputeId}`);
  },

  /**
   * Lấy chi tiết Dispute theo milestoneId
   */
  getByMilestoneId(milestoneId: number) {
    return http.get<DisputeDetailType>(`/disputes/milestone/${milestoneId}`);
  },

  /**
   * Thanh toán phí tranh chấp / phí trọng tài
   */
  payFee(disputeId: number, body: PayDisputeFeeBodyType = {}) {
    return http.post<{ success: boolean; fee: unknown }>(
      `/disputes/${disputeId}/fee`,
      body,
    );
  },

  /**
   * Respondent phản hồi tranh chấp và gửi kèm bằng chứng (chỉ 1 lần duy nhất)
   */
  submitResponse(disputeId: number, body: SubmitDisputeResponseBodyType) {
    return http.post<DisputeDetailType>(`/disputes/${disputeId}/response`, body);
  },

  /**
   * Chấp thuận (ACCEPT) hoặc Từ chối (REJECT kèm lý do) quyết định phân xử
   */
  submitDecisionReview(
    disputeId: number,
    body: ReviewDisputeDecisionBodyType,
  ) {
    return http.post<DisputeDetailType>(`/disputes/${disputeId}/review`, body);
  },

  /**
   * Admin: Lấy danh sách tranh chấp
   */
  adminListDisputes(query: { page?: number; limit?: number; status?: string } = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.status) params.append("status", query.status);
    const qs = params.toString();
    return http.get<{ data: DisputeDetailType[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/admin/disputes${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * Admin: Lấy chi tiết tranh chấp
   */
  adminGetDisputeDetail(disputeId: number) {
    return http.get<DisputeDetailType>(`/admin/disputes/${disputeId}`);
  },

  /**
   * Admin: Đưa ra quyết định sơ bộ (DECISION_MADE)
   */
  adminMakeDecision(
    disputeId: number,
    body: { freelancerAmount: number; clientAmount: number; decisionReason: string },
  ) {
    return http.post<DisputeDetailType>(`/admin/disputes/${disputeId}/decision`, body);
  },

  /**
   * Admin: Đưa ra quyết định cuối cùng (FINALIZED)
   */
  adminFinalDecision(
    disputeId: number,
    body: { freelancerAmount: number; clientAmount: number; decisionReason: string },
  ) {
    return http.post<DisputeDetailType>(`/admin/disputes/${disputeId}/final-decision`, body);
  },
};
