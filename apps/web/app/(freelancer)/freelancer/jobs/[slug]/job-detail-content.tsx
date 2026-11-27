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
import {
  MapPin,
  ShieldCheck,
  Briefcase,
  DollarSign,
  Tag,
  Users,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

import { accountProfileApi } from "@/apiRequests/account-profile";
import jobApiRequest from "@/apiRequests/job";
import { proposalApiRequest } from "@/apiRequests/proposal";
import { useActionPermission } from "@/hooks/use-action-permission";
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
import { getBookmarkErrorMessage } from "@/lib/utils";
import {
  VerificationStatus,
  type JobType,
  type ProposalType,
  type ViewJobDetailResType,
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
  currentUserId?: number;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

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

const proposalStatusStyles: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-700 dark:text-slate-200",
  SUBMITTED: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  HIRED: "bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300",
  REJECTED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "bg-zinc-500/10 text-zinc-600",
  EXPIRED: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
};

function JobDescription({ description }: { description: string | null }) {
  const t = useTranslations("jobDetail");

  if (!description) {
    return (
      <p className="mt-2 max-w-prose text-sm sm:text-base leading-relaxed text-muted-foreground">
        {t("noDescription")}
      </p>
    );
  }

  if (looksLikeHtml(description)) {
    return (
      <div
        className="job-description max-w-none text-sm sm:text-base leading-relaxed text-foreground/90 [&_a]:text-[#0069D3] [&_a]:underline hover:[&_a]:text-[#005bb8] [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-foreground/90">
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
  basePath = "/freelancer/find-work",
  currentUserId,
}: JobDetailContentProps) {
  const router = useRouter();
  const t = useTranslations("jobDetail");
  const tStatus = useTranslations("jobStatus");
  const tProposalStatus = useTranslations("proposalStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const tHiringType = useTranslations("jobHiringType");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isKYCDialogOpen, setIsKYCDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientAvatar, setClientAvatar] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{
    name: string;
    avatarUrl: string | null;
    createdAt: string | Date | null;
    companyName: string | null;
  } | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const { can } = useActionPermission();
  const canAddBookmark = can("POST", "/api/manage-jobs/jobs/:slug/bookmark");
  const canRemoveBookmark = can("DELETE", "/api/manage-jobs/bookmarks/:slug");
  const canViewMyProposal =
    role === "FREELANCER" &&
    (can("GET", "/api/proposals/jobs/:jobId/mine") ||
      can("GET", "/api/proposals/my"));
  const canCreateProposal = can("POST", "/api/proposals/jobs/:jobId");
  const canSaveDraft = can("POST", "/api/proposals/jobs/:jobId/drafts");
  const canViewDetail = can("GET", "/api/proposals/:id");

  const isOwnJob = currentUserId != null && job.clientId === currentUserId;
  const isClientRole = role === "CLIENT" || isOwnJob;
  const canBookmark =
    role === "FREELANCER" && !isOwnJob && (canAddBookmark || canRemoveBookmark);

  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  useEffect(() => {
    const handleBookmarkUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        slug: string;
        isBookmarked: boolean;
      }>;
      if (!customEvent.detail) return;
      if (customEvent.detail.slug === job.slug) {
        setIsBookmarked(customEvent.detail.isBookmarked);
      }
    };

    window.addEventListener("frevia:bookmark-updated", handleBookmarkUpdated);
    return () => {
      window.removeEventListener(
        "frevia:bookmark-updated",
        handleBookmarkUpdated,
      );
    };
  }, [job.slug]);

  const activeProposalQuery = useQuery({
    queryKey: ["proposals", "job", job.id, "mine"],
    queryFn: () => proposalApiRequest.getMyProposalForJob(job.id),
    enabled: canViewMyProposal,
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
  const isPositionsFilled = job.positionsFilled >= job.positionsRequired;
  const isExpired = isPast(job.expiryDate);
  const isDeadlinePassed = isPast(job.deadline);
  const canReceiveProposals =
    job.status === "OPEN" &&
    !isExpired &&
    !isDeadlinePassed &&
    !isPositionsFilled;

  const proposalPresentation = activeProposal
    ? {
      badgeClassName: proposalStatusStyles[activeProposal.status] || "bg-muted text-muted-foreground",
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
        const name =
          response.data.clientProfile.companyName ??
          response.data.displayName ??
          t("clientFallback", { id: job.clientId });
        setClientName(name);
        setClientAvatar(response.data.avatarUrl ?? null);
        setClientData({
          name,
          avatarUrl: response.data.avatarUrl ?? null,
          createdAt: response.data.createdAt ?? null,
          companyName: response.data.clientProfile.companyName ?? null,
        });
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
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      const loginUrl = currentPath
        ? `/login?redirect=${encodeURIComponent(currentPath)}`
        : "/login";
      router.push(loginUrl);
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

      if (!canAddBookmark) {
        toastError({ message: tBookmark("noPermission") });
        return;
      }

      void (async () => {
        setIsBookmarkLoading(true);
        try {
          await jobApiRequest.bookmarkJob(job.slug);
          setIsBookmarked(true);
          toastSuccess({ message: tBookmark("added") });
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("frevia:bookmark-updated", {
                detail: { slug: job.slug, isBookmarked: true },
              }),
            );
          }
        } catch (error) {
          toastError({
            message: getBookmarkErrorMessage(error, tBookmark, false),
          });
        } finally {
          setIsBookmarkLoading(false);
        }
      })();
    });
  };

  const removeBookmark = async () => {
    if (!canRemoveBookmark) {
      toastError({ message: tBookmark("noPermission") });
      return;
    }
    setIsBookmarkLoading(true);
    try {
      await jobApiRequest.removeBookmark(job.slug);
      setIsBookmarked(false);
      setIsRemoveDialogOpen(false);
      toastSuccess({ message: tBookmark("removed") });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("frevia:bookmark-updated", {
            detail: { slug: job.slug, isBookmarked: false },
          }),
        );
      }
    } catch (error) {
      toastError({
        message: getBookmarkErrorMessage(error, tBookmark, true),
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const ensureIdentityVerified = async () => {
    try {
      const status = await accountProfileApi.getIdentityStatus();
      if (status.data?.status !== VerificationStatus.APPROVED) {
        setIsKYCDialogOpen(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const openProposalAction = () => {
    requireFreelancer(async () => {
      const verified = await ensureIdentityVerified();
      if (!verified) return;

      if (activeProposal) {
        if (!canViewDetail) {
          toastError({ message: tBookmark("viewListAccessDenied") });
          return;
        }
        router.push(`/freelancer/proposals/${activeProposal.id}`);
        return;
      }

      if (!canReceiveProposals) {
        toastError({ message: t("notAccepting") });
        return;
      }

      if (!canCreateProposal && !canSaveDraft) {
        toastError({ message: t("cannotApplyOwnJob") });
        return;
      }

      void activeProposalQuery
        .refetch()
        .then(({ data }) => {
          if (data) {
            router.push(`/freelancer/proposals/${data.id}`);
            return;
          }
          setIsProposalDialogOpen(true);
        })
        .catch(() => {
          setIsProposalDialogOpen(true);
        });
    });
  };

  const realProposalsCount = job.proposalsCount ?? (activeProposal ? 1 : 0);

  const proposalActionLabel = activeProposal
    ? canViewDetail
      ? activeProposal.status === "DRAFT" && canReceiveProposals
        ? t("continueProposal")
        : t("viewProposal")
      : null
    : canReceiveProposals && (role !== "FREELANCER" || canCreateProposal || canSaveDraft)
      ? t("applyNow")
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {!embedded ? <Header role={role} /> : null}

      <main className="flex-1 pb-24 lg:pb-16">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          {/* Top Breadcrumb & Back Link */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
            <nav className="flex min-w-0 items-center gap-2">
              <Link href="/" className="hover:text-[#0069D3] transition-colors">
                {tCommon("home")}
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <Link href={basePath} className="hover:text-[#0069D3] transition-colors">
                {isClientRole ? tCommon("jobs") || "Jobs" : t("findWork")}
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <span className="truncate font-medium text-foreground">
                {job.title}
              </span>
            </nav>

            <Link
              href={basePath}
              className="inline-flex items-center gap-1.5 font-medium text-[#0069D3] hover:text-[#005bb8] transition-colors"
            >
              <ArrowLeft className="size-4" />
              {t("backToJobs")}
            </Link>
          </div>

          {/* Main Single-Column Content matching Image 1 */}
          <div className="space-y-8">
            {/* 1. Header: Job Title, Meta & Primary Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {deadlineUrgencyLabel && (
                  <Badge
                    variant="outline"
                    className="border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {deadlineUrgencyLabel}
                  </Badge>
                )}
                {job.status !== "OPEN" && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {tStatus(job.status)}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
                    <span>{t("postedAt", { time: formatPostedTime(job.createdAt) })}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span>{t("worldwide")}</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Proposal status card if applied */}
              {activeProposal && proposalPresentation && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={proposalPresentation.badgeClassName}
                    >
                      {tProposalStatus(activeProposal.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {proposalPresentation.message}
                  </p>
                </div>
              )}

              {/* Closed job alert if any */}
              {!canReceiveProposals && !activeProposal ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-xs font-medium text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900">
                  {isPositionsFilled
                    ? t("positionsFilledClosed", {
                      filled: job.positionsFilled,
                      required: job.positionsRequired,
                    })
                    : isExpired
                      ? t("expiredClosed")
                      : isDeadlinePassed
                        ? t("deadlinePassedClosed")
                        : t("notAccepting")}
                </div>
              ) : null}
            </div>

            {/* 2. Summary Section */}
            <section className="pt-2">
              <h2 className="text-sm sm:text-base font-semibold text-foreground mb-3">
                {t("summaryHeading")}
              </h2>
              <JobDescription description={job.description} />
            </section>

            {/* 3. Key Attributes 2x3 Grid matching Image 1 (Monochrome, minimal borders) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 py-6">
              {/* 1. Work type / Hours */}
              <div className="flex items-start gap-3">
                <Clock className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {tBudgetType(job.budgetType)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("projectType")}
                  </p>
                </div>
              </div>

              {/* 2. Duration / Deadline */}
              <div className="flex items-start gap-3">
                <CalendarDays className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {formatDate(job.deadline)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("duration")}
                  </p>
                </div>
              </div>

              {/* 3. Hiring Capacity */}
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {job.hiringType === "MULTIPLE"
                      ? t("positionsBadge", {
                        filled: job.positionsFilled,
                        required: job.positionsRequired,
                      })
                      : tHiringType("SINGLE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("hiringCapacity")}
                  </p>
                </div>
              </div>

              {/* 4. Budget Range */}
              <div className="flex items-start gap-3">
                <DollarSign className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {formatBudget(job)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tBudgetType(job.budgetType)}
                  </p>
                </div>
              </div>

              {/* 5. Location */}
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t("remoteJob")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("location")}
                  </p>
                </div>
              </div>

              {/* 6. Project Status */}
              <div className="flex items-start gap-3">
                <Briefcase className="size-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {tStatus(job.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("projectType")}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Skills and Expertise */}
            <section className="pt-2">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("skillsAndExpertise")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.length > 0 ? (
                  job.skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {skill.skill.name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("noSkills")}
                  </p>
                )}

                {job.jobCategories?.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-transparent px-3.5 py-1.5 text-xs font-medium text-foreground dark:border-zinc-700"
                  >
                    <Tag className="size-3 text-muted-foreground" />
                    {cat.name}
                  </span>
                ))}
              </div>
            </section>

            {/* 6. Activity on this job (Strictly database data only) */}
            <section className="border-t border-border/60 pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("activityOnThisJob")}
              </h3>
              <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground">
                    {t("proposalsActivity")}
                  </span>
                  <HelpCircle className="size-3.5 text-muted-foreground/60" />
                  <span className="font-bold text-foreground ml-1">
                    {realProposalsCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-foreground">
                    {t("lastViewedByClient")}
                  </span>
                  <HelpCircle className="size-3.5 text-muted-foreground/60" />
                  <span className="font-medium text-foreground ml-1">
                    {formatPostedTime(job.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* 7. About the client (At the bottom, strictly database data) */}
            <section className="border-t border-border/60 pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("aboutTheClient")}
              </h3>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {t("memberSince", {
                    date: clientData?.createdAt
                      ? formatDate(clientData.createdAt)
                      : "2024",
                  })}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {clientAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={clientAvatar}
                          alt={clientName ?? t("client")}
                          className="size-11 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                          {clientLoading ? "…" : clientInitial}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {clientLoading ? t("loading") : clientName}
                        </p>
                      </div>
                    </div>

                    {!isClientRole && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-semibold border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        onClick={() => {
                          requireFreelancer(() => {
                            router.push(
                              `/conversations/new?participantId=${job.clientId}`,
                            );
                          });
                        }}
                      >
                        <MessageSquare className="mr-1.5 size-3.5" />
                        {t("connectWithClient")}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-zinc-700 dark:text-zinc-300" />
                      Payment method verified
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Escrow funded & verified
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Action Row (for convenience when scrolled down) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
              <div>
                <p className="text-xs text-muted-foreground">{t("summary.budget")}</p>
                <p className="text-xl font-bold text-foreground">{formatBudget(job)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {isClientRole ? (
                  <Button
                    asChild
                    className="h-10 rounded-xl bg-black px-5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer shadow-xs"
                  >
                    <Link href={`/client/jobs/${job.id}/proposals`}>
                      <Users className="mr-2 size-4" />
                      {t("checkProposalsBtn")} ({realProposalsCount})
                    </Link>
                  </Button>
                ) : (
                  <>
                    {proposalActionLabel && (
                      <Button
                        className="h-10 rounded-xl bg-black px-6 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer shadow-xs"
                        disabled={canBookmark && activeProposalQuery.isFetching}
                        onClick={openProposalAction}
                      >
                        {canBookmark && activeProposalQuery.isFetching
                          ? t("checkingProposal")
                          : proposalActionLabel}
                      </Button>
                    )}

                    {canBookmark || role === "GUEST" ? (
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-zinc-300 px-4 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={toggleBookmark}
                        disabled={isBookmarkLoading}
                      >
                        {isBookmarkLoading ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <Bookmark
                            className={`mr-1.5 size-4 ${isBookmarked ? "fill-foreground text-foreground" : ""
                              }`}
                          />
                        )}
                        {isBookmarked ? tBookmark("remove") : tBookmark("save")}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* Similar projects if any */}
            {relatedJobs.length > 0 && (
              <section className="border-t border-border/60 pt-6">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-lg font-bold text-foreground">
                    {t("similarProjects")}
                  </h3>
                  {relatedSkill && (
                    <Link
                      href={`${basePath}?keyword=${encodeURIComponent(relatedSkill)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline hover:text-muted-foreground"
                    >
                      {t("viewMore")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
                <ul className="divide-y divide-border border-y border-border">
                  {relatedJobs.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/job/${item.slug}`}
                        className="group flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 transition-colors hover:bg-muted/30 px-2 rounded-lg"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:underline transition-colors">
                          {item.title}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {formatBudget(item)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Bar on Mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">{t("summary.budget")}</p>
            <p className="text-sm font-bold text-foreground">{formatBudget(job)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isClientRole ? (
              <Button asChild size="sm" className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                <Link href={`/client/jobs/${job.id}/proposals`}>
                  {t("checkProposalsBtn")} ({realProposalsCount})
                </Link>
              </Button>
            ) : (
              <>
                {canBookmark || role === "GUEST" ? (
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9 border-zinc-300 dark:border-zinc-700"
                    onClick={toggleBookmark}
                  >
                    <Bookmark
                      className={`size-4 ${isBookmarked ? "fill-foreground text-foreground" : ""
                        }`}
                    />
                  </Button>
                ) : null}
                {proposalActionLabel && (
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold"
                    onClick={openProposalAction}
                  >
                    {proposalActionLabel}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("removeDialog.cancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
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

      <AlertDialog open={isKYCDialogOpen} onOpenChange={setIsKYCDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kycDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("kycDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("kycDialog.cancel")}</AlertDialogCancel>
            <Button
              className="bg-[#0069D3] text-white hover:bg-[#005bb8]"
              onClick={() => {
                setIsKYCDialogOpen(false);
                router.push("/freelancer/profile?tab=identity");
              }}
            >
              {t("kycDialog.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProposalDialog
        jobId={job.id}
        jobTitle={job.title}
        budgetMin={job.budgetMin !== null ? Number(job.budgetMin) : null}
        budgetMax={job.budgetMax !== null ? Number(job.budgetMax) : null}
        deadline={job.deadline}
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
      />

      {!embedded ? <Footer /> : null}
    </div>
  );
}
