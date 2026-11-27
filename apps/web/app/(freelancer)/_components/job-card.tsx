"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Loader2,
  Tag,
  Users,
} from "@/components/icons";

import type { JobType, RecommendationComponentsType } from "@shared/types";

export type JobCardJob = Partial<
  Pick<
    JobType,
    | "deadline"
    | "expiryDate"
    | "hiringType"
    | "positionsRequired"
    | "positionsFilled"
    | "jobCategories"
    | "proposalsCount"
  >
> &
  Pick<
    JobType,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "budgetMin"
    | "budgetMax"
    | "budgetType"
    | "status"
  > & {
    createdAt: Date | string;
    skills?: unknown[];
    jobCategories?: unknown[];
    _count?: { proposals?: number };
    proposals?: unknown[];
  };

type JobCardSkillInput =
  | string
  | {
      id?: string | number;
      skillId?: string | number;
      name?: string;
      skill?: { name?: string };
    };

type JobCardCategoryInput = {
  id: string | number;
  slug: string;
  name: string;
};

type JobCardInput = {
  id: string | number;
  slug: string;
  title: string;
  description?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetType?: string | null;
  status?: string | null;
  deadline?: string | Date | null;
  expiryDate?: string | Date | null;
  createdAt?: string | Date | null;
  hiringType?: string | null;
  positionsRequired?: number | null;
  positionsFilled?: number | null;
  skills?: JobCardSkillInput[] | null;
  jobCategories?: JobCardCategoryInput[] | null;
  proposalsCount?: number | null;
  _count?: { proposals?: number };
  proposals?: unknown[];
};

