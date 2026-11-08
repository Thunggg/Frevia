import type { ContractDetailType } from "@shared/types";

export type ContractStatus = ContractDetailType["status"];

export const CONTRACT_STATUSES = [
  "ACTIVE",
  "PENDING_SIGN",
  "AWAITING_PAYMENT",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REJECTED",
  "EXPIRED",
] as const;

export function getStatusBadgeConfig(status: ContractStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-emerald-700 dark:text-emerald-400";
    case "PENDING_SIGN":
      return "text-amber-700 dark:text-amber-400";
    case "AWAITING_PAYMENT":
      return "text-indigo-700 dark:text-indigo-400";
    case "COMPLETED":
      return "text-[#0069D3] dark:text-blue-400";
    case "CANCELLED":
    case "REJECTED":
    case "EXPIRED":
      return "text-zinc-600 dark:text-zinc-400";
    case "DISPUTED":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}
