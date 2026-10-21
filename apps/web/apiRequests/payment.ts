import { http } from "@/lib/http";
import type {
  CreatePaymentIntentResponseType,
  DisputeSettlementBodyType,
  DisputeSettlementResponseType,
  GetTransactionListQueryType,
  GetTransactionListResponseType,
  RefundMilestoneResponseType,
  ReleaseMilestoneResponseType,
  StripeConnectStatusResponseType,
  StripeOnboardingLinkResponseType,
} from "@shared/types";

export const paymentApiRequest = {
  /**
   * Tạo link Onboarding Stripe Connect Express cho Freelancer / Expert
   */
  getOnboardingLink(returnUrl?: string) {
    return http.post<StripeOnboardingLinkResponseType>(
      "/payments/connect/onboarding-link",
      { returnUrl },
    );
  },

  /**
   * Kiểm tra trạng thái liên kết tài khoản Stripe Connect
   */
  getConnectStatus() {
    return http.get<StripeConnectStatusResponseType>(
      "/payments/connect/status",
    );
  },

  /**
   * Tạo PaymentIntent thanh toán phí nền tảng hợp đồng ($10)
   */
  createPlatformFeeIntent(contractId: number) {
    return http.post<CreatePaymentIntentResponseType>(
      `/payments/contracts/${contractId}/platform-fee/intent`,
      {},
    );
  },

  /**
   * Tạo PaymentIntent nạp tiền ký quỹ (Escrow deposit) cho Milestone
   */
  createMilestoneFundIntent(contractId: number, milestoneId: number) {
    return http.post<CreatePaymentIntentResponseType>(
      `/payments/contracts/${contractId}/milestones/${milestoneId}/fund/intent`,
      {},
    );
  },

  /**
   * Giải ngân tiền Milestone cho Freelancer (Payout via Stripe Transfer)
   */
  releaseMilestone(contractId: number, milestoneId: number) {
    return http.post<ReleaseMilestoneResponseType>(
      `/payments/contracts/${contractId}/milestones/${milestoneId}/release`,
      {},
    );
  },

  /**
   * Hoàn tiền Milestone ký quỹ về lại thẻ của Client
   */
  refundMilestone(contractId: number, milestoneId: number) {
    return http.post<RefundMilestoneResponseType>(
      `/payments/contracts/${contractId}/milestones/${milestoneId}/refund`,
      {},
    );
  },

  /**
   * Tạo PaymentIntent thanh toán phí giải quyết tranh chấp (Dispute fee)
   */
  createDisputeFeeIntent(disputeId: number) {
    return http.post<CreatePaymentIntentResponseType>(
      `/payments/disputes/${disputeId}/fee/intent`,
      {},
    );
  },

  /**
   * Phân chia tiền và hoàn tất tranh chấp (Admin hoặc Expert trọng tài)
   */
  settleDispute(disputeId: number, body: DisputeSettlementBodyType) {
    return http.post<DisputeSettlementResponseType>(
      `/payments/disputes/${disputeId}/settle`,
      body,
    );
  },

  /**
   * Tra cứu lịch sử giao dịch thanh toán
   */
  getTransactions(query: Partial<GetTransactionListQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.type) params.append("type", query.type);
    if (query.status) params.append("status", query.status);
    if (query.contractId) params.append("contractId", query.contractId.toString());
    const qs = params.toString();
    return http.get<GetTransactionListResponseType>(
      `/payments/transactions${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * Đồng bộ ngay trạng thái PaymentIntent với cơ sở dữ liệu
   */
  syncPaymentIntent(paymentIntentId: string) {
    return http.post<{ success: boolean; status: string }>(
      `/payments/intents/${paymentIntentId}/sync`,
      {},
    );
  },
};