type JobCardProps = {
  job: JobCardInput & Record<string, unknown>;
  /** Trang danh sách job — mọi chip và nút "Xem chi tiết" đều trỏ về đây. */
  jobBaseUrl: string;
  /** Trang tìm việc để áp bộ lọc theo danh mục/kỹ năng. */
  filterBasePath: string;
  index?: number;
  canBookmark?: boolean;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  onToggleBookmark?: (slug: string, event: MouseEvent) => void;
  matchScore?: number;
  components?: RecommendationComponentsType;
  recommendationId?: number | null;
  onViewExplanation?: (recommendationId: number, jobTitle: string) => void;
  showApplyButton?: boolean;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Thẻ công việc Freelancer hiển thị thông tin chính xác theo schema dự án. */
export function JobCard({
  job,
  jobBaseUrl,
  filterBasePath,
  canBookmark = false,
  isBookmarked = false,
  isBookmarkPending = false,
  onToggleBookmark,
  matchScore,
  recommendationId,
  onViewExplanation,
  showApplyButton = false,
}: JobCardProps) {
  const t = useTranslations("findWork");
  const tRec = useTranslations("recommendation");
  const tBudgetType = useTranslations("jobBudgetType");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [isExpanded, setIsExpanded] = useState(false);

  const rawDescription = job.description
    ? stripHtml(job.description)
    : t("noDescription");

  const normalizedSkills: Array<{ id: string | number; name: string }> = (
    job.skills ?? []
  ).map((s, idx: number) => {
    if (typeof s === "string") {
      return { id: `skill-${idx}-${s}`, name: s };
    }
    return {
      id: s?.skillId ?? s?.id ?? idx,
      name: s?.skill?.name ?? s?.name ?? String(s),
    };
  });

  const jobCategories = job.jobCategories ?? [];

  const formatPostedTime = (value: string | Date) => {
    const diffHours = Math.floor(
      (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return tCommon("justNow");
    if (diffHours < 24) return tCommon("hoursAgo", { hours: diffHours });

    const days = Math.floor(diffHours / 24);
    if (days === 1) return tCommon("yesterday");
    return tCommon("daysAgo", { days });
  };

  // Lượng đề xuất THẬT từ schema dự án (không mockup)
  const realProposalsCount =
    job.proposalsCount ??
    job._count?.proposals ??
    (Array.isArray(job.proposals) ? job.proposals.length : 0);

  // Kiểm tra thời hạn nhận hồ sơ
  const isExpired =
    job.status === "EXPIRED" ||
    (job.expiryDate && new Date(job.expiryDate).getTime() < Date.now());

  const budgetText =
    job.budgetMin == null || job.budgetMax == null
      ? t("negotiable")
      : `$${format.number(job.budgetMin)} - $${format.number(job.budgetMax)}`;

  // Trạng thái hiển thị chi tiết của job
  const renderJobStatusBadge = () => {
    if (job.status === "CLOSED") {
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-semibold">
          {t("statusClosed")}
        </span>
      );
    }

    if (job.status === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
          {t("statusInProgress")}
        </span>
      );
    }

    if (job.status === "COMPLETED") {
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
          {t("statusCompleted")}
        </span>
      );
    }

    if (job.status === "CANCELLED") {
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-destructive">
          {t("statusCancelled")}
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {t("statusExpired")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
        {t("statusOpen")}
      </span>
    );
  };

  return (
    <div
      className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 font-sans space-y-3"
    >
      {/* Hàng 1: Thời gian đăng + Trạng thái + Đề xuất thực tế + Bookmark */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {renderJobStatusBadge()}

          {job.createdAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {t("postedLabel", { time: formatPostedTime(job.createdAt) })}
            </span>
          )}

          <span>•</span>

          {/* Lượng ứng viên thật */}
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Users className="size-3.5 text-muted-foreground" />
            {t("proposalsCountLabel", { count: realProposalsCount })}
          </span>

          {/* Match Score Badge (Gợi ý AI) */}
          {typeof matchScore === "number" && (
            <button
              type="button"
              onClick={(e) => {
                if (recommendationId && onViewExplanation) {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewExplanation(recommendationId, job.title);
                }
              }}
              className={`inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground ${
                recommendationId && onViewExplanation
                  ? "hover:bg-muted cursor-pointer"
                  : ""
              }`}
            >
              <span>
                {tRec("matchScore", { score: Math.round(matchScore * 100) })}
              </span>
              {recommendationId && onViewExplanation ? (
                <span className="text-[11px] text-muted-foreground underline">
                  {tRec("details")}
                </span>
              ) : null}
            </button>
          )}

          {job.hiringType === "MULTIPLE" && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t("positionsFilledLabel", {
                filled: job.positionsFilled ?? 0,
                required: job.positionsRequired ?? 1,
              })}
            </span>
          )}
        </div>

        {/* Nút Bookmark (lưu vào danh sách yêu thích) */}
        {canBookmark && (
          <button
            type="button"
            disabled={isBookmarkPending}
            aria-label={isBookmarked ? tBookmark("remove") : tBookmark("save")}
            onClick={(event) => onToggleBookmark?.(job.slug, event)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title={
              isBookmarked ? tBookmark("removeTitle") : tBookmark("saveTitle")
            }
          >
            {isBookmarkPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="size-4 text-[#0069D3]" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </button>
        )}
      </div>

      {/* Hàng 2: Tiêu đề công việc + Nút ứng tuyển */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <Link
          href={`${jobBaseUrl}/${job.slug}`}
          prefetch={false}
          className="text-base sm:text-lg font-bold text-foreground hover:text-[#0069D3] dark:hover:text-blue-400 transition-colors leading-snug line-clamp-2 hover:underline"
        >
          {job.title}
        </Link>

        {showApplyButton && job.status === "OPEN" && !isExpired && (
          <Link
            href={`${jobBaseUrl}/${job.slug}`}
            prefetch={false}
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            {t("applyNow")}
          </Link>
        )}
      </div>

      {/* Hàng 3: Ngân sách & Hạn chót (từ dữ liệu thực tế) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-foreground/80">
        <div>
          <span className="font-semibold text-foreground">
            {job.budgetType ? `${tBudgetType(job.budgetType)}: ` : ""}
            {budgetText}
          </span>
        </div>

        {/* Hạn nhận hồ sơ (nếu có) */}
        {job.expiryDate && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Calendar className="size-3.5" />
            <span>
              {t("expiryDateLabel")}{" "}
              {format.dateTime(new Date(job.expiryDate), {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Thời hạn hoàn thành dự án (nếu có) */}
        {job.deadline && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="size-3.5" />
            <span>
              {t("deadlineLabel")}{" "}
              {format.dateTime(new Date(job.deadline), {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Hàng 4: Mô tả công việc tóm tắt kèm nút xem thêm */}
      <div className="text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed">
        {isExpanded ? (
          <div>
            <span>{rawDescription}</span>{" "}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-[#0069D3] hover:underline font-medium ml-1 cursor-pointer"
            >
              {t("showLess")}
            </button>
          </div>
        ) : (
          <div>
            <span className="line-clamp-2 inline">
              {rawDescription.slice(0, 240)}
            </span>
            {rawDescription.length > 240 && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-[#0069D3] hover:underline font-medium ml-1 inline cursor-pointer"
              >
                {t("showMore")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hàng 5: Kỹ năng & Danh mục thực tế của dự án */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {normalizedSkills.slice(0, 6).map((skill) => (
          <Link
            key={`${job.id}-${skill.id}`}
            href={`${filterBasePath}?keyword=${encodeURIComponent(skill.name)}`}
            prefetch={false}
            className="rounded-full bg-[#F3F3F7] dark:bg-zinc-800 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            {skill.name}
          </Link>
        ))}

        {normalizedSkills.length > 6 && (
          <span className="rounded-full bg-[#F3F3F7] dark:bg-zinc-800 px-2 py-1 text-xs text-muted-foreground font-medium">
            +{normalizedSkills.length - 6}
          </span>
        )}

        {jobCategories.map((cat) => (
          <Link
            key={`${job.id}-cat-${cat.id}`}
            href={`${filterBasePath}?category=${encodeURIComponent(cat.slug)}`}
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Tag className="size-3" />
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
