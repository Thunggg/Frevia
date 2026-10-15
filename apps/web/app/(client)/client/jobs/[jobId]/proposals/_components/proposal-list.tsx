"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
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
import type { ClientJobProposalType } from "@shared/types";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { ProposalDetailSheet } from "./proposal-detail-sheet";
import { VerifiedBadge } from "@/components/verified-badge";

type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
type StatusFilter = "ALL" | ProposalStatus;

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

function toClientProposal(proposal: ClientJobProposalType): ClientProposal {
  const profile = proposal.freelancer.profile;
  return {
    id: proposal.id,
    status: proposal.status as ProposalStatus,
    coverLetter: proposal.coverLetter ?? "No cover letter provided.",
    bidAmount: proposal.bidAmount ?? 0,
    deliveryDays: proposal.deliveryDays ?? 0,
    submittedAt: String(proposal.submittedAt),
    freelancer: {
      id: proposal.freelancer.id,
      profileId: proposal.freelancer.id,
      displayName: profile?.displayName ?? proposal.freelancer.email,
      avatarUrl: profile?.avatarUrl ?? null,
      title: profile?.freelancerProfile?.title ?? null,
      verified: profile?.freelancerProfile?.idVerified ?? false,
    },
  };
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function submittedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const label = status[0] + status.slice(1).toLowerCase();
  const isAccepted = status === "ACCEPTED";
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";

  const colorClass = isAccepted
    ? "bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300"
    : isPending
      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
      : isRejected
        ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"
        : "bg-[#F1F0F5] text-muted-foreground dark:bg-zinc-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold font-sans ${colorClass}`}
    >
      {label}
    </span>
  );
}

function ProposalListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-border bg-card p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ProposalEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-border bg-card/40 px-6 py-16 text-center font-sans">
      <div className="flex size-10 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
        <FileText className="size-5" />
      </div>
      <h2 className="mt-3 text-sm font-semibold text-foreground">
        {filtered ? "No matching proposals" : "No submitted proposals yet"}
      </h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {filtered
          ? "Try another status filter to see submitted proposals for this job."
          : "Proposals submitted by freelancers will show up here."}
      </p>
    </div>
  );
}

