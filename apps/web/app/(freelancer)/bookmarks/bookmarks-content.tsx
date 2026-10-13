"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  Clock,
  DollarSign,
  MapPin,
  X,
} from "lucide-react";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ViewBookmarkedJobResponseType } from "@shared/types";

type BookmarksContentProps = {
  initialJobs: ViewBookmarkedJobResponseType["data"];
  pagination: ViewBookmarkedJobResponseType["pagination"];
};

function formatBudget(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (job.budgetMin === null || job.budgetMax === null) return "Negotiable";
  return `$${job.budgetMin} - $${job.budgetMax}`;
}

function formatPostedTime(value: string | Date) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000),
  );
  return hours < 24
    ? `Posted ${hours || "just"} ${hours ? "hours" : "now"} ago`
    : `Posted ${Math.floor(hours / 24)} days ago`;
}

function getAvailability(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (!job.expiryDate) return { label: "AVAILABLE", isExpiring: false };
  const hoursUntilExpiry =
    (new Date(job.expiryDate).getTime() - Date.now()) / 3_600_000;
  return hoursUntilExpiry <= 24
    ? { label: "EXPIRING SOON", isExpiring: true }
    : { label: "AVAILABLE", isExpiring: false };
}

export function BookmarksContent({
  initialJobs,
  pagination,
}: BookmarksContentProps) {
  const router = useRouter();
  const [pendingRemoveJobSlug, setPendingRemoveJobSlug] = useState<
    string | null
  >(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const removeBookmark = async (slug: string) => {
    setIsRemoving(true);
    try {
      await jobApiRequest.removeBookmark(slug);
      toastSuccess({ message: "Bookmark removed" });
      setPendingRemoveJobSlug(null);
      router.refresh();
    } catch {
      toastError({ message: "Couldn't remove bookmark. Try again." });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Bookmarks</span>
            </nav>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <Bookmark className="size-7 fill-[#4fae2e] text-[#4fae2e]" />
                  Saved Jobs
                </h1>
                <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
                  Jobs you&apos;ve bookmarked for later.
                </p>
              </div>
              <p className="text-sm text-foreground/65">
                <span className="font-semibold text-foreground">
                  {pagination.total}
                </span>{" "}
                {pagination.total === 1 ? "saved job" : "saved jobs"}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {initialJobs.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {initialJobs.map((job) => {
                const availability = getAvailability(job);
                return (
                  <li key={job.id}>
                    <div className="flex flex-col justify-between gap-4 px-3 py-6 transition-colors hover:bg-[#eaf8df]/35 sm:flex-row sm:items-start sm:px-5 sm:py-7 dark:hover:bg-white/[0.04]">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge
                            variant={
                              availability.isExpiring
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              availability.isExpiring
                                ? ""
                                : "bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15"
                            }
                          >
                            {availability.label}
                          </Badge>
                          <Badge variant="secondary">
                            {job.status.replaceAll("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatPostedTime(job.createdAt)}
                          </span>
                        </div>
                        <Link
                          href={`/job/${job.slug}`}
                          className="mt-2 block w-fit text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-[#4fae2e]"
                        >
                          {job.title}
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 text-[#4fae2e]" />
                            Remote (Worldwide)
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <DollarSign className="size-4 text-[#4fae2e]" />
                            {formatBudget(job)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-4 text-[#4fae2e]" />
                            {job.budgetType.replaceAll("_", " ")}
                          </span>
                        </div>
                        {job.skills.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {job.skills.map((skill) => (
                              <Badge
                                key={skill.skillId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill.skill.name}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                        <Button
                          asChild
                          className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                        >
                          <Link href={`/job/${job.slug}`}>
                            <BriefcaseBusiness className="mr-2 size-4" />
                            View job
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setPendingRemoveJobSlug(job.slug)}
                        >
                          <X className="mr-1 size-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                <Bookmark className="size-7" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No saved jobs yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Bookmark jobs from Find Work to keep them here.
              </p>
              <Button
                asChild
                className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href="/find-work">Browse jobs</Link>
              </Button>
            </div>
          )}

          {pagination.page < pagination.totalPages ? (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/bookmarks?page=${pagination.page + 1}`)
                }
              >
                Load more saved jobs
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <AlertDialog
        open={pendingRemoveJobSlug !== null}
        onOpenChange={(open) => !open && setPendingRemoveJobSlug(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove saved job?</AlertDialogTitle>
            <AlertDialogDescription>
              This job leaves your Bookmarks. You can save it again anytime from
              Find Work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={() =>
                pendingRemoveJobSlug && removeBookmark(pendingRemoveJobSlug)
              }
            >
              {isRemoving ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
