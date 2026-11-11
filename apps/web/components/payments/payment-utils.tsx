import type { TransactionType } from "@shared/types";

export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getTransactionTypeLabel(type: TransactionType["type"]): string {
  switch (type) {
    case "ESCROW_DEPOSIT":
      return "Escrow Deposit";
    case "MILESTONE_PAYOUT":
      return "Milestone Payout";
    case "PLATFORM_FEE":
      return "Platform Fee";
    case "DISPUTE_FEE":
      return "Dispute Fee";
    case "REFUND":
      return "Refund";
    case "ARBITRATOR_PAYOUT":
      return "Arbitrator Payout";
    default:
      return type;
  }
}

export function TransactionStatusPill({
  status,
  type,
}: {
  status: TransactionType["status"];
  type: TransactionType["type"];
}) {
  if (type === "REFUND" && status === "SUCCEEDED") {
    return (
      <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-300">
        Refunded
      </span>
    );
  }

  switch (status) {
    case "SUCCEEDED":
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Paid
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
          Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {status}
        </span>
      );
  }
}

