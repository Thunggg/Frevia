"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  Gavel,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName } from "@shared/types";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { expertProfileApi } from "@/apiRequests/expert-profile";
import { useActionPermission } from "@/hooks/use-action-permission";
import { useMe } from "@/hooks/use-auth";
import {
  DisputeStatusBadge,
  formatResolutionCurrency,
  useResolutionHelpers,
} from "@/app/(client)/_components/disputes/resolution-utils";
import { ExpertDisputeDetail } from "./expert-dispute-detail";

const STATUS_FILTERS = [
  { key: "", labelKey: "all" },
  { key: "UNDER_REVIEW", labelKey: "statuses.UNDER_REVIEW" },
  { key: "REVIEW_REQUESTED", labelKey: "statuses.REVIEW_REQUESTED" },
  { key: "DECISION_MADE", labelKey: "statuses.DECISION_MADE" },
  { key: "WAITING_RESPONSE", labelKey: "statuses.WAITING_RESPONSE" },
  { key: "FINALIZED", labelKey: "statuses.FINALIZED" },
  { key: "CANCELLED", labelKey: "statuses.CANCELLED" },
] as const;

export function ExpertDisputes() {
  const t = useTranslations("expertDisputes");
  const { formatDate, getTypeLabel, translateStoredReason } =
    useResolutionHelpers();
  const { data: me, isLoading: isMeLoading } = useMe();
  const { can } = useActionPermission();

  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const isExpertRole = Boolean(
    me?.roles?.some((r) => r.name === RoleName.EXPERT),
  );
  const canViewDisputes = can("GET", "/api/expert/disputes");

  const profileQuery = useQuery({
    queryKey: ["expert-profile"],
    queryFn: () => expertProfileApi.getMine().then((res) => res.data),
    enabled: isExpertRole && canViewDisputes,
    retry: false,
  });

  const isActiveExpert = profileQuery.data?.isActive === true;

  const listQuery = useQuery({
    queryKey: ["expert-disputes", status, page],
    enabled: isExpertRole && canViewDisputes && isActiveExpert,
    queryFn: async () => {
      const res = await disputeApiRequest.expertListDisputes({
        page,
        limit: 10,
        ...(status ? { status } : {}),
      });
      return res.data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["expert-dispute", selectedId],
    enabled:
      isExpertRole &&
      canViewDisputes &&
      isActiveExpert &&
      selectedId !== null,
    queryFn: async () => {
      if (selectedId === null) return null;
      const res = await disputeApiRequest.expertGetDisputeDetail(selectedId);
      return res.data;
    },
  });

  if (isMeLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  // Non-Expert users (e.g. Admin without Expert role) see a clear role notice
  if (!isExpertRole || !canViewDisputes) {
    return (
      <div className="space-y-6">
        <header className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0069D3]/10 text-[#0069D3] dark:text-sky-300">
            <Scale className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 text-center space-y-2.5">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-sm font-medium text-foreground">
            {t("expertOnlyTitle")}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t("expertOnlyDesc")}
          </p>
        </div>
      </div>
    );
  }

  // Loading expert profile
  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  // Inactive expert profile notice with direct link to /admin/profile
  if (profileQuery.data && !profileQuery.data.isActive) {
    return (
      <div className="space-y-6">
        <header className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0069D3]/10 text-[#0069D3] dark:text-sky-300">
            <Scale className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-10 text-center space-y-3">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="text-sm font-medium text-foreground">
            {t("inactiveProfileTitle")}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t("inactiveProfileDesc")}
          </p>
          <div className="pt-1">
            <Button asChild size="sm" className="h-8 rounded-lg text-xs">
              <Link href="/admin/profile">{t("goToProfile")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Case Detail View
  if (selectedId !== null) {
    if (detailQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      );
    }

    if (detailQuery.error || !detailQuery.data) {
      return (
        <div className="rounded-2xl border border-destructive/30 bg-white dark:bg-zinc-950 p-6 space-y-3">
          <p className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="size-4" />
            {t("loadFailed")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void detailQuery.refetch()}
              className="h-8 rounded-lg text-xs cursor-pointer"
            >
              {t("retry")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
              className="h-8 rounded-lg text-xs cursor-pointer"
            >
              {t("back")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <ExpertDisputeDetail
        dispute={detailQuery.data}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const disputes = listQuery.data?.data ?? [];
  const totalItems = listQuery.data?.pagination?.total ?? 0;
  const totalPages = listQuery.data?.pagination?.totalPages ?? 1;
  const loadError = profileQuery.error || listQuery.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0069D3]/10 text-[#0069D3] dark:text-sky-300">
          <Scale className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </header>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {t("loadFailed")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void (profileQuery.error
                ? profileQuery.refetch()
                : listQuery.refetch())
            }
            className="h-7 rounded-lg text-xs cursor-pointer"
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
        {/* Top Bar: Pill Filter Tabs & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted scrollbar-none">
            {STATUS_FILTERS.map((tab) => {
              const isActive = status === tab.key;
              return (
                <button
                  key={tab.key || "ALL"}
                  type="button"
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex h-6 cursor-pointer items-center whitespace-nowrap rounded-full px-3 text-xs transition-all ${isActive
                      ? "bg-background font-medium text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">
              {t("casesCount", { count: totalItems })}
            </span>
            <button
              type="button"
              onClick={() => void listQuery.refetch()}
              disabled={listQuery.isLoading || listQuery.isRefetching}
              aria-label={t("refreshAria")}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 ${listQuery.isLoading || listQuery.isRefetching
                    ? "animate-spin"
                    : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-muted-foreground">
                <th className="px-3 py-2.5 font-normal">{t("colCase")}</th>
                <th className="px-3 py-2.5 font-normal">
                  {t("colMilestoneReason")}
                </th>
                <th className="px-3 py-2.5 font-normal">{t("colProposal")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colParties")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colEscrow")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colOpened")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colStatus")}</th>
                <th className="px-3 py-2.5 text-right font-normal">
                  {t("colAction")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {listQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-14 text-center text-muted-foreground"
                  >
                    <Loader2 className="size-4 animate-spin mx-auto mb-2" />
                    <span>{t("loading")}</span>
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto space-y-1.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground mb-1">
                        <Scale className="size-4" />
                      </div>
                      <p className="text-sm text-foreground">{t("empty")}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("emptyHint")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                disputes.map((item) => {
                  const caseCode = `RES-${String(item.id).padStart(4, "0")}`;
                  const needsArbitration =
                    item.status === "UNDER_REVIEW" ||
                    item.status === "REVIEW_REQUESTED" ||
                    item.status === "DECISION_MADE";

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-muted-foreground tabular-nums">
                        {caseCode}
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium text-foreground truncate max-w-[220px]">
                          {item.milestone?.title || `#${item.milestoneId}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[220px] mt-0.5">
                          {translateStoredReason(item.reason)}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                        {getTypeLabel(item.resolutionType)}
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-[11px] text-foreground truncate max-w-[180px]">
                          <span className="text-muted-foreground">
                            {t("claimantShort")}:{" "}
                          </span>
                          {item.openedBy?.email || `#${item.openedById}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                          <span>{t("respondentShort")}: </span>
                          {item.respondent?.email || `#${item.respondentId}`}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium tabular-nums text-foreground">
                        {formatResolutionCurrency(item.milestone?.amount ?? 0)}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <DisputeStatusBadge
                          status={item.status}
                          declinedAt={item.declinedAt}
                        />
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(item.id);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${needsArbitration
                              ? "bg-[#0069D3] text-white hover:bg-[#0055b3] font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                        >
                          {needsArbitration ? (
                            <Gavel className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                          <span>
                            {needsArbitration
                              ? t("actionArbitrate")
                              : t("actionView")}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
            <span className="text-muted-foreground">
              {t("page", { page, total: totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
              >
                {t("previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || listQuery.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
