"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";

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
import type { ViewJobDetailResType } from "@shared/types";

type JobDetailContentProps = {
  job: ViewJobDetailResType;
  role: UserRole;
  initialIsBookmarked: boolean;
};

function formatBudget(job: ViewJobDetailResType) {
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

export function JobDetailContent({
  job,
  role,
  initialIsBookmarked,
}: JobDetailContentProps) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const canBookmark = role === "FREELANCER";

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

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
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

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-4 flex flex-wrap gap-2">
                  {job.featured ? (
                    <Badge className="bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                      Featured
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className="border-[#4fae2e]/35 bg-background/50"
                  >
                    {formatBudgetType(job.budgetType)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border bg-background/50"
                  >
                    {job.status.replaceAll("_", " ")}
                  </Badge>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {job.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/70 dark:text-foreground/75">
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="size-4 text-[#4fae2e]" />
                    {formatBudget(job)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-[#4fae2e]" />
                    {formatPostedTime(job.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-[#4fae2e]" />
                    Deadline {formatDate(job.deadline)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 lg:pt-1">
                {canBookmark || role === "GUEST" ? (
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11 border-[#4fae2e]/35 bg-background/60"
                    aria-label={
                      isBookmarked ? "Remove bookmark" : "Save job"
                    }
                    disabled={isBookmarkLoading}
                    onClick={toggleBookmark}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Bookmark
                        className={`size-4 ${
                          isBookmarked
                            ? "fill-[#4fae2e] text-[#4fae2e]"
                            : ""
                        }`}
                      />
                    )}
                  </Button>
                ) : null}
                <Button
                  className="h-11 bg-[#4fae2e] px-6 font-semibold text-white hover:bg-[#459928] active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
                  onClick={handleApply}
                >
                  Apply now
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-12">
          <article className="lg:col-span-8">
            <section>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Job description
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                {job.description ?? "No description provided yet."}
              </p>
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
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-[#4fae2e]/50 hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-[#12331f]"
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

          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-4 rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Project summary
              </h2>

              <dl className="divide-y divide-border border-y border-border">
                {summaryRows.map((row) => (
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
                <p className="mt-1 text-sm text-muted-foreground">
                  View the client profile for more context before you apply.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-3 h-11 w-full"
                >
                  <Link href={`/clients/${job.clientId}`}>
                    View client profile
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

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
