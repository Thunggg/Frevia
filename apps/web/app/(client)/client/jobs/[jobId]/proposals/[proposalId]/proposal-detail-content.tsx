"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Loader2, UserRound, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

function statusClass(status: string) {
  return (
    {
      PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
      ACCEPTED: "bg-[#4fae2e]/15 text-[#3f9225] dark:text-[#7ad75d]",
      REJECTED: "bg-destructive/10 text-destructive",
      WITHDRAWN: "bg-muted text-muted-foreground",
    }[status] ?? ""
  );
}

function money(value: number | null) {
  return value === null
    ? "Not set"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}

export function ClientProposalDetailContent({
  jobId,
  proposalId,
}: {
  jobId: number;
  proposalId: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmReject, setConfirmReject] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const proposalQuery = useQuery({
    queryKey: ["client-proposal-detail", proposalId],
    queryFn: () =>
      proposalApiRequest.getClientDetail(proposalId).then(extractProposalData),
  });
  const proposal = proposalQuery.data;

  const reject = async () => {
    setIsRejecting(true);
    try {
      await proposalApiRequest.reject(proposalId);
      await queryClient.invalidateQueries({
        queryKey: ["client-proposal-detail", proposalId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      toastSuccess({ message: "Proposal rejected" });
      setConfirmReject(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Unable to reject proposal. Please try again.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const accept = async () => {
    try {
      await proposalApiRequest.accept(proposalId);
      await queryClient.invalidateQueries({
        queryKey: ["client-proposal-detail", proposalId],
      });
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
    }
  };

  if (proposalQuery.isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <Header role="CLIENT" />
        <main className="mx-auto max-w-5xl space-y-5 px-4 py-10">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-80 w-full" />
        </main>
      </div>
    );
  }
  if (proposalQuery.isError || !proposal) {
    return (
      <div className="min-h-dvh bg-background">
        <Header role="CLIENT" />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-xl font-semibold">Proposal unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This proposal may not belong to this job or you no longer have
            access.
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => router.push(`/client/jobs/${jobId}/proposals`)}
          >
            Back to proposals
          </Button>
        </main>
      </div>
    );
  }

  const profile = proposal.freelancer.profile;
  const name = profile?.displayName ?? proposal.freelancer.email;
  const isPending = proposal.status === "PENDING";
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header role="CLIENT" />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href={`/client/jobs/${jobId}/proposals`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4fae2e]"
            >
              <ArrowLeft className="size-4" />
              Back to proposals
            </Link>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge
                  variant="secondary"
                  className={statusClass(proposal.status)}
                >
                  {proposal.status[0] + proposal.status.slice(1).toLowerCase()}
                </Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {proposal.job.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submitted{" "}
                  {proposal.submittedAt
                    ? new Date(proposal.submittedAt).toLocaleDateString()
                    : "Not submitted"}
                </p>
              </div>
              {isPending ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmReject(true)}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                    onClick={() => void accept()}
                  >
                    <Check className="size-4" />
                    Accept
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
          <article>
            <Card>
              <CardContent className="p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Cover letter</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {proposal.coverLetter}
                </p>
              </CardContent>
            </Card>
          </article>
          <aside className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage
                      src={profile?.avatarUrl ?? undefined}
                      alt={name}
                    />
                    <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {profile?.freelancerProfile?.title ?? "Freelancer"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link href={`/profiles/${proposal.freelancer.id}`}>
                    <UserRound className="size-4" />
                    View freelancer profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-5">
                <h2 className="font-semibold">Proposal terms</h2>
                <div>
                  <p className="text-sm text-muted-foreground">Bid amount</p>
                  <p className="mt-1 text-xl font-semibold text-[#3f9225]">
                    {money(proposal.bidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery time</p>
                  <p className="mt-1 font-medium">
                    {proposal.deliveryDays
                      ? `${proposal.deliveryDays} days`
                      : "Not set"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              The freelancer will see that this proposal was not selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRejecting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void reject();
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