export function ProposalList({
  jobId,
  jobTitle,
}: {
  jobId: number;
  jobTitle: string;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<ClientProposal | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

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
    setSelectedProposalId(proposal.id);
    setSelectedProposalData(proposal);
    setProposalSheetOpen(true);
  };

  const proposalsQuery = useQuery({
    queryKey: ["client-job-proposals", jobId, page, status],
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
    () => (proposalsQuery.data?.data ?? []).map(toClientProposal),
    [proposalsQuery.data],
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
    setIsRejecting(true);
    try {
      await proposalApiRequest.reject(rejecting.id);
      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      toastSuccess({ message: "Proposal rejected" });
      setRejecting(null);
    } catch (error) {
      const message =
        error instanceof ApiFail
          ? error.response.error.message
          : "Unable to reject this proposal. Please try again.";
      toastError({ message });
    } finally {
      setIsRejecting(false);
    }
  };

  const acceptProposal = async (proposalId: number) => {
    setAcceptingId(proposalId);
    try {
      await proposalApiRequest.accept(proposalId);
      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      toastSuccess({ message: "Proposal accepted" });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Unable to accept proposal. Please try again.",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-background font-sans">
      <main className="flex-1 font-sans">
        {/* Page header */}
        <section className="border-b border-border bg-background">
          <div className="px-6 py-6 lg:px-8">
            <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
              <Link
                href="/client/jobs"
                className="transition-colors hover:text-foreground font-medium"
              >
                My Jobs
              </Link>
              <span className="text-muted-foreground/30">/</span>
              <Link
                href={`/client/jobs/${jobId}`}
                className="max-w-[200px] truncate transition-colors hover:text-foreground font-medium"
              >
                {jobTitle}
              </Link>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground font-medium">Proposals</span>
            </nav>

            <div className="mt-4">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {jobTitle}
              </h1>
            </div>
          </div>
        </section>

        {/* Content area */}
        <div className="px-6 py-8 lg:px-8 font-sans">
          {/* Filter Tabs - Capsule style & Filter/Sort on the right */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={status} onValueChange={changeFilter}>
              <TabsList className="h-auto gap-1 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 p-1 border border-black/5 dark:border-white/10 font-sans">
                <TabsTrigger
                  value="ALL"
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-900 transition-all cursor-pointer"
                >
                  All ({totalItems})
                </TabsTrigger>
                {(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const).map(
                  (item) => (
                    <TabsTrigger
                      key={item}
                      value={item}
                      className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-900 transition-all cursor-pointer"
                    >
                      {item[0] + item.slice(1).toLowerCase()}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>

            {/* Filter / Sort on the right */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search freelancer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-40 sm:w-48 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 pl-8 pr-3 text-xs border border-black/5 dark:border-white/10 shadow-xs focus-visible:ring-[#0069D3]"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 rounded-full border border-black/5 dark:border-white/10 bg-[#F3F3F7] dark:bg-zinc-800/90 text-xs font-medium gap-1.5 px-3.5 shadow-xs cursor-pointer">
                  <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl text-xs font-sans">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="bid_asc">Lowest bid</SelectItem>
                  <SelectItem value="bid_desc">Highest bid</SelectItem>
                  <SelectItem value="delivery_asc">Shortest delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proposals List */}
          <div className="mt-5 space-y-3">
            {proposalsQuery.isLoading ? (
              <ProposalListSkeleton />
            ) : proposalsQuery.isError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-16 text-center">
                <h2 className="text-sm font-semibold text-foreground">
                  Could not load proposals
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please check your connection and try again.
                </p>
                <Button
                  className="mt-4 rounded-xl text-xs"
                  variant="outline"
                  size="sm"
                  onClick={() => void proposalsQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : proposals.length === 0 ? (
              <ProposalEmptyState filtered={status !== "ALL"} />
            ) : (
              proposals.map((proposal, index) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.03,
                  }}
                  className="group relative flex flex-col justify-between rounded-[24px] border border-border bg-card p-5 sm:p-6 transition-all hover:bg-accent/10 shadow-xs font-sans"
                >
                  {/* Top Freelancer Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Avatar size="default" className="size-10 rounded-full ring-2 ring-transparent group-hover:ring-[#0069D3]/30 transition-all">
                        <AvatarImage
                          src={proposal.freelancer.avatarUrl ?? undefined}
                          alt={proposal.freelancer.displayName}
                        />
                        <AvatarFallback className="font-semibold text-foreground text-xs bg-[#F1F0F5] dark:bg-zinc-800">
                          {proposal.freelancer.displayName
                            .slice(0, 1)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-foreground font-sans group-hover:text-[#0069D3] transition-colors">
                            {proposal.freelancer.displayName}
                          </h2>
                          {proposal.freelancer.verified ? (
                            <VerifiedBadge size="xs" />
                          ) : null}
                        </div>
                        <p className="text-xs font-normal text-muted-foreground">
                          {proposal.freelancer.title ?? "Freelancer"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <ProposalStatusBadge status={proposal.status} />
                    </div>
                  </div>

                  {/* Cover Letter preview */}
                  <p className="mt-3 line-clamp-2 text-xs font-normal leading-relaxed text-muted-foreground font-sans">
                    {proposal.coverLetter}
                  </p>

                  {/* Bottom Row: Metadata & Action Buttons */}
                  <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-normal text-muted-foreground font-sans">
                      <span>
                        Bid: <span className="font-semibold text-foreground">{money(proposal.bidAmount)}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Delivery: <span className="font-semibold text-foreground">{proposal.deliveryDays} days</span>
                      </span>
                      <span>•</span>
                      <span>Submitted {submittedDate(proposal.submittedAt)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 h-8 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                        onClick={() => handleOpenProposalDetail(proposal)}
                      >
                        View Proposal
                      </Button>

                      {proposal.status === "PENDING" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 h-8 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                            onClick={() => void acceptProposal(proposal.id)}
                            disabled={acceptingId === proposal.id}
                          >
                            {acceptingId === proposal.id ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <Check className="mr-1 size-3" />
                            )}
                            Accept
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-gray-700 dark:border-red-900/40 text-gray-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 h-8 text-xs font-medium cursor-pointer transition-colors"
                            onClick={() => setRejecting(proposal)}
                          >
                            <X className="mr-1 size-3" />
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
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
                Reject proposal
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal font-sans">
                Are you sure you want to reject {rejecting?.freelancer.displayName}&apos;s proposal? This action cannot be undone.
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
                  <span className="text-xs font-semibold">Reject proposal</span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel asChild>
                <button
                  type="button"
                  disabled={isRejecting}
                  className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-foreground cursor-pointer transition-all duration-200 outline-none border-0 m-0 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-muted-foreground shadow-xs transition-transform group-hover:scale-105">
                      <X className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium">Cancel</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
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
        initialProposal={selectedProposalData}
        onAccept={async (id) => {
          await acceptProposal(id);
          setProposalSheetOpen(false);
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
