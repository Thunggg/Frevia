"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  UserRound,
  X,
} from "lucide-react";

import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ClientJobProposalType } from "@shared/types";

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
  const classes: Record<ProposalStatus, string> = {
    PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    ACCEPTED: "bg-[#4fae2e]/15 text-[#3f9225] dark:text-[#7ad75d]",
    REJECTED: "bg-destructive/10 text-destructive",
    WITHDRAWN: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="secondary" className={classes[status]}>
      {status[0] + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function ProposalListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            <div className="flex gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-52" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProposalEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
          <FileText className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          {filtered ? "No matching proposals" : "No submitted proposals yet"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try another status to see submitted proposals for this job."
            : "Submitted proposals will appear here when freelancers apply."}
        </p>
      </CardContent>
    </Card>
  );
}

export function ClientJobProposalsContent({
  jobId,
  jobTitle,
}: {
  jobId: number;
  jobTitle: string;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<ClientProposal | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
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
  const proposals = useMemo(
    () => (proposalsQuery.data?.data ?? []).map(toClientProposal),
    [proposalsQuery.data],
  );
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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header role="CLIENT" />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/client/jobs"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4fae2e]"
            >
              <ArrowLeft className="size-4" />
              Back to My Jobs
            </Link>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#3f9225]">
                  Job proposals
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {jobTitle}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {totalItems} submitted proposal
                  {totalItems === 1 ? "" : "s"}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="w-fit bg-background/75 px-3 py-1.5 text-sm"
              >
                Job #{jobId}
              </Badge>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Tabs value={status} onValueChange={changeFilter}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto bg-transparent p-0">
              <TabsTrigger value="ALL" className="flex-none">
                All{" "}
                <span className="text-xs text-muted-foreground">
                  {totalItems}
                </span>
              </TabsTrigger>
              {(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const).map(
                (item) => (
                  <TabsTrigger key={item} value={item} className="flex-none">
                    {item[0] + item.slice(1).toLowerCase()}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </Tabs>
          <div className="mt-6 space-y-4">
            {proposalsQuery.isLoading ? (
              <ProposalListSkeleton />
            ) : proposalsQuery.isError ? (
              <Card>
                <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                  <h2 className="text-lg font-semibold">
                    We couldn&apos;t load proposals
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check your connection and try again.
                  </p>
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={() => void proposalsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : proposals.length === 0 ? (
              <ProposalEmptyState filtered={status !== "ALL"} />
            ) : (
              proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="overflow-hidden border-border/80"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Avatar size="lg">
                            <AvatarImage
                              src={proposal.freelancer.avatarUrl ?? undefined}
                              alt={proposal.freelancer.displayName}
                            />
                            <AvatarFallback>
                              {proposal.freelancer.displayName.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-semibold">
                                {proposal.freelancer.displayName}
                              </h2>
                              {proposal.freelancer.verified ? (
                                <Badge variant="outline" className="text-xs">
                                  Verified
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {proposal.freelancer.title ?? "Freelancer"}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <ProposalStatusBadge status={proposal.status} />
                          </div>
                        </div>
                        <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {proposal.coverLetter}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <span>
                            <span className="text-muted-foreground">Bid </span>
                            <strong>{money(proposal.bidAmount)}</strong>
                          </span>
                          <span>
                            <span className="text-muted-foreground">
                              Delivery{" "}
                            </span>
                            <strong>{proposal.deliveryDays} days</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Submitted {submittedDate(proposal.submittedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-52 lg:flex-col lg:items-stretch">
                        <Button asChild variant="outline">
                          <Link href={`/client/proposals/${proposal.id}`}>
                            View proposal
                          </Link>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link href={`/profiles/${proposal.freelancer.id}`}>
                            <UserRound className="size-4" />
                            View profile
                          </Link>
                        </Button>
                        {proposal.status === "PENDING" ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRejecting(proposal)}
                            >
                              <X className="size-4" />
                              Reject
                            </Button>
                            <Button
                              type="button"
                              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                              onClick={() =>
                                toastSuccess({
                                  message:
                                    "Accept flow will be connected to contract creation.",
                                })
                              }
                            >
                              <Check className="size-4" />
                              Accept
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {totalItems > 0 ? (
            <div className="mt-8 flex items-center justify-between border-t pt-5">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
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
      <AlertDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {rejecting?.freelancer.displayName}&apos;s proposal
              as rejected. This action cannot be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRejecting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void rejectProposal();
              }}
            >
              {isRejecting ? <Loader2 className="size-4 animate-spin" /> : null}
              Reject proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
