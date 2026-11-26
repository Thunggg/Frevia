"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "@/components/icons";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";

import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  ClientJobProposalType,
  SubmittedProposalStatusType,
} from "@shared/types";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { ProposalDetailSheet } from "./proposal-detail-sheet";
import { CreateContractDialog } from "../../../../contracts/_components/create-contract-dialog";
import { VerifiedBadge } from "@/components/verified-badge";
import { useActionPermission } from "@/hooks/use-action-permission";

type ProposalStatus = SubmittedProposalStatusType;
type StatusFilter = "ALL" | ProposalStatus;

// Các trạng thái khách hàng có thể từ chối / tuyển.
const ACTIONABLE_STATUSES: ProposalStatus[] = ["SUBMITTED"];

type ClientProposal = {
  id: number;
  status: ProposalStatus;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  submittedAt: string;
  freelancer: {
    id: number;
    profileId: number;
    displayName: string;
    avatarUrl: string | null;
    title: string | null;
    verified: boolean;
  };
};

const PAGE_SIZE = 10;

function toClientProposal(
  proposal: ClientJobProposalType,
  noCoverLetter: string,
): ClientProposal {
  const profile = proposal.freelancer.profile;
  return {
    id: proposal.id,
    status: proposal.status as ProposalStatus,
    coverLetter: proposal.coverLetter ?? noCoverLetter,
    bidAmount: proposal.bidAmount ?? 0,
    deliveryDays: proposal.deliveryDays ?? 0,
    submittedAt: String(proposal.submittedAt),
    freelancer: {
      id: proposal.freelancer.id,
      profileId: profile?.id ?? proposal.freelancer.id,
      displayName: profile?.displayName ?? proposal.freelancer.email,
      avatarUrl: profile?.avatarUrl ?? null,
      title: profile?.freelancerProfile?.title ?? null,
      verified: profile?.freelancerProfile?.idVerified ?? false,
    },
  };
}

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const tStatus = useTranslations("proposalStatus");

  const colorClass =
    status === "HIRED"
      ? "text-[#0069D3] dark:text-blue-400"
      : status === "SUBMITTED"
        ? "text-amber-600 dark:text-amber-400"
        : status === "REJECTED"
          ? "text-rose-600 dark:text-rose-400"
          : "text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold font-sans ${colorClass}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {tStatus(status)}
    </span>
  );
}

function ProposalListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ProposalEmptyState({ filtered }: { filtered: boolean }) {
  const t = useTranslations("clientProposals");

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center font-sans">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="size-5" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-foreground">
        {filtered ? t("emptyFilteredTitle") : t("emptyTitle")}
      </h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {filtered ? t("emptyFilteredHint") : t("emptyHint")}
      </p>
    </div>
  );
}

