"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Tag,
} from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";
import type { ViewJobCategoryDetailResponseType } from "@shared/types";
import { JobCard } from "../../../_components/job-card";

type CategoryDetailContentProps = {
  jobCategory: ViewJobCategoryDetailResponseType;
};

const JOB_BASE_URL = "/freelancer/jobs";
const FIND_WORK_PATH = "/freelancer/find-work";
const CATEGORY_BASE_PATH = "/freelancer/categories";

/** UC-46.07 — chi tiết danh mục kèm danh sách công việc đang mở thuộc danh mục. */
export function CategoryDetailContent({
  jobCategory,
}: CategoryDetailContentProps) {
  const router = useRouter();
  const t = useTranslations("jobCategories");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const jobs = jobCategory.jobs ?? [];
  const pagination = jobCategory.pagination;

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    startTransition(() => {
      router.push(
        query
          ? `${CATEGORY_BASE_PATH}/${jobCategory.slug}?${query}`
          : `${CATEGORY_BASE_PATH}/${jobCategory.slug}`,
      );
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <nav className="flex min-w-0 items-center gap-2 text-sm text-foreground/60">
            <Link
              href={CATEGORY_BASE_PATH}
              className="transition-colors hover:text-[#4fae2e]"
            >
              {t("allCategories")}
            </Link>
            <span className="text-foreground/35">/</span>
            <span className="truncate font-medium text-foreground">
              {jobCategory.name}
            </span>
          </nav>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4fae2e] px-3 py-0.5 text-xs font-semibold text-white">
                  <Tag className="size-3" />
                  {t("categoryBadge")}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-0.5 text-xs font-medium text-foreground dark:bg-white/10">
                  {t("jobsCount", { count: jobCategory.jobCount })}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {jobCategory.name}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70 dark:text-foreground/75">
                {jobCategory.description || t("noDescription")}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                asChild
                className="h-11 rounded-full bg-[#4fae2e] px-6 font-semibold text-white hover:bg-[#459928]"
              >
                <Link
                  href={`${FIND_WORK_PATH}?category=${encodeURIComponent(jobCategory.slug)}`}
                >
                  {t("browseJobsInCategory")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-[#4fae2e]/35 bg-background"
              >
                <Link href={CATEGORY_BASE_PATH}>
                  <ArrowLeft className="size-4" />
                  {t("backToCategories")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {t("detailJobsTitle")}
        </h2>

        {jobs.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-16 text-center font-sans">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
              <SearchX className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {t("detailEmptyTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {t("detailEmptyDescription")}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-4 rounded-full text-xs"
            >
              <Link href={FIND_WORK_PATH}>{t("browseAllJobs")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                jobBaseUrl={JOB_BASE_URL}
                filterBasePath={FIND_WORK_PATH}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
            <p className="font-sans text-xs text-muted-foreground">
              {tCommon("pageOf", {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                disabled={isPending || pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                disabled={isPending || pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
