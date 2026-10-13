"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type {
  MyProposalsResponseType,
  ProposalStatusType,
} from "@shared/types";

const statusLabels: Record<ProposalStatusType, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function budget(value: number | null) {
  return value === null ? "No bid" : `$${value.toLocaleString()}`;
}
function date(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not submitted";
}

export function MyProposalsContent({
  result,
}: {
  result: MyProposalsResponseType | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedStatus = searchParams.get(
    "status",
  ) as ProposalStatusType | null;
  const selectedPage = Number(searchParams.get("page")) || 1;
  const proposalsQuery = useQuery({
    queryKey: ["proposals", "my", selectedPage, selectedStatus],
    queryFn: () =>
      proposalApiRequest
        .getMyProposals({
          page: selectedPage,
          limit: 10,
          status: selectedStatus ?? undefined,
        })
        .then(extractProposalData),
    initialData: result ?? undefined,
  });
  const liveResult = proposalsQuery.data ?? result;
  const data = liveResult?.data ?? [];
  const pagination = liveResult ?? {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  };
  const currentStatus = selectedStatus ?? "ALL";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              My Proposals
            </h1>
            <p className="mt-2 text-foreground/70">
              Track drafts and submitted proposals in one place.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {pagination.totalItems} proposal
              {pagination.totalItems === 1 ? "" : "s"}
            </p>
            <Select
              value={currentStatus}
              onValueChange={(value) =>
                router.push(
                  value === "ALL" ? "/proposals" : `/proposals?status=${value}`,
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {proposalsQuery.isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              We couldn&apos;t load your proposals. Please refresh and try
              again.
            </div>
          ) : data.length ? (
            <div className="divide-y divide-border border-y border-border">
              {data.map((proposal) => (
                <article key={proposal.id} className="px-1 py-5 sm:px-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            proposal.status === "ACCEPTED"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            proposal.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                              : ""
                          }
                        >
                          {statusLabels[proposal.status]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {date(proposal.submittedAt)}
                        </span>
                      </div>
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="mt-2 block text-lg font-semibold tracking-tight hover:text-[#4fae2e]"
                      >
                        {proposal.job.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {proposal.client.profile?.displayName ??
                          proposal.client.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <span>
                          <span className="text-muted-foreground">Bid </span>
                          <strong>{budget(proposal.bidAmount)}</strong>
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            Delivery{" "}
                          </span>
                          <strong>
                            {proposal.deliveryDays
                              ? `${proposal.deliveryDays} days`
                              : "Not set"}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="shrink-0">
                      <Link href={`/proposals/${proposal.id}`}>
                        View <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <FileText className="mx-auto size-8 text-[#4fae2e]" />
              <h2 className="mt-4 text-lg font-semibold">No proposals yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Find a project that matches your skills and send your first
                proposal.
              </p>
              <Button
                asChild
                className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href="/find-work">Find work</Link>
              </Button>
            </div>
          )}
          {pagination.page < pagination.totalPages ? (
            <div className="mt-7 text-center">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/proposals?page=${pagination.page + 1}`)
                }
              >
                Load more
              </Button>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
