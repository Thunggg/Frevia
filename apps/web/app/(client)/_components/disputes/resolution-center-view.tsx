"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { useActionPermission } from "@/hooks/use-action-permission";
import { useMe } from "@/hooks/use-auth";
import type { DisputeDetailType } from "@shared/types";
import { ResolutionDetailSheet } from "./resolution-detail-sheet";
import {
  DisputeStatusBadge,
  formatResolutionCurrency,
  useResolutionHelpers,
} from "./resolution-utils";

const STATUS_KEYS = [
  "ALL",
  "WAITING_RESPONSE",
  "UNDER_REVIEW",
  "DECISION_MADE",
  "FINALIZED",
  "CANCELLED",
] as const;

interface ResolutionCenterViewProps {
  basePath?: string;
}

/**
 * Modern, clean Resolution Center view matching the Milestone List aesthetic.
 * Minimal borders and background colors.
 */
export function ResolutionCenterView({
  basePath = "/client",
}: ResolutionCenterViewProps) {
  const t = useTranslations("resolutionCenter.listView");
  const tDetail = useTranslations("resolutionCenter.detailSheet");
  const { formatDate, getTypeLabel, translateStoredReason } =
    useResolutionHelpers();
  const { data: me } = useMe();
  const currentUserId = me?.id;

  const { can, isLoading: isPermissionLoading } = useActionPermission();
  const canViewDisputes = can("GET", "/api/disputes");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeDetailType | null>(null);

  // Main paginated query
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["my-disputes", statusFilter, page],
    queryFn: async () => {
      const res = await disputeApiRequest.getMyDisputes({
        page,
        limit: 15,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });
      return res.data;
    },
    enabled: canViewDisputes,
  });

  // Query all user disputes to compute real-time tab badge counts
  const { data: allDisputesData } = useQuery({
    queryKey: ["my-disputes-counts"],
    queryFn: async () => {
      const res = await disputeApiRequest.getMyDisputes({ page: 1, limit: 100 });
      return res.data;
    },
    enabled: canViewDisputes,
  });

  // Compute counts for each status tab
  const tabCounts = useMemo(() => {
    const allItems = allDisputesData?.data ?? [];
    return {
      ALL: allItems.length,
      WAITING_RESPONSE: allItems.filter(
        (d) => d.status === "WAITING_RESPONSE" || d.status === "OPEN",
      ).length,
      UNDER_REVIEW: allItems.filter(
        (d) =>
          d.status === "UNDER_REVIEW" || d.status === "REVIEW_REQUESTED",
      ).length,
      DECISION_MADE: allItems.filter((d) => d.status === "DECISION_MADE")
        .length,
      FINALIZED: allItems.filter((d) => d.status === "FINALIZED").length,
      CANCELLED: allItems.filter((d) => d.status === "CANCELLED").length,
    };
  }, [allDisputesData]);

  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalItems = data?.pagination?.total ?? 0;

  // Filter disputes by search query (case code, milestone title, reason, contract code)
  const filteredDisputes = useMemo(() => {
    const rawDisputes = data?.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawDisputes;

    return rawDisputes.filter((item) => {
      const caseCode = `RES-${String(item.id).padStart(4, "0")}`.toLowerCase();
      const milestoneTitle = (item.milestone?.title ?? "").toLowerCase();
      const reason = (item.reason ?? "").toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const contractSlug = (item.milestone?.contract?.slug ?? "").toLowerCase();
      const contractId = String(item.milestone?.contractId ?? "");

      return (
        caseCode.includes(q) ||
        milestoneTitle.includes(q) ||
        reason.includes(q) ||
        desc.includes(q) ||
        contractSlug.includes(q) ||
        contractId.includes(q)
      );
    });
  }, [data, searchQuery]);

  if (!isPermissionLoading && !canViewDisputes) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-xs text-muted-foreground">
        {t("noPermission")}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans mx-auto pb-16">
      {/* ── Top Bar: Breadcrumb + Count / Refresh ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={basePath}
            className="hover:text-foreground transition-colors"
          >
            {t("breadcrumbDashboard")}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Scale className="size-3.5 text-muted-foreground" />
            {t("breadcrumbDisputes")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {t("casesCount", { count: totalItems })}
          </span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading || isRefetching}
            aria-label={t("refreshAria")}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${
                isLoading || isRefetching ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Control Bar: Status Tabs Pill Bar & Search (Minimal bg & border) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Status Tabs Pill Bar */}
        <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-muted/40 p-1 text-xs scrollbar-none">
          {STATUS_KEYS.map((tabKey) => {
            const isActive = statusFilter === tabKey;
            const count = tabCounts[tabKey] ?? 0;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setStatusFilter(tabKey);
                  setPage(1);
                }}
                className={`
                  inline-flex h-6 cursor-pointer items-center gap-1.5
                  whitespace-nowrap rounded-full px-3
                  font-medium transition-all text-xs
                  ${
                    isActive
                      ? "bg-background font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span>{t(`tabs.${tabKey}`)}</span>
                {count > 0 && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input (Minimal border, transparent bg) */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              h-8 w-full rounded-full
              border border-border/60
              bg-transparent py-1
              pr-3 pl-8 text-xs
              text-foreground
              placeholder:text-muted-foreground/60
              focus:border-foreground/40
              focus:ring-1
              focus:ring-foreground/20
              focus:outline-none
            "
          />
        </div>
      </div>

      {/* ── Disputes List (Clean, borderless divide-y) ── */}
      {isLoading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t("loadingCases")}</p>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground mx-auto mb-1">
            <Scale className="size-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            {searchQuery ? t("noMatchingCases") : t("emptyTitle")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? t("noMatchingCases")
              : t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {filteredDisputes.map((item) => {
            const caseCode = `#RES-${String(item.id).padStart(4, "0")}`;
            const contractSlug =
              item.milestone?.contract?.slug ||
              (item.milestone?.contractId
                ? String(item.milestone.contractId)
                : null);
            const contractCode = contractSlug
              ? contractSlug.startsWith("CTR-") ||
                contractSlug.startsWith("CON-")
                ? `#${contractSlug}`
                : `#CON-${contractSlug}`
              : null;
            const isOpener = Boolean(
              currentUserId && item.openedById === currentUserId,
            );

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDispute(item)}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 sm:py-4.5 hover:bg-muted/20 transition-colors cursor-pointer rounded-lg px-2 sm:px-3 -mx-2 sm:-mx-3"
              >
                {/* Left Side: Case Code, Milestone & Contract, Reason, Meta */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/50 text-muted-foreground mt-0.5">
                    <Scale className="size-3.5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Title & Case Code Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground font-medium">
                        {caseCode}
                      </span>
                      <span className="text-border/60">•</span>
                      <span className="font-medium text-sm sm:text-base text-foreground line-clamp-1">
                        {item.milestone?.title ||
                          tDetail("milestoneFallback", {
                            id: item.milestoneId,
                          })}
                      </span>
                      {contractSlug && (
                        <Link
                          href={`${basePath}/contracts/${encodeURIComponent(
                            contractSlug,
                          )}/milestones`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
                        >
                          <span>({contractCode})</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </div>

                    {/* Reason & Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl">
                      <strong className="font-medium text-foreground">
                        {translateStoredReason(item.reason)}
                      </strong>
                      {item.description ? ` — ${item.description}` : ""}
                    </p>

                    {/* Meta Row (Minimal text + dot indicators) */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                      <DisputeStatusBadge
                        status={item.status}
                        declinedAt={item.declinedAt}
                      />
                      <span className="text-border/60">•</span>
                      <span>{getTypeLabel(item.resolutionType)}</span>
                      <span className="text-border/60">•</span>
                      <span className="tabular-nums">
                        {t("clientLabel")}:{" "}
                        {formatResolutionCurrency(
                          item.proposedClientAmount ?? 0,
                        )}{" "}
                        · {t("freelancerLabel")}:{" "}
                        {formatResolutionCurrency(
                          item.proposedFreelancerAmount ?? 0,
                        )}
                      </span>
                      <span className="text-border/60">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                        <Clock className="size-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                      <span className="text-border/60">•</span>
                      <span className="text-[11px]">
                        {t("openedByPrefix")}:{" "}
                        {isOpener
                          ? t("you")
                          : item.openedBy?.email || t("counterparty")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Escrow Amount & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 md:pt-0 pl-10 md:pl-0 border-t sm:border-t-0 border-border/30">
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-sm sm:text-base font-semibold text-foreground block leading-tight">
                      {formatResolutionCurrency(
                        item.milestone?.amount ?? 0,
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {t("escrowLabel")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDispute(item);
                      }}
                      className="h-7 rounded-full border-border/60 text-xs font-normal px-3 cursor-pointer hover:bg-muted/30"
                    >
                      <Eye className="mr-1 size-3" />
                      <span>{t("viewDetail")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination (When multiple pages exist) ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/30 text-xs">
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
              className="h-7 rounded-full border-border/60 px-3 text-xs cursor-pointer hover:bg-muted/30"
            >
              {t("previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 rounded-full border-border/60 px-3 text-xs cursor-pointer hover:bg-muted/30"
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      {/* ── Dispute Detail Slide-over Sheet ── */}
      <ResolutionDetailSheet
        open={Boolean(selectedDispute)}
        onOpenChange={(open) => {
          if (!open) setSelectedDispute(null);
        }}
        disputeId={selectedDispute?.id ?? null}
        initialDispute={selectedDispute}
        contractId={selectedDispute?.milestone?.contractId}
      />
    </div>
  );
}
