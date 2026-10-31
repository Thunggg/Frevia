"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Clock,
  Loader2,
  MessageSquare,
} from "@/components/icons";

import { accountProfileApi } from "@/apiRequests/account-profile";
import jobApiRequest from "@/apiRequests/job";
import { proposalApiRequest } from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  JobType,
  ProposalType,
  ViewJobDetailResType,
} from "@shared/types";
import { ProposalDialog } from "./proposal-dialog";

type JobDetailContentProps = {
  job: ViewJobDetailResType;
  role: UserRole;
  initialIsBookmarked: boolean;
  relatedJobs?: JobType[];
  relatedSkill?: string;
  existingProposal: ProposalType | null;
  embedded?: boolean;
  basePath?: string;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

// Trả về "loại" cảnh báo để component dịch theo ngôn ngữ đang chọn
function getDeadlineUrgencyKind(
  deadline: string | Date | null,
): "passed" | "soon" | null {
  if (!deadline) return null;

  const hoursUntil =
    (new Date(deadline).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursUntil < 0) return "passed";
  if (hoursUntil <= 72) return "soon";

  return null;
}

function isPast(value: string | Date | null) {
  return value !== null && new Date(value).getTime() <= Date.now();
}

const proposalStatusStyles = {
  DRAFT: "bg-slate-500/10 text-slate-700 dark:text-slate-200",
  SUBMITTED: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  INTERVIEWING:
    "bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300",
  HIRED: "bg-[#4fae2e]/15 text-[#3f9225] dark:text-[#7ad75d]",
  REJECTED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "",
  EXPIRED: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
} satisfies Record<ProposalType["status"], string>;

function JobDescription({ description }: { description: string | null }) {
  const t = useTranslations("jobDetail");

  if (!description) {
    return (
      <p className="mt-4 max-w-prose text-[15px] leading-8 text-muted-foreground">
        {t("noDescription")}
      </p>
    );
  }

  if (looksLikeHtml(description)) {
    return (
      <div
        className="job-description mt-4 max-w-prose text-[15px] leading-8 text-muted-foreground [&_a]:text-[#4fae2e] [&_a]:underline-offset-2 hover:[&_a]:underline [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <p className="mt-4 max-w-prose whitespace-pre-wrap text-[15px] leading-8 text-muted-foreground">
      {description}
    </p>
  );
}

export function JobDetailContent({
  job,
  role,
  initialIsBookmarked,
  relatedJobs = [],
  relatedSkill,
  existingProposal,
  embedded = false,
  basePath = embedded ? "/freelancer/find-work" : "/find-work",
}: JobDetailContentProps) {
  const router = useRouter();
  const t = useTranslations("jobDetail");
  const tStatus = useTranslations("jobStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientAvatar, setClientAvatar] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const canBookmark = role === "FREELANCER";
  const activeProposalQuery = useQuery({
    queryKey: ["proposals", "job", job.id, "mine"],
    queryFn: () => proposalApiRequest.getMyProposalForJob(job.id),
    enabled: canBookmark,
    initialData: existingProposal ?? undefined,
    retry: false,
  });
  const formatBudget = (
    target: Pick<ViewJobDetailResType, "budgetMin" | "budgetMax">,
  ) => {
    if (target.budgetMin === null || target.budgetMax === null) {
      return t("negotiable");
    }

    return `$${format.number(target.budgetMin)} - $${format.number(target.budgetMax)}`;
  };

  const formatDate = (value: string | Date | null) => {
    if (!value) return t("notSet");

    return format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPostedTime = (value: string | Date) => {
    const hours = Math.max(
      0,
      Math.floor((Date.now() - new Date(value).getTime()) / (60 * 60 * 1000)),
    );

    if (hours < 1) return tCommon("justNow");
    if (hours < 24) return tCommon("hoursAgo", { hours });

    return tCommon("daysAgo", { days: Math.floor(hours / 24) });
  };

  const activeProposal = activeProposalQuery.data ?? existingProposal;
  const canReceiveProposals =
    job.status === "OPEN" && !isPast(job.expiryDate) && !isPast(job.deadline);
  const proposalPresentation = activeProposal
    ? {
        badgeClassName: proposalStatusStyles[activeProposal.status],
        message: t(`proposal.${activeProposal.status}.message`),
      }
    : null;
  const deadlineUrgencyKind = getDeadlineUrgencyKind(job.deadline);
  const deadlineUrgencyLabel =
    deadlineUrgencyKind === "passed"
      ? t("deadlinePassed")
      : deadlineUrgencyKind === "soon"
        ? t("dueSoon")
        : null;
  const clientInitial = (clientName ?? "C").slice(0, 1).toUpperCase();

  useEffect(() => {
    let active = true;

    void (async () => {
      setClientLoading(true);
      try {
        const response = await accountProfileApi.getClientProfile(job.clientId);
        if (!active) return;
        setClientName(
          response.data.clientProfile.companyName ??
            response.data.displayName ??
            t("clientFallback", { id: job.clientId }),
        );
        setClientAvatar(response.data.avatarUrl ?? null);
      } catch {
        if (!active) return;
        setClientName(t("clientFallback", { id: job.clientId }));
        setClientAvatar(null);
      } finally {
        if (active) setClientLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [job.clientId, t]);

  const requireFreelancer = (action: () => void) => {
    if (role === "GUEST") {
      router.push("/login");
      return;
    }
    if (role !== "FREELANCER") {
      toastError({ message: t("switchToFreelancer") });
      return;
    }
    action();
  };

  const toggleBookmark = () => {
    requireFreelancer(() => {
      if (isBookmarked) {
        setIsRemoveDialogOpen(true);
        return;
      }

      void (async () => {
        setIsBookmarkLoading(true);
        try {
          await jobApiRequest.bookmarkJob(job.slug);
          setIsBookmarked(true);
          toastSuccess({ message: tBookmark("added") });
        } catch {
          toastError({
            message: tBookmark("updateFailed"),
          });
        } finally {
          setIsBookmarkLoading(false);
        }
      })();
    });
  };

  const removeBookmark = async () => {
    setIsBookmarkLoading(true);
    try {
      await jobApiRequest.removeBookmark(job.slug);
      setIsBookmarked(false);
      setIsRemoveDialogOpen(false);
      toastSuccess({ message: tBookmark("removed") });
    } catch {
      toastError({ message: tBookmark("removeFailed") });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const openProposalAction = () => {
    requireFreelancer(() => {
      if (activeProposal) {
        router.push(`/proposals/${activeProposal.id}`);
        return;
      }

      if (!canReceiveProposals) {
        toastError({ message: t("notAccepting") });
        return;
      }

      // Check once more when the button is clicked. This prevents opening a
      // new form if another tab has already saved or submitted a proposal.
      void activeProposalQuery
        .refetch()
        .then(({ data }) => {
          if (data) {
            router.push(`/proposals/${data.id}`);
            return;
          }
          setIsProposalDialogOpen(true);
        })
        .catch(() => {
          // The create endpoint remains the final concurrency guard. Do not
          // block a freelancer from applying solely because this lookup fails.
          setIsProposalDialogOpen(true);
        });
    });
  };

  const summaryRows = [
    { id: "budget", label: t("summary.budget"), value: formatBudget(job) },
    {
      id: "budgetType",
      label: t("summary.budgetType"),
      value: tBudgetType(job.budgetType),
    },
    {
      id: "posted",
      label: t("summary.posted"),
      value: formatPostedTime(job.createdAt),
    },
    {
      id: "deadline",
      label: t("summary.deadline"),
      value: formatDate(job.deadline),
    },
    { id: "expires", label: t("summary.expires"), value: formatDate(job.expiryDate) },
    { id: "status", label: t("summary.status"), value: tStatus(job.status) },
    // Job tuyển nhiều người: hiển thị số vị trí đã tuyển / cần tuyển.
    ...(job.hiringType === "MULTIPLE"
      ? [
          {
            id: "positions",
            label: t("summary.positions"),
            value: t("positionsFilled", {
              filled: job.positionsFilled,
              required: job.positionsRequired,
            }),
          },
        ]
      : []),
  ];

  const proposalActionLabel = activeProposal
    ? activeProposal.status === "DRAFT" && canReceiveProposals
      ? t("continueProposal")
      : t("viewProposal")
    : canReceiveProposals
      ? t("applyNow")
      : null;

  const actionButtons = (
    <>
      {canBookmark || role === "GUEST" ? (
        <Button
          size="icon"
          variant="outline"
          className="size-11 shrink-0 border-[#4fae2e]/35 bg-background"
          aria-label={isBookmarked ? tBookmark("remove") : tBookmark("save")}
          disabled={isBookmarkLoading}
          onClick={toggleBookmark}
        >
          {isBookmarkLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Bookmark
              className={`size-4 ${
                isBookmarked ? "fill-[#4fae2e] text-[#4fae2e]" : ""
              }`}
            />
          )}
        </Button>
      ) : null}
      {proposalActionLabel ? (
        <Button
          className="h-11 flex-1 bg-[#4fae2e] px-6 font-semibold text-white hover:bg-[#459928] active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a] sm:flex-none"
          disabled={canBookmark && activeProposalQuery.isFetching}
          onClick={openProposalAction}
        >
          {canBookmark && activeProposalQuery.isFetching
            ? t("checkingProposal")
            : proposalActionLabel}
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!embedded ? <Header role={role} /> : null}

      <main className="flex-1 pb-24 lg:pb-0">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/60">
              <nav className="flex min-w-0 items-center gap-2">
                <Link
                  href="/"
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  {tCommon("home")}
                </Link>
                <span className="text-foreground/35">/</span>
                <Link
                  href={basePath}
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  {t("findWork")}
                </Link>
                <span className="text-foreground/35">/</span>
                <span className="truncate font-medium text-foreground">
                  {job.title}
                </span>
              </nav>
              <Link
                href={basePath}
                className="inline-flex items-center gap-1.5 font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
              >
                <ArrowLeft className="size-4" />
                {t("backToJobs")}
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {job.featured ? (
                    <Badge className="bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                      {t("featured")}
                    </Badge>
                  ) : null}
                  {job.hiringType === "MULTIPLE" ? (
                    <Badge
                      variant="outline"
                      className="border-[#4fae2e]/40 bg-[#eaf8df] text-[#3f9225] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d]"
                    >
                      {t("positionsBadge", {
                        filled: job.positionsFilled,
                        required: job.positionsRequired,
                      })}
                    </Badge>
                  ) : null}
                  {deadlineUrgencyLabel ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    >
                      {deadlineUrgencyLabel}
                    </Badge>
                  ) : null}
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {job.title}
                </h1>

                <p className="mt-5 text-3xl font-semibold tracking-tight text-[#4fae2e] sm:text-4xl">
                  {formatBudget(job)}
                </p>
                <p className="mt-1 text-sm text-foreground/65 dark:text-foreground/70">
                  {tBudgetType(job.budgetType)}
                  <span className="mx-2 text-foreground/35">·</span>
                  {tStatus(job.status)}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/70 dark:text-foreground/75">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-[#4fae2e]" />
                    {t("postedAt", { time: formatPostedTime(job.createdAt) })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-[#4fae2e]" />
                    {t("deadlineAt", { date: formatDate(job.deadline) })}
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 lg:block">
                <div className="flex justify-end gap-2">{actionButtons}</div>
                {activeProposal && proposalPresentation ? (
                  <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                    <Badge
                      variant="secondary"
                      className={proposalPresentation.badgeClassName}
                    >
                      {tStatus(activeProposal.status)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {proposalPresentation.message}
                    </span>
                  </div>
                ) : null}
                {!canReceiveProposals ? (
                  <p className="mt-3 text-right text-sm text-muted-foreground">
                    {t("notAccepting")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-12">
          <div className="space-y-10 lg:col-span-8">
            <article>
              <section>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {t("jobDescription")}
                </h2>
                <JobDescription description={job.description} />
              </section>

              <section className="mt-10 border-t border-border pt-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {t("skillsRequired")}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.length ? (
                    job.skills.map((skill) => (
                      <Link
                        key={skill.skillId}
                        href={`${basePath}?keyword=${encodeURIComponent(skill.skill.name)}`}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-[#4fae2e]/50 hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                      >
                        {skill.skill.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("noSkills")}
                    </p>
                  )}
                </div>
              </section>

              {/* UC-46: danh mục công việc giúp freelancer duyệt/lọc các job cùng nhóm. */}
              <section className="mt-10 border-t border-border pt-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {t("categories")}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.jobCategories?.length ? (
                    job.jobCategories.map((jobCategory) => (
                      <Link
                        key={jobCategory.id}
                        href={`${basePath}?category=${encodeURIComponent(jobCategory.slug)}`}
                        className="rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-1.5 text-sm font-medium text-[#3f9225] transition-colors hover:border-[#4fae2e]/60 hover:bg-[#ddf2cd] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d] dark:hover:bg-[#4fae2e]/25"
                      >
                        {jobCategory.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("noCategories")}
                    </p>
                  )}
                </div>
              </section>
            </article>

            {relatedJobs.length > 0 ? (
              <section className="border-t border-border pt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {t("similarProjects")}
                    </h2>
                    {relatedSkill ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("relatedTo", { skill: relatedSkill })}
                      </p>
                    ) : null}
                  </div>
                  {relatedSkill ? (
                    <Link
                      href={`${basePath}?keyword=${encodeURIComponent(relatedSkill)}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
                    >
                      {t("viewMore")}
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>

                <ul className="mt-5 divide-y divide-border border-y border-border">
                  {relatedJobs.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`${embedded ? "/freelancer/jobs" : "/job"}/${item.slug}`}
                        className="group flex flex-col gap-1 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-medium text-foreground transition-colors group-hover:text-[#4fae2e]">
                          {item.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBudget(item)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-5 rounded-xl border border-border bg-background p-5 sm:p-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("summary.budget")}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#4fae2e]">
                  {formatBudget(job)}
                </p>
              </div>

              <dl className="divide-y divide-border border-y border-border">
                {summaryRows
                  .filter((row) => row.id !== "budget")
                  .map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground">
                        {row.value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">
                  {t("client")}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {clientAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clientAvatar}
                      alt={clientName ?? t("client")}
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#eaf8df] text-sm font-semibold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                      {clientLoading ? "…" : clientInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {clientLoading ? t("loading") : clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("clientOnFrevia")}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 h-11 w-full">
                  <Link href={`/clients/${job.clientId}`}>
                    {t("viewClientProfile")}
                  </Link>
                </Button>
                {canBookmark || role === "GUEST" ? (
                  <Button
                    variant="outline"
                    className="mt-2 h-11 w-full gap-2 border-[#4fae2e]/35 text-[#4fae2e] hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                    onClick={() => {
                      requireFreelancer(() => {
                        router.push(
                          `/conversations/new?participantId=${job.clientId}`,
                        );
                      });
                    }}
                  >
                    <MessageSquare className="size-4" />
                    {t("connectWithClient")}
                  </Button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/90 lg:hidden">
        {activeProposal && proposalPresentation ? (
          <div className="mx-auto mb-2 flex max-w-7xl items-center gap-2 text-xs">
            <Badge
              variant="secondary"
              className={proposalPresentation.badgeClassName}
            >
              {tStatus(activeProposal.status)}
            </Badge>
            <span className="truncate text-muted-foreground">
              {proposalPresentation.message}
            </span>
          </div>
        ) : null}
        {!canReceiveProposals ? (
          <p className="mx-auto mb-2 max-w-7xl text-xs text-muted-foreground">
            {t("notAccepting")}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-7xl justify-end gap-2">
          {actionButtons}
        </div>
      </div>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBookmarkLoading}>
              {t("removeDialog.cancel")}
            </AlertDialogCancel>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isBookmarkLoading}
              onClick={removeBookmark}
            >
              {isBookmarkLoading
                ? t("removeDialog.removing")
                : t("removeDialog.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProposalDialog
        jobId={job.id}
        jobTitle={job.title}
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
      />

      {!embedded ? <Footer /> : null}
    </div>
  );
}
