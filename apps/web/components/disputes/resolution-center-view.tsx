"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2, RefreshCw, Scale } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { useActionPermission } from "@/hooks/use-action-permission";
import type { DisputeDetailType } from "@shared/types";
import { ResolutionDetailSheet } from "./resolution-detail-sheet";
import {
  DisputeStatusBadge,
  formatResolutionCurrency,
  useResolutionHelpers,
} from "./resolution-utils";

const STATUS_TAB_KEYS = [
  "ALL",
  "WAITING_RESPONSE",
  "UNDER_REVIEW",
  "DECISION_MADE",
  "FINALIZED",
  "CANCELLED",
] as const;

/**
 * Clean Resolution Center list page for Client and Freelancer roles.
 */
export function ResolutionCenterView() {
  const t = useTranslations("resolutionCenter.listView");
  const tDetail = useTranslations("resolutionCenter.detailSheet");
  const { formatDate, getTypeLabel, translateStoredReason } =
    useResolutionHelpers();
  const { can, isLoading: isPermissionLoading } = useActionPermission();
  const canViewDisputes = can("GET", "/api/disputes");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeDetailType | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["my-disputes", statusFilter, page],
    queryFn: async () => {
      const res = await disputeApiRequest.getMyDisputes({
        page,
        limit: 10,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      return res.data;
    },
    enabled: canViewDisputes,
  });

  const disputes = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.total ?? 0;

  if (!isPermissionLoading && !canViewDisputes) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center text-xs text-muted-foreground">
        {t("noPermission")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
        {/* Top Bar: Filter Tabs & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted scrollbar-none">
            {STATUS_TAB_KEYS.map((tabKey) => {
              const isActive = statusFilter === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tabKey);
                    setPage(1);
                  }}
                  className={`inline-flex h-6 cursor-pointer items-center whitespace-nowrap rounded-full px-3 text-xs transition-all ${
                    isActive
                      ? "bg-background font-medium text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`tabs.${tabKey}`)}
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
              onClick={() => void refetch()}
              disabled={isLoading || isRefetching}
              aria-label={t("refreshAria")}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading || isRefetching ? "animate-spin" : ""}`}
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
                <th className="px-3 py-2.5 font-normal">{t("colEscrow")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colOpened")}</th>
                <th className="px-3 py-2.5 font-normal">{t("colStatus")}</th>
                <th className="px-3 py-2.5 text-right font-normal">
                  {t("colDetail")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-muted-foreground"
                  >
                    <Loader2 className="size-4 animate-spin mx-auto mb-2" />
                    <span>{t("loadingCases")}</span>
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto space-y-1.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground mb-1">
                        <Scale className="size-4" />
                      </div>
                      <p className="text-sm text-foreground">
                        {t("emptyTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("emptyDescription")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                disputes.map((item) => {
                  const caseCode = `RES-${String(item.id).padStart(4, "0")}`;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDispute(item)}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-muted-foreground tabular-nums">
                        {caseCode}
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-foreground truncate max-w-[240px]">
                          {item.milestone?.title ||
                            tDetail("milestoneFallback", {
                              id: item.milestoneId,
                            })}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[240px] mt-0.5">
                          {translateStoredReason(item.reason)}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                        {getTypeLabel(item.resolutionType)}
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
                            setSelectedDispute(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>{t("view")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
            <span className="text-muted-foreground">
              {t("pageOf", { page, totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
              >
                {t("previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ResolutionDetailSheet
        open={Boolean(selectedDispute)}
        onOpenChange={(open) => {
          if (!open) setSelectedDispute(null);
        }}
        disputeId={selectedDispute?.id ?? null}
        initialDispute={selectedDispute}
      />
    </div>
  );
}