export function ProposalList({
  jobId,
  jobTitle,
  hiringType,
  positionsRequired,
  positionsFilled,
  jobStatus,
}: {
  jobId: number;
  jobTitle: string;
  hiringType?: "SINGLE" | "MULTIPLE";
  positionsRequired?: number;
  positionsFilled?: number;
  jobStatus?: string;
}) {
  const queryClient = useQueryClient();
  const t = useTranslations("clientProposals");
  const tDetail = useTranslations("jobDetailClient");
  const tStatus = useTranslations("proposalStatus");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const required = positionsRequired ?? 1;
  const filled = positionsFilled ?? 0;
  const isFilled = filled >= required;
  const cannotHireMore =
    isFilled || (jobStatus !== undefined && jobStatus !== "OPEN");

  const money = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const submittedDate = (value: string) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<ClientProposal | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [contractingProposal, setContractingProposal] = useState<ClientProposal | null>(null);

  // Freelancer profile sheet
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<{
    displayName?: string | null;
    avatarUrl?: string | null;
    title?: string | null;
    freelancerId?: number;
  } | undefined>(undefined);

  // Proposal detail sheet
  const [proposalSheetOpen, setProposalSheetOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposalData, setSelectedProposalData] = useState<ClientProposal | null>(null);

  const { can } = useActionPermission();
  const canViewSubmitted =
    can("GET", "/api/jobs/:jobId/proposals") ||
    can("GET", "/api/proposals/jobs/:jobId/submitted");
  const canViewDetail = can("GET", "/api/proposals/:id/client");
  const canAccept = can("PATCH", "/api/proposals/:id/accept");
  const canReject = can("PATCH", "/api/proposals/:id/reject");
  const canCreateContract = can("POST", "/api/contracts");

  const handleOpenFreelancerProfile = (
    profileId: number,
    data?: {
      displayName?: string | null;
      avatarUrl?: string | null;
      title?: string | null;
      freelancerId?: number;
    },
  ) => {
    setSelectedProfileId(profileId);
    setSelectedProfileData(data);
    setProfileSheetOpen(true);
  };

  const handleOpenProposalDetail = (proposal: ClientProposal) => {
    if (!canViewDetail) {
      toastError({ message: t("viewDetailAccessDenied") });
      return;
    }
    setSelectedProposalId(proposal.id);
    setSelectedProposalData(proposal);
    setProposalSheetOpen(true);
  };

  const proposalsQuery = useQuery({
    queryKey: ["client-job-proposals", jobId, page, status],
    enabled: canViewSubmitted,
    queryFn: () =>
      proposalApiRequest
        .getClientJobProposals(jobId, {
          page,
          limit: PAGE_SIZE,
          status: status === "ALL" ? undefined : status,
        })
        .then(extractProposalData),
  });

  const rawProposals = useMemo(
    () =>
      (proposalsQuery.data?.data ?? []).map((proposal) =>
        toClientProposal(proposal, t("noCoverLetter")),
      ),
    [proposalsQuery.data, t],
  );

  const proposals = useMemo(() => {
    let list = [...rawProposals];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.freelancer.displayName.toLowerCase().includes(q) ||
          p.freelancer.title?.toLowerCase().includes(q) ||
          p.coverLetter.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        );
      }
      if (sortBy === "bid_asc") {
        return (a.bidAmount ?? 0) - (b.bidAmount ?? 0);
      }
      if (sortBy === "bid_desc") {
        return (b.bidAmount ?? 0) - (a.bidAmount ?? 0);
      }
      if (sortBy === "delivery_asc") {
        return (a.deliveryDays ?? 0) - (b.deliveryDays ?? 0);
      }
      return 0;
    });

    return list;
  }, [rawProposals, sortBy, searchQuery]);
  const totalItems = proposalsQuery.data?.totalItems ?? 0;
  const totalPages = proposalsQuery.data?.totalPages ?? 0;

  const changeFilter = (value: string) => {
    setStatus(value as StatusFilter);
    setPage(1);
  };

  const rejectProposal = async () => {
    if (!rejecting) return;
    if (!canReject) {
      toastError({ message: t("noPermissionAction") });
      return;
    }
    setIsRejecting(true);
    try {
      await proposalApiRequest.reject(rejecting.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      toastSuccess({ message: t("rejected") });
      setRejecting(null);
    } catch (error) {
      const message =
        error instanceof ApiFail
          ? error.response.error.message
          : t("rejectFailed");
      toastError({ message });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-background font-sans pb-20">
      <main className="flex-1 font-sans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          {/* Breadcrumb & Header */}
          <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
            <Link
              href="/client/jobs"
              className="hover:text-foreground font-medium"
            >
              {t("breadcrumbJobs")}
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Link
              href={`/client/jobs/${jobId}`}
              className="max-w-[240px] truncate hover:text-foreground font-medium"
            >
              {jobTitle}
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">
              {t("breadcrumbProposals")}
            </span>
          </nav>

          <div className="mt-4 pb-5 border-b border-border">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {jobTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {hiringType === "SINGLE" ? (
                <span>{t("hiringTypeSingleBadge")}</span>
              ) : hiringType === "MULTIPLE" ? (
                <span>
                  {t("hiringTypeMultipleBadge", { filled, required })}
                </span>
              ) : null}
              {isFilled ? (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="font-medium text-[#0069D3] dark:text-blue-400">
                    {t("jobFilledBadge", { filled, required })}
                  </span>
                </>
              ) : jobStatus && jobStatus !== "OPEN" ? (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{t("jobClosedBadge")}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Filter Tabs & Search / Sort Bar */}
          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-border bg-card p-1.5">
            <Tabs value={status} onValueChange={changeFilter}>
              <TabsList className="h-auto gap-1 bg-transparent p-0 font-sans">
                <TabsTrigger
                  value="ALL"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none cursor-pointer"
                >
                  {t("allTab", { count: totalItems })}
                </TabsTrigger>
                {(
                  [
                    "SUBMITTED",
                    "HIRED",
                    "REJECTED",
                    "WITHDRAWN",
                    "EXPIRED",
                  ] as const
                ).map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none cursor-pointer"
                  >
                    {tStatus(item)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-44 sm:w-52 rounded-lg bg-background pl-8 pr-3 text-xs border-border shadow-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 rounded-lg border-border bg-background text-xs font-medium gap-1.5 px-3 shadow-none cursor-pointer">
                  <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={t("sortPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs font-sans">
                  <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                  <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
                  <SelectItem value="bid_asc">{t("sortBidAsc")}</SelectItem>
                  <SelectItem value="bid_desc">{t("sortBidDesc")}</SelectItem>
                  <SelectItem value="delivery_asc">
                    {t("sortDeliveryAsc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proposals List */}
          <div className="mt-5 space-y-3">
            {!canViewSubmitted ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-14 text-center font-sans">
                <FileText className="size-8 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  {t("accessDenied")}
                </p>
              </div>
            ) : proposalsQuery.isLoading ? (
              <ProposalListSkeleton />
            ) : proposalsQuery.isError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("loadFailedTitle")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("loadFailedHint")}
                </p>
                <Button
                  className="mt-4 rounded-lg text-xs"
                  variant="outline"
                  size="sm"
                  onClick={() => void proposalsQuery.refetch()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : proposals.length === 0 ? (
              <ProposalEmptyState filtered={status !== "ALL"} />
            ) : (
              proposals.map((proposal) => {
                const isActionable = ACTIONABLE_STATUSES.includes(
                  proposal.status,
                );
                return (
                  <div
                    key={proposal.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 font-sans"
                  >
                    {/* Top Freelancer Row + Right Bid */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div
                        onClick={() =>
                          handleOpenFreelancerProfile(
                            proposal.freelancer.profileId,
                            {
                              displayName: proposal.freelancer.displayName,
                              avatarUrl: proposal.freelancer.avatarUrl,
                              title: proposal.freelancer.title,
                              freelancerId: proposal.freelancer.id,
                            },
                          )
                        }
                        className="flex items-start gap-3 cursor-pointer min-w-0"
                      >
                        <Avatar
                          size="default"
                          className="size-10 rounded-full shrink-0"
                        >
                          <AvatarImage
                            src={proposal.freelancer.avatarUrl ?? undefined}
                            alt={proposal.freelancer.displayName}
                          />
                          <AvatarFallback className="font-semibold text-foreground text-xs bg-muted">
                            {proposal.freelancer.displayName
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm sm:text-base font-semibold text-foreground hover:text-[#0069D3]">
                              {proposal.freelancer.displayName}
                            </h2>
                            {proposal.freelancer.verified ? (
                              <VerifiedBadge size="xs" />
                            ) : null}
                            <ProposalStatusBadge status={proposal.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {proposal.freelancer.title ??
                              t("freelancerFallback")}
                          </p>
                        </div>
                      </div>

                      {/* Right Bid Amount & Delivery Days */}
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {money(proposal.bidAmount)}
                        </span>
                        {proposal.deliveryDays > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {tDetail("deliveryDaysPill", {
                              days: proposal.deliveryDays,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cover Letter preview */}
                    <p className="mt-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {proposal.coverLetter}
                    </p>

                    {/* Bottom Row: Submitted date & Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("submittedAt", {
                          date: submittedDate(proposal.submittedAt),
                        })}
                      </span>

                      {/* Action buttons */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {canViewDetail ? (
                          <Button
                            type="button"
                            variant={isActionable ? "outline" : "default"}
                            size="sm"
                            className={
                              isActionable
                                ? "rounded-lg px-3.5 h-8 text-xs font-medium cursor-pointer"
                                : "rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 h-8 text-xs font-medium cursor-pointer"
                            }
                            onClick={() => handleOpenProposalDetail(proposal)}
                          >
                            {t("viewProposal")}
                          </Button>
                        ) : null}

                        {isActionable ? (
                          <>
                            {canAccept && canCreateContract ? (
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-3.5 h-8 text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setContractingProposal(proposal)}
                                disabled={cannotHireMore}
                                title={
                                  cannotHireMore
                                    ? t("jobFilledDisabled")
                                    : undefined
                                }
                              >
                                {t("hire")}
                              </Button>
                            ) : null}

                            {canReject ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-lg text-destructive hover:text-destructive px-3 h-8 text-xs font-medium cursor-pointer"
                                onClick={() => setRejecting(proposal)}
                              >
                                {t("reject")}
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                {tCommon("pageOf", { page, totalPages })}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground font-sans">
                {t("rejectTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal font-sans">
                {t("rejectHint", {
                  name: rejecting?.freelancer.displayName ?? "",
                })}
              </AlertDialogDescription>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={isRejecting}
                onClick={(event) => {
                  event.preventDefault();
                  void rejectProposal();
                }}
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 outline-none disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                    {isRejecting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">
                    {t("rejectTitle")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel
                disabled={isRejecting}
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-foreground cursor-pointer transition-all duration-200 outline-none border-0 m-0 h-auto disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-muted-foreground shadow-xs transition-transform group-hover:scale-105">
                    <X className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium">
                    {tCommon("cancel")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Slide-over proposal detail sheet */}
      <ProposalDetailSheet
        proposalId={selectedProposalId}
        jobId={jobId}
        open={proposalSheetOpen}
        onOpenChange={setProposalSheetOpen}
        cannotHireMore={cannotHireMore}
        initialProposal={selectedProposalData}
        onAccept={(id) => {
          if (!canCreateContract) return;
          const p =
            rawProposals.find((item) => item.id === id) ??
            selectedProposalData;
          if (p) {
            setContractingProposal(p);
            setProposalSheetOpen(false);
          }
        }}
        onReject={async (id) => {
          const p =
            rawProposals.find((item) => item.id === id) ??
            selectedProposalData;
          if (p) {
            setRejecting(p);
            setProposalSheetOpen(false);
          }
        }}
      />

      {/* Modal create contract & hire */}
      <CreateContractDialog
        open={!!contractingProposal}
        onOpenChange={(open) => !open && setContractingProposal(null)}
        proposal={contractingProposal}
        jobId={jobId}
        jobTitle={jobTitle}
      />

      {/* Slide-over full freelancer profile sheet */}
      <FreelancerProfileSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profileId={selectedProfileId}
        initialData={selectedProfileData}
      />
    </div>
  );
}
