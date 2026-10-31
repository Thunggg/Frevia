"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, ArrowRight } from "@/components/icons";
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

const PROPOSAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "INTERVIEWING",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
] as const satisfies readonly ProposalStatusType[];

export function MyProposalsContent({
  result,
  embedded = false,
  basePath,
}: {
  result: MyProposalsResponseType | null;
  embedded?: boolean;
  basePath?: string;
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
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role="FREELANCER" />}
      <main className="flex-1">
        <section
          className={
            embedded
              ? "border-b border-border bg-background"
              : "border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]"
          }
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("count", { count: pagination.totalItems })}
            </p>
            <Select
              value={currentStatus}
              onValueChange={(value) =>
                router.push(
                  value === "ALL"
                    ? effectiveBasePath
                    : `${effectiveBasePath}?status=${value}`,
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                {PROPOSAL_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tStatus(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {proposalsQuery.isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              {t("loadFailed")}
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
                            proposal.status === "HIRED" ? "default" : "secondary"
                          }
                          className={
                            proposal.status === "SUBMITTED"
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                              : proposal.status === "INTERVIEWING"
                                ? "bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300"
                                : ""
                          }
                        >
                          {tStatus(proposal.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {date(proposal.submittedAt)}
                        </span>
                      </div>
                      <Link
                        href={`${effectiveBasePath}/${proposal.id}`}
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
                          <span className="text-muted-foreground">
                            {t("bidLabel")}{" "}
                          </span>
                          <strong>{budget(proposal.bidAmount)}</strong>
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            {t("deliveryLabel")}{" "}
                          </span>
                          <strong>
                            {proposal.deliveryDays
                              ? t("deliveryDays", {
                                  count: proposal.deliveryDays,
                                })
                              : tCommon("notSet")}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="shrink-0">
                      <Link href={`${effectiveBasePath}/${proposal.id}`}>
                        {tCommon("view")}{" "}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <FileText className="mx-auto size-8 text-[#4fae2e]" />
              <h2 className="mt-4 text-lg font-semibold">{t("empty")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("emptyHint")}
              </p>
              <Button
                asChild
                className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href={embedded ? "/freelancer/find-work" : "/find-work"}>
                  {t("findWork")}
                </Link>
              </Button>
            </div>
          )}
          {pagination.page < pagination.totalPages ? (
            <div className="mt-7 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  const query = new URLSearchParams();
                  query.set("page", String(pagination.page + 1));
                  if (selectedStatus) query.set("status", selectedStatus);
                  router.replace(`${effectiveBasePath}?${query.toString()}`, {
                    scroll: false,
                  });
                }}
              >
                {tCommon("loadMore")}
              </Button>
            </div>
          ) : null}
        </section>
      </main>
      {!embedded && <Footer />}
    </div>
  );
}
