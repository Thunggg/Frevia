/**
 * Trạng thái tranh chấp dùng chung giữa dialog phân xử và danh sách tranh chấp.
 *
 * Tách ra đây để nhãn (namespace `disputeStatus`) và màu badge không bị lệch
 * nhau giữa hai bề mặt.
 */
export const DISPUTE_STATUS_KEYS = [
  "OPEN",
  "WAITING_RESPONSE",
  "UNDER_REVIEW",
  "DECISION_MADE",
  "REVIEW_REQUESTED",
  "FINALIZED",
  "CANCELLED",
] as const;

export function getDisputeStatusBadgeClass(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "WAITING_RESPONSE":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "UNDER_REVIEW":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    case "DECISION_MADE":
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
    case "REVIEW_REQUESTED":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "FINALIZED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";
  }
}
