"use client";

import { useLocale, useTranslations } from "next-intl";
import { ApiFail } from "@/lib/http";
import type {
  DisputeDetailType,
} from "@shared/types";

export function getDisputeApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiFail)) {
    return fallback;
  }
  const detailMessage = error.response.error.details?.[0]?.message;
  return detailMessage || error.response.error.message || fallback;
}

const REASON_LABEL_TO_KEY: Record<string, string> = {
  "Deliverable does not match agreed requirements": "QUALITY_NOT_AS_DESCRIBED",
  "Missed deadline or unresponsive freelancer": "MISSED_DEADLINE",
  "Offer a deadline extension": "EXTEND_DELIVERY",
  "Mutual cancellation / project scope changed": "CLIENT_MUTUAL_CANCELLATION",
  "Request a delivery deadline extension": "NEED_MORE_TIME",
  "Client requested work outside original scope": "SCOPE_CREEP",
  "Client is unresponsive or delaying approval": "CLIENT_UNRESPONSIVE",
  "Unable to complete milestone (mutual cancellation)":
    "FREELANCER_MUTUAL_CANCELLATION",
};

function toIntlLocale(locale?: string): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function formatResolutionCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export function formatResolutionDate(
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

export function formatResolutionDateTime(
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

export function useResolutionHelpers() {
  const t = useTranslations("resolutionCenter");
  const locale = useLocale();

  const formatDate = (date: string | Date | null | undefined) =>
    formatResolutionDate(date, locale);

  const formatDateTime = (date: string | Date | null | undefined) =>
    formatResolutionDateTime(date, locale);

  const getTypeLabel = (type?: string | null): string => {
    switch (type) {
      case "EXTEND_DEADLINE":
        return t("resolutionTypes.EXTEND_DEADLINE");
      case "PARTIAL_REFUND":
        return t("resolutionTypes.PARTIAL_REFUND");
      case "FULL_REFUND":
        return t("resolutionTypes.FULL_REFUND");
      case "FULL_RELEASE":
        return t("resolutionTypes.FULL_RELEASE");
      default:
        return t("resolutionTypes.DEFAULT");
    }
  };

  const getCountdown = (
    deadline: string | Date | null | undefined,
  ): { label: string; isExpired: boolean } => {
    if (!deadline) return { label: "—", isExpired: false };
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: t("countdown.expired"), isExpired: true };
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      label: t("countdown.remaining", { hours, minutes }),
      isExpired: false,
    };
  };

  const translateStoredReason = (reason?: string | null): string => {
    if (!reason) return "";
    const key = REASON_LABEL_TO_KEY[reason];
    if (!key) return reason;
    const labelKey = `reasons.${key}.label` as const;
    return t.has(labelKey) ? t(labelKey) : reason;
  };

  return {
    formatDate,
    formatDateTime,
    getTypeLabel,
    getCountdown,
    translateStoredReason,
  };
}

export function DisputeStatusBadge({
  status,
  declinedAt,
}: {
  status: DisputeDetailType["status"];
  declinedAt?: string | Date | null;
}) {
  const t = useTranslations("resolutionCenter.statuses");

  if ((status === "OPEN" || status === "WAITING_RESPONSE") && declinedAt) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
        {t("DECLINED_ESCALATE")}
      </span>
    );
  }

  switch (status) {
    case "OPEN":
    case "WAITING_RESPONSE":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          {t("WAITING_RESPONSE")}
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 text-[11px] font-medium text-[#0069D3] dark:text-sky-300">
          {t("UNDER_REVIEW")}
        </span>
      );
    case "DECISION_MADE":
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
          {t("DECISION_MADE")}
        </span>
      );
    case "REVIEW_REQUESTED":
      return (
        <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950/50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700 dark:text-orange-300">
          {t("REVIEW_REQUESTED")}
        </span>
      );
    case "FINALIZED":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
          {t("FINALIZED")}
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          {t("CANCELLED")}
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
