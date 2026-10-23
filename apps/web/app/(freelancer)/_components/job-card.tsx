"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { MouseEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Loader2,
  Tag,
} from "@/components/icons";

import type { JobType } from "@shared/types";

export type JobCardJob = Pick<
  JobType,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "budgetMin"
  | "budgetMax"
  | "budgetType"
  | "status"
  | "featured"
  | "createdAt"
  | "hiringType"
  | "positionsRequired"
  | "positionsFilled"
  | "skills"
  | "jobCategories"
>;

type JobCardProps = {
  job: JobCardJob;
  /** Trang danh sách job — mọi chip và nút "Xem chi tiết" đều trỏ về đây. */
  jobBaseUrl: string;
  /** Trang tìm việc để áp bộ lọc theo danh mục/kỹ năng (UC-46.07 A.2). */
  filterBasePath: string;
  index?: number;
  canBookmark?: boolean;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  onToggleBookmark?: (slug: string, event: MouseEvent) => void;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Thẻ công việc dùng chung cho trang tìm việc và trang chi tiết danh mục (UC-46.07). */
export function JobCard({
  job,
  jobBaseUrl,
  filterBasePath,
  index = 0,
  canBookmark = false,
  isBookmarked = false,
  isBookmarkPending = false,
  onToggleBookmark,
}: JobCardProps) {
  const t = useTranslations("findWork");
  const tStatus = useTranslations("jobStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const preview = job.description
    ? stripHtml(job.description)
    : t("noDescription");
  const skills = job.skills?.slice(0, 5) ?? [];
  const jobCategories = job.jobCategories ?? [];

  const formatPostedTime = (value: string | Date) => {
    const diffHours = Math.floor(
      (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return tCommon("justNow");
    if (diffHours < 24) return tCommon("hoursAgo", { hours: diffHours });

    return tCommon("daysAgo", { days: Math.floor(diffHours / 24) });
  };

  const budgetText =
    job.budgetMin === null || job.budgetMax === null
      ? t("negotiable")
      : `$${format.number(job.budgetMin)} – $${format.number(job.budgetMax)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className="group relative flex flex-col justify-between rounded-[28px] border border-border bg-card p-5 sm:p-6 transition-all hover:bg-accent/10 shadow-xs font-sans"
    >
      <div>
        {/* Top Header Row: Status, Badges & Bookmark Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {job.featured ? (
              <span className="inline-flex items-center rounded-full bg-[#4fae2e] text-white px-3 py-0.5 text-xs font-semibold">
                {t("featured")}
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300 px-3 py-0.5 text-xs font-semibold">
              {tStatus(job.status)}
            </span>
            {/* Job tuyển nhiều người: hiển thị tiến độ tuyển để freelancer biết còn chỗ hay không. */}
            {job.hiringType === "MULTIPLE" ? (
              <span className="inline-flex items-center rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-0.5 text-xs font-semibold text-[#3f9225] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d]">
                {t("positionsBadge", {
                  filled: job.positionsFilled,
                  required: job.positionsRequired,
                })}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
              <Clock className="size-3.5" />
              {formatPostedTime(job.createdAt)}
            </span>
          </div>

          {canBookmark ? (
            <button
              type="button"
              disabled={isBookmarkPending}
              aria-label={isBookmarked ? tBookmark("remove") : tBookmark("save")}
              onClick={(event) => onToggleBookmark?.(job.slug, event)}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer outline-none ${
                isBookmarked
                  ? "bg-[#4fae2e]/10 text-[#4fae2e] hover:bg-[#4fae2e]/20"
                  : "bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground hover:text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700"
              }`}
              title={
                isBookmarked ? tBookmark("removeTitle") : tBookmark("saveTitle")
              }
            >
              {isBookmarkPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bookmark
                  className={`size-4 ${
                    isBookmarked ? "fill-[#4fae2e] text-[#4fae2e]" : ""
                  }`}
                />
              )}
            </button>
          ) : null}
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
            {budgetText}{" "}
            <span className="font-normal text-muted-foreground capitalize">
              ({tBudgetType(job.budgetType)})
            </span>
          </div>
        </div>

        {/* Description Preview */}
        <p className="mt-2 text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed line-clamp-2">
          {preview}
        </p>
      </div>

      {/* Bottom Row: Categories, Skills & View Action */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {jobCategories.map((jobCategory) => (
            <Link
              key={`${job.id}-category-${jobCategory.id}`}
              href={`${filterBasePath}?category=${encodeURIComponent(jobCategory.slug)}`}
              title={t("browseCategory", { name: jobCategory.name })}
              className="inline-flex items-center gap-1 rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-1 text-xs font-medium text-[#3f9225] transition-colors hover:border-[#4fae2e]/60 hover:bg-[#ddf2cd] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d] dark:hover:bg-[#4fae2e]/25"
            >
              <Tag className="size-3" />
              {jobCategory.name}
            </Link>
          ))}

          {skills.map((skill) => (
            <Link
              key={`${job.id}-${skill.skillId}`}
              href={`${filterBasePath}?keyword=${encodeURIComponent(skill.skill.name)}`}
              className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800/80 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              {skill.skill.name}
            </Link>
          ))}
          {(job.skills?.length ?? 0) > 5 ? (
            <span className="text-xs text-muted-foreground self-center ml-1">
              {t("moreSkills", { count: (job.skills?.length ?? 0) - 5 })}
            </span>
          ) : null}
        </div>

        <Link
          href={`${jobBaseUrl}/${job.slug}`}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:translate-x-0.5"
        >
          <span>{t("viewDetails")}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
