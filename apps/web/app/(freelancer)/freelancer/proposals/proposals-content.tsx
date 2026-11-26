"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Loader2,
} from "@/components/icons";
import { useQuery } from "@tanstack/react-query";

import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import type {
  MyProposalsResponseType,
  ProposalStatusType,
} from "@shared/types";
import { useActionPermission } from "@/hooks/use-action-permission";
import { JobPagination } from "../../_components/job-pagination";

const PROPOSAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
] as const satisfies readonly ProposalStatusType[];

const STATUS_TEXT_COLORS: Record<ProposalStatusType, string> = {
  HIRED: "text-[#0069D3] dark:text-blue-400",
  SUBMITTED: "text-amber-600 dark:text-amber-400",
  REJECTED: "text-destructive",
  DRAFT: "text-muted-foreground",
  WITHDRAWN: "text-muted-foreground",
  EXPIRED: "text-muted-foreground",
};

export function MyProposalsContent({
  result,
  embedded = false,
  basePath,
  initialPage = 1,
  initialLimit = 10,
  initialStatus = null,
}: {
  result: MyProposalsResponseType | null;
  embedded?: boolean;
  basePath?: string;
  initialPage?: number;
  initialLimit?: number;
  initialStatus?: ProposalStatusType | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("proposals");
  const tStatus = useTranslations("proposalStatus");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const budget = (value: number | null) =>
    value === null ? t("noBid") : `$${format.number(value)}`;

  const date = (value: Date | string | null) =>
    value
      ? format.dateTime(new Date(value), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : t("notSubmitted");

  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/proposals" : "/proposals");
  const selectedStatus = searchParams.get(
    "status",
  ) as ProposalStatusType | null;
  const parsedPage = Number(searchParams.get("page"));
  const selectedPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const selectedLimit = Number(searchParams.get("limit")) === 20 ? 20 : 10;

  const { can } = useActionPermission();
  const canViewMyProposals = can("GET", "/api/proposals/my");
  const canViewDetail = can("GET", "/api/proposals/:id");

  const matchesInitial =
    Boolean(result) &&
    selectedPage === initialPage &&
    selectedLimit === initialLimit &&
    (selectedStatus ?? null) === (initialStatus ?? null);

  const proposalsQuery = useQuery({
    queryKey: ["proposals", "my", selectedPage, selectedLimit, selectedStatus],
    enabled: canViewMyProposals,
    queryFn: () =>
      proposalApiRequest
        .getMyProposals({
          page: selectedPage,
          limit: selectedLimit,
          status: selectedStatus ?? undefined,
        })
        .then(extractProposalData),
    initialData: matchesInitial ? (result ?? undefined) : undefined,
  });

  const liveResult = proposalsQuery.data ?? (matchesInitial ? result : null);
  const data = liveResult?.data ?? [];
  const pagination = liveResult ?? {
    page: selectedPage,
    limit: selectedLimit,
    totalItems: 0,
    totalPages: 0,
  };
  const currentStatus = selectedStatus ?? "ALL";

  const navigateWithParams = (
    nextPage: number,
    nextStatus: string | null,
    nextLimit: number = selectedLimit,
  ) => {
    const params = new URLSearchParams();
    if (nextStatus && nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextLimit !== 10) params.set("limit", String(nextLimit));
    const query = params.toString();
    router.push(query ? `${effectiveBasePath}?${query}` : effectiveBasePath);
  };

  return (
      <div
        className={`flex flex-col bg-background font-sans ${
          embedded ? "min-h-0 flex-1" : "min-h-dvh"
        }`}
      >
        {!embedded && <Header role="FREELANCER" />}
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="pb-5 border-b border-border">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                  {t("title")}
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-normal text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
              {canViewMyProposals && (
                <p className="text-xs font-medium text-muted-foreground">
                  {t("count", { count: pagination.totalItems })}
                </p>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-1.5 overflow-x-auto no-scrollbar">
            <Tabs
              value={currentStatus}
              onValueChange={(value) =>
                navigateWithParams(1, value === "ALL" ? null : value)
              }
            >
              <TabsList className="h-auto gap-1 bg-transparent p-0 font-sans">
                <TabsTrigger
                  value="ALL"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none cursor-pointer"
                >
                  {t("allStatuses")}
                </TabsTrigger>
                {PROPOSAL_STATUSES.map((value) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none cursor-pointer"
                  >
                    {tStatus(value)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Proposals List */}
          <div className="mt-5">
            {!canViewMyProposals ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-14 text-center font-sans">
                <FileText className="size-8 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  {t("accessDenied")}
                </p>
              </div>
            ) : proposalsQuery.isLoading && !liveResult ? (
              <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : proposalsQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
                {t("loadFailed")}
              </div>
            ) : data.length > 0 ? (
              <div className="space-y-3">
                {data.map((proposal) => (
                  <article
                    key={proposal.id}
                    className="rounded-xl border border-border bg-card p-5 font-sans"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold ${STATUS_TEXT_COLORS[proposal.status]}`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            <span>{tStatus(proposal.status)}</span>
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{date(proposal.submittedAt)}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>
                            {proposal.client.profile?.displayName ??
                              proposal.client.email}
                          </span>
                        </div>

                        {canViewDetail ? (
                          <Link
                            href={`${effectiveBasePath}/${proposal.id}`}
                            className="mt-2 block text-base sm:text-lg font-semibold tracking-tight text-foreground hover:text-[#0069D3] line-clamp-2"
                          >
                            {proposal.job.title}
                          </Link>
                        ) : (
                          <span className="mt-2 block text-base sm:text-lg font-semibold tracking-tight text-foreground line-clamp-2">
                            {proposal.job.title}
                          </span>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {t("bidLabel")}{" "}
                            <strong className="font-semibold text-foreground">
                              {budget(proposal.bidAmount)}
                            </strong>
                          </span>
                          <span>
                            {t("deliveryLabel")}{" "}
                            <strong className="font-semibold text-foreground">
                              {proposal.deliveryDays
                                ? t("deliveryDays", {
                                    count: proposal.deliveryDays,
                                  })
                                : tCommon("notSet")}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {canViewDetail ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-3.5 text-xs font-medium shrink-0 self-start cursor-pointer"
                        >
                          <Link href={`${effectiveBasePath}/${proposal.id}`}>
                            <span>{tCommon("view")}</span>
                            <ArrowRight className="ml-1.5 size-3.5" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-4 text-base font-semibold text-foreground">
                  {t("empty")}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  {t("emptyHint")}
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-5 rounded-lg bg-[#0069D3] text-white hover:bg-[#005bb8] text-xs font-medium h-9 px-4"
                >
                  <Link href="/freelancer">{t("findWork")}</Link>
                </Button>
              </div>
            )}

            {/* Pagination */}
            <JobPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalResults={pagination.totalItems}
              pageSize={selectedLimit}
              onPageChange={(page) =>
                navigateWithParams(page, selectedStatus)
              }
              onPageSizeChange={(limit) =>
                navigateWithParams(1, selectedStatus, limit)
              }
              isLoading={proposalsQuery.isFetching}
            />
          </div>
        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );
}
