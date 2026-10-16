"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Trash2,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ViewBookmarkedJobResponseType } from "@shared/types";

type BookmarksContentProps = {
  initialJobs: ViewBookmarkedJobResponseType["data"];
  pagination: ViewBookmarkedJobResponseType["pagination"];
  embedded?: boolean;
  basePath?: string;
};

function formatBudget(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (job.budgetMin === null || job.budgetMax === null) return "Negotiable";
  return `$${job.budgetMin.toLocaleString()} – $${job.budgetMax.toLocaleString()}`;
}

function formatPostedTime(value: string | Date) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000),
  );
  return hours < 24
    ? `${hours || "just"} ${hours ? "h" : "now"} ago`
    : `${Math.floor(hours / 24)}d ago`;
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
  embedded = false,
  basePath,
}: BookmarksContentProps) {
  const router = useRouter();
  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/bookmarks" : "/bookmarks");
  const jobBaseUrl = embedded ? "/freelancer/jobs" : "/job";

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

  const goToPage = (page: number) => {
    router.push(`${effectiveBasePath}?page=${page}`);
  };

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role="FREELANCER" />}

      <main className="flex-1 font-sans">
        {/* Page Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {!embedded && (
              <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground font-medium"
                >
                  Home
                </Link>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-foreground font-medium">Bookmarks</span>
              </nav>
            )}

            <div
              className={`${
                !embedded ? "mt-4" : ""
              } flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                  Saved Jobs
                </h1>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Jobs you&apos;ve bookmarked for later.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3.5 py-1 text-xs font-medium text-muted-foreground">
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "saved job" : "saved jobs"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {initialJobs.length ? (
            <div className="space-y-3">
              {initialJobs.map((job, index) => {
                const availability = getAvailability(job);
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.03,
                    }}
                    className="group relative flex flex-col justify-between rounded-[28px] border border-border bg-card p-5 sm:p-6 transition-all hover:bg-accent/10 shadow-xs font-sans"
                  >
                    <div>
                      {/* Top Badges & Remove Bookmark Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                              availability.isExpiring
                                ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                            }`}
                          >
                            {availability.label}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300 px-3 py-0.5 text-xs font-semibold">
                            {job.status.replaceAll("_", " ")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                            <Clock className="size-3.5" />
                            {formatPostedTime(job.createdAt)}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => setPendingRemoveJobSlug(job.slug)}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer outline-none"
                          title="Remove from bookmarks"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Job Title & Budget */}
                      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <Link
                          href={`${jobBaseUrl}/${job.slug}`}
                          className="text-base sm:text-lg font-bold text-foreground hover:text-[#4fae2e] transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        <div className="shrink-0 text-xs sm:text-sm font-semibold text-foreground">
                          {formatBudget(job)}{" "}
                          <span className="font-normal text-muted-foreground capitalize">
                            ({job.budgetType.toLowerCase().replace("_", " ")})
                          </span>
                        </div>
                      </div>

                      {/* Location / Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-normal">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          Remote (Worldwide)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Skills & View Action */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {job.skills?.length > 0 ? (
                          job.skills.map((skill) => (
                            <span
                              key={skill.skillId}
                              className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800/80 px-3 py-1 text-xs font-medium text-foreground"
                            >
                              {skill.skill.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            General project
                          </span>
                        )}
                      </div>

                      <Link
                        href={`${jobBaseUrl}/${job.slug}`}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:translate-x-0.5"
                      >
                        <BriefcaseBusiness className="size-3.5" />
                        <span>View job</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-20 text-center font-sans"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
                <Bookmark className="size-6" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No saved jobs yet
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Bookmark jobs from Find Work to keep track of projects you&apos;re interested in.
              </p>
              <Button
                asChild
                className="mt-6 gap-2 rounded-full bg-[#4fae2e] text-xs font-medium text-white hover:bg-[#459928]"
              >
                <Link href={embedded ? "/freelancer/find-work" : "/find-work"}>
                  Browse jobs
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full cursor-pointer"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full cursor-pointer"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Modern Capsule Remove Alert Dialog */}
      <AlertDialog
        open={pendingRemoveJobSlug !== null}
        onOpenChange={(open) => !open && setPendingRemoveJobSlug(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground font-sans">
                Remove saved job
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal font-sans">
                Are you sure you want to remove this job from your bookmarks? You can always save it again from Find Work.
              </AlertDialogDescription>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() =>
                  pendingRemoveJobSlug && void removeBookmark(pendingRemoveJobSlug)
                }
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 outline-none disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                    {isRemoving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">Remove bookmark</span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel asChild>
                <button
                  type="button"
                  disabled={isRemoving}
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

      {!embedded && <Footer />}
    </div>
  );
}
