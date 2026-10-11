"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";

import { accountProfileApi } from "@/apiRequests/account-profile";
import jobApiRequest from "@/apiRequests/job";
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
import type { JobType, ViewJobDetailResType } from "@shared/types";

type JobDetailContentProps = {
  job: ViewJobDetailResType;
  role: UserRole;
  initialIsBookmarked: boolean;
  relatedJobs?: JobType[];
  relatedSkill?: string;
};

function formatBudget(job: Pick<ViewJobDetailResType, "budgetMin" | "budgetMax">) {
  if (job.budgetMin === null || job.budgetMax === null) {
    return "Negotiable";
  }

  return `$${job.budgetMin} - $${job.budgetMax}`;
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPostedTime(value: string | Date) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (60 * 60 * 1000)),
  );

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function formatBudgetType(value: string) {
  return value.replaceAll("_", " ");
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function getDeadlineUrgency(deadline: string | Date | null) {
  if (!deadline) return null;

  const hoursUntil =
    (new Date(deadline).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursUntil < 0) {
    return { label: "Deadline passed", urgent: true };
  }

  if (hoursUntil <= 72) {
    return { label: "Due soon", urgent: true };
  }

  return null;
}

function JobDescription({ description }: { description: string | null }) {
  if (!description) {
    return (
      <p className="mt-4 max-w-prose text-[15px] leading-8 text-muted-foreground">
        No description provided yet.
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
}: JobDetailContentProps) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const canBookmark = role === "FREELANCER";
  const deadlineUrgency = getDeadlineUrgency(job.deadline);
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
            `Client #${job.clientId}`,
        );
      } catch {
        if (!active) return;
        setClientName(`Client #${job.clientId}`);
      } finally {
        if (active) setClientLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [job.clientId]);

  const requireFreelancer = (action: () => void) => {
    if (role === "GUEST") {
      router.push("/login");
      return;
    }
    if (role !== "FREELANCER") {
      toastError({ message: "Switch to a freelancer account to continue." });
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
          toastSuccess({ message: "Job saved to bookmarks" });
        } catch {
          toastError({
            message: "Unable to update bookmark. Please try again.",
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
      toastSuccess({ message: "Bookmark removed" });
    } catch {
      toastError({ message: "Unable to remove bookmark. Please try again." });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleApply = () => {
    requireFreelancer(() => {
      toastError({
        message: "Applying to jobs is not available yet.",
      });
    });
  };

  const summaryRows = [
    { label: "Budget", value: formatBudget(job) },
    { label: "Budget type", value: formatBudgetType(job.budgetType) },
    { label: "Posted", value: formatPostedTime(job.createdAt) },
    { label: "Deadline", value: formatDate(job.deadline) },
    { label: "Expires", value: formatDate(job.expiryDate) },
    { label: "Status", value: job.status.replaceAll("_", " ") },
  ];

  const actionButtons = (
    <>
      {canBookmark || role === "GUEST" ? (
        <Button
          size="icon"
          variant="outline"
          className="size-11 shrink-0 border-[#4fae2e]/35 bg-background"
          aria-label={isBookmarked ? "Remove bookmark" : "Save job"}
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
      <Button
        className="h-11 flex-1 bg-[#4fae2e] px-6 font-semibold text-white hover:bg-[#459928] active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a] sm:flex-none"
        onClick={handleApply}
      >
        Apply now
      </Button>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1 pb-24 lg:pb-0">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/60">
              <nav className="flex min-w-0 items-center gap-2">
                <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                  Home
                </Link>
                <span className="text-foreground/35">/</span>
                <Link
                  href="/find-work"
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  Find Work
                </Link>
                <span className="text-foreground/35">/</span>
                <span className="truncate font-medium text-foreground">
                  {job.title}
                </span>
              </nav>
              <Link
                href="/find-work"
                className="inline-flex items-center gap-1.5 font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
              >
                <ArrowLeft className="size-4" />
                Back to jobs
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {job.featured ? (
                    <Badge className="bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                      Featured
                    </Badge>
                  ) : null}
                  {deadlineUrgency ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    >
                      {deadlineUrgency.label}
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
                  {formatBudgetType(job.budgetType)}
                  <span className="mx-2 text-foreground/35">·</span>
                  {job.status.replaceAll("_", " ")}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/70 dark:text-foreground/75">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-[#4fae2e]" />
                    Posted {formatPostedTime(job.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-[#4fae2e]" />
                    Deadline {formatDate(job.deadline)}
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 gap-2 lg:flex">{actionButtons}</div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-12">
          <div className="space-y-10 lg:col-span-8">
            <article>
              <section>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Job description
                </h2>
                <JobDescription description={job.description} />
              </section>

              <section className="mt-10 border-t border-border pt-10">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Skills required
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.length ? (
                    job.skills.map((skill) => (
                      <Link
                        key={skill.skillId}
                        href={`/find-work?keyword=${encodeURIComponent(skill.skill.name)}`}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-[#4fae2e]/50 hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                      >
                        {skill.skill.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills specified.
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
                      Similar projects
                    </h2>
                    {relatedSkill ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        More openings related to {relatedSkill}
                      </p>
                    ) : null}
                  </div>
                  {relatedSkill ? (
                    <Link
                      href={`/find-work?keyword=${encodeURIComponent(relatedSkill)}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
                    >
                      View more
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>

                <ul className="mt-5 divide-y divide-border border-y border-border">
                  {relatedJobs.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/job/${item.slug}`}
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
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#4fae2e]">
                  {formatBudget(job)}
                </p>
              </div>

              <dl className="divide-y divide-border border-y border-border">
                {summaryRows
                  .filter((row) => row.label !== "Budget")
                  .map((row) => (
                    <div
                      key={row.label}
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
                <p className="text-sm font-medium text-foreground">Client</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#eaf8df] text-sm font-semibold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                    {clientLoading ? "…" : clientInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {clientLoading ? "Loading..." : clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client on Frevia
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 h-11 w-full">
                  <Link href={`/clients/${job.clientId}`}>
                    View client profile
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/90 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">{actionButtons}</div>
      </div>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove saved job?</AlertDialogTitle>
            <AlertDialogDescription>
              This job will be removed from your saved jobs. You can save it
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBookmarkLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isBookmarkLoading}
              onClick={removeBookmark}
            >
              {isBookmarkLoading ? "Removing..." : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
