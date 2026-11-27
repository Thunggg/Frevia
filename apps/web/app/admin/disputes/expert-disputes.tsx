"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock,
  Eye,
  Gavel,
  Loader2,
  RefreshCw,
  Scale,
  Search,
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

/**
 * Clean, minimal Expert Disputes management view.
 * Matching the Milestone List aesthetic with minimal borders and background colors.
 */
export function ExpertDisputes() {
  const t = useTranslations("expertDisputes");
  const { formatDate, getTypeLabel, translateStoredReason } =
    useResolutionHelpers();
  const { data: me, isLoading: isMeLoading } = useMe();
  const { can } = useActionPermission();

  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
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
        limit: 15,
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

  // Client-side search filtering
  const filteredDisputes = useMemo(() => {
    const raw = listQuery.data?.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return raw;

    return raw.filter((item) => {
      const caseCode = `RES-${String(item.id).padStart(4, "0")}`.toLowerCase();
      const milestoneTitle = (item.milestone?.title ?? "").toLowerCase();
      const reason = (item.reason ?? "").toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const contractSlug = (item.milestone?.contract?.slug ?? "").toLowerCase();
      const claimant = (item.openedBy?.email ?? "").toLowerCase();
      const respondent = (item.respondent?.email ?? "").toLowerCase();

      return (
        caseCode.includes(q) ||
        milestoneTitle.includes(q) ||
        reason.includes(q) ||
        desc.includes(q) ||
        contractSlug.includes(q) ||
        claimant.includes(q) ||
        respondent.includes(q)
      );
    });
  }, [listQuery.data?.data, searchQuery]);

  if (isMeLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  // Non-Expert notice
  if (!isExpertRole || !canViewDisputes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("title")}</span>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center space-y-2">
          <div className="mx-auto flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground">
            <ShieldAlert className="size-4" />
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

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  // Inactive expert profile notice
  if (profileQuery.data && !profileQuery.data.isActive) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("title")}</span>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center space-y-3">
          <div className="mx-auto flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground">
            <ShieldAlert className="size-4" />
          </div>
          <h2 className="text-sm font-medium text-foreground">
            {t("inactiveProfileTitle")}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t("inactiveProfileDesc")}
          </p>
          <div className="pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border/60 text-xs hover:bg-muted/30"
            >
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
        <div className="rounded-xl border border-destructive/30 p-6 space-y-3">
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
              className="h-7 rounded-full border-border/60 text-xs cursor-pointer hover:bg-muted/30"
            >
              {t("retry")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
              className="h-7 text-xs cursor-pointer"
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

  const totalItems = listQuery.data?.pagination?.total ?? 0;
  const totalPages = listQuery.data?.pagination?.totalPages ?? 1;
  const loadError = profileQuery.error || listQuery.error;

  return (
    <div className="space-y-4 font-sans mx-auto pb-16">
      {/* ── Top Bar: Breadcrumb + Count / Refresh ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors"
          >
            {t("breadcrumbAdmin")}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Scale className="size-3.5 text-muted-foreground" />
            {t("title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {t("casesCount", { count: totalItems })}
          </span>
          <button
            type="button"
            onClick={() => void listQuery.refetch()}
            disabled={listQuery.isLoading || listQuery.isRefetching}
            aria-label={t("refreshAria")}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${
                listQuery.isLoading || listQuery.isRefetching
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-destructive"
        >
          <p className="flex items-center gap-2">
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
            className="h-7 rounded-full border-border/60 text-xs cursor-pointer hover:bg-muted/30"
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {/* ── Control Bar: Status Tabs Pill Bar & Search (Minimal bg & border) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Status Tabs Pill Bar */}
        <div className="flex h-8 items-center gap-1 overflow-x-auto rounded-full bg-muted/40 p-1 text-xs scrollbar-none">
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
                className={`
                  inline-flex h-6 cursor-pointer items-center
                  whitespace-nowrap rounded-full px-3
                  font-medium transition-all text-xs
                  ${
                    isActive
                      ? "bg-background font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span>{t(tab.labelKey)}</span>
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
      {listQuery.isLoading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t("loading")}</p>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground mx-auto mb-1">
            <Scale className="size-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{t("empty")}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchQuery ? t("noSearchMatch") : t("emptyHint")}
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
            const needsArbitration =
              item.status === "UNDER_REVIEW" ||
              item.status === "REVIEW_REQUESTED" ||
              item.status === "DECISION_MADE";

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
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
                        {item.milestone?.title || `#${item.milestoneId}`}
                      </span>
                      {contractSlug && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span>({contractCode})</span>
                        </span>
                      )}
                    </div>

                    {/* Reason & Parties Summary */}
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
                        {item.openedBy?.email || `#${item.openedById}`} ↔{" "}
                        {item.respondent?.email || `#${item.respondentId}`}
                      </span>
                      <span className="text-border/60">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                        <Clock className="size-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Escrow Amount & Action Button */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-10 md:pl-0">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      {t("colEscrow")}
                    </span>
                    <span className="font-semibold text-sm sm:text-base tabular-nums text-foreground">
                      {formatResolutionCurrency(item.milestone?.amount ?? 0)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    className={`
                      inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all cursor-pointer
                      ${
                        needsArbitration
                          ? "bg-foreground text-background hover:bg-foreground/90 shadow-xs"
                          : "border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }
                    `}
                  >
                    {needsArbitration ? (
                      <Gavel className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    <span>
                      {needsArbitration ? t("actionArbitrate") : t("actionView")}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/30 text-xs">
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
              className="h-7 rounded-full border-border/60 px-3 text-xs cursor-pointer hover:bg-muted/30"
            >
              {t("previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || listQuery.isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 rounded-full border-border/60 px-3 text-xs cursor-pointer hover:bg-muted/30"
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
