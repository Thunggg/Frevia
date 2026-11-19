"use client";

import { useTranslations } from "next-intl";
import type { TransactionType } from "@shared/types";

function toIntlLocale(locale?: string): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

export function formatShortDate(
  date: string | Date | null | undefined,
  locale?: string,
): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale?: string,
): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function usePaymentTypeLabel() {
  const t = useTranslations("payments");

  return (type: TransactionType["type"]): string => {
    switch (type) {
      case "ESCROW_DEPOSIT":
        return t("types.ESCROW_DEPOSIT");
      case "MILESTONE_PAYOUT":
        return t("types.MILESTONE_PAYOUT");
      case "PLATFORM_FEE":
        return t("types.PLATFORM_FEE");
      case "DISPUTE_FEE":
        return t("types.DISPUTE_FEE");
      case "REFUND":
        return t("types.REFUND");
      case "ARBITRATOR_PAYOUT":
        return t("types.ARBITRATOR_PAYOUT");
      default:
        return type;
    }
  };
}

export function TransactionStatusPill({
  status,
  type,
}: {
  status: TransactionType["status"];
  type: TransactionType["type"];
}) {
  const t = useTranslations("payments");

  if (type === "REFUND" && status === "SUCCEEDED") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-300">
        {t("statuses.REFUNDED")}
      </span>
    );
  }

  switch (status) {
    case "SUCCEEDED":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          {t("statuses.PAID")}
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          {t("statuses.PENDING")}
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300">
          {t("statuses.FAILED")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          {status}
        </span>
      );
  }
}

