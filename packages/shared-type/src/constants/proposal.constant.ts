// Thời hạn xử lý một đề xuất đã gửi: sau 30 ngày không có hoạt động từ khách hàng,
// đề xuất chuyển sang EXPIRED (UC-32 — Proposal Management).
export const PROPOSAL_EXPIRY_DAYS = 30;

export const MIN_PROPOSAL_BID_AMOUNT = 5;
export const MAX_PROPOSAL_BID_AMOUNT = 1_000_000_000_000;
export const MIN_PROPOSAL_DELIVERY_DAYS = 1;
export const MAX_PROPOSAL_DELIVERY_DAYS = 365;
export const MAX_PROPOSALS_PER_JOB_PER_FREELANCER = 3;

/** Mốc hết hạn của đề xuất, tính từ lần hoạt động gần nhất (gửi mới hoặc chuyển phỏng vấn). */
export function resolveProposalExpiryDate(from: Date): Date {
  return new Date(from.getTime() + PROPOSAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}
