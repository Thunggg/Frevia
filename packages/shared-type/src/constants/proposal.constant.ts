// Thời hạn xử lý một đề xuất đã gửi: sau 30 ngày không có hoạt động từ khách hàng,
// đề xuất chuyển sang EXPIRED (UC-32 — Proposal Management).
export const PROPOSAL_EXPIRY_DAYS = 30;

/** Mốc hết hạn của đề xuất, tính từ lần hoạt động gần nhất (gửi mới hoặc chuyển phỏng vấn). */
export function resolveProposalExpiryDate(from: Date): Date {
  return new Date(from.getTime() + PROPOSAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}
