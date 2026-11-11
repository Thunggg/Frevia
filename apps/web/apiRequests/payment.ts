import { http } from "@/lib/http";
import type {
  ChargeSavedCardResponseType,
  CreateCheckoutSessionResponseType,
  CreateContractHoldResponseType,
  CreateCustomerPortalSessionResponseType,
  CreatePaymentIntentResponseType,
  CreateSetupIntentResponseType,
  CreateWithdrawalBodyType,
  CreateWithdrawalResponseType,
  DisputeSettlementBodyType,
  DisputeSettlementResponseType,
  GetSavedPaymentMethodsResponseType,
  GetTransactionListQueryType,
  GetTransactionListResponseType,
  GetWithdrawalListQueryType,
  GetWithdrawalListResponseType,
  PaymentMethodActionResponseType,
  ProcessWithdrawalBodyType,
  RefundMilestoneResponseType,
  ReleaseMilestoneResponseType,
  StripeConnectStatusResponseType,
  StripeOnboardingLinkResponseType,
  SyncCheckoutSessionResponseType,
  WalletSummaryResponseType,
  WithdrawalRequestType,
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
   * Bước 1 (Authorize / Hold): Tạo PaymentIntent giữ tiền (capture_method: manual)
   * cho ít nhất 1 milestone (hoặc toàn bộ) + 3% phí trên tổng giá trị hợp đồng.
   */
  createContractHoldIntent(contractId: number, milestoneIds: number[]) {
    return http.post<CreateContractHoldResponseType>(
      `/payments/contracts/${contractId}/fund-hold/intent`,
      { milestoneIds },
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
   * Tạo Stripe Checkout Session nạp tiền ký quỹ (Escrow deposit) cho Milestone
   */
  createMilestoneFundCheckoutSession(contractId: number, milestoneId: number) {
    return http.post<CreateCheckoutSessionResponseType>(
      `/payments/contracts/${contractId}/milestones/${milestoneId}/fund/checkout-session`,
      {},
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

  /**
   * Đồng bộ ngay trạng thái Checkout Session với cơ sở dữ liệu
   */
  syncCheckoutSession(sessionId: string) {
    return http.post<SyncCheckoutSessionResponseType>(
      `/payments/checkout-sessions/${sessionId}/sync`,
      {},
    );
  },

  /**
   * Lấy danh sách các thẻ đã lưu của người dùng
   */
  getSavedPaymentMethods() {
    return http.get<GetSavedPaymentMethodsResponseType>(
      "/payments/payment-methods",
    );
  },

  /**
   * Tạo SetupIntent để thêm thẻ mới qua Stripe Elements
   */
  createSetupIntent() {
    return http.post<CreateSetupIntentResponseType>(
      "/payments/payment-methods/setup-intent",
      {},
    );
  },

  /**
   * Đặt một thẻ đã lưu làm phương thức thanh toán mặc định
   */
  setDefaultPaymentMethod(paymentMethodId: string) {
    return http.post<PaymentMethodActionResponseType>(
      "/payments/payment-methods/default",
      { paymentMethodId },
    );
  },

  /**
   * Xóa một thẻ thanh toán đã lưu
   */
  removePaymentMethod(paymentMethodId: string) {
    return http.delete<PaymentMethodActionResponseType>(
      `/payments/payment-methods/${encodeURIComponent(paymentMethodId)}`,
    );
  },

  /**
   * Tạo session chuyển hướng sang Stripe Customer Portal (đổi thẻ, quản lý thẻ)
   */
  getCustomerPortalLink(returnUrl?: string) {
    return http.post<CreateCustomerPortalSessionResponseType>(
      "/payments/customer-portal",
      { returnUrl },
    );
  },

  /**
   * Thanh toán nạp tiền ký quỹ (Escrow) 1-Click bằng thẻ đã lưu
   */
  fundMilestoneWithSavedCard(
    contractId: number,
    milestoneId: number,
    paymentMethodId?: string,
  ) {
    return http.post<ChargeSavedCardResponseType>(
      `/payments/contracts/${contractId}/milestones/${milestoneId}/fund/saved-card`,
      { paymentMethodId },
    );
  },

  /**
   * Lấy số dư ví nội bộ và thống kê thu nhập/rút tiền
   */
  getWalletSummary() {
    return http.get<WalletSummaryResponseType>("/payments/wallet");
  },

  /**
   * Lấy danh sách yêu cầu rút tiền có phân trang
   */
  getWithdrawals(query: Partial<GetWithdrawalListQueryType> = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.status) params.append("status", query.status);
    const qs = params.toString();
    return http.get<GetWithdrawalListResponseType>(
      `/payments/withdrawals${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * Tạo yêu cầu rút tiền từ ví nội bộ (Bank Transfer hoặc Stripe Express)
   */
  requestWithdrawal(body: CreateWithdrawalBodyType) {
    return http.post<CreateWithdrawalResponseType>(
      "/payments/withdrawals",
      body,
    );
  },

  /**
   * [Admin] Xử lý duyệt hoặc từ chối yêu cầu rút tiền ngân hàng
   */
  processWithdrawal(withdrawalId: number, body: ProcessWithdrawalBodyType) {
    return http.post<WithdrawalRequestType>(
      `/payments/withdrawals/${withdrawalId}/process`,
      body,
    );
  },
};

