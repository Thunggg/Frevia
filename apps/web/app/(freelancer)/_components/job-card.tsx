"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Heart,
  Loader2,
  Tag,
  Users,
} from "@/components/icons";

import type { JobType, RecommendationComponentsType } from "@shared/types";

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
  | "deadline"
  | "expiryDate"
  | "createdAt"
  | "hiringType"
  | "positionsRequired"
  | "positionsFilled"
  | "skills"
  | "jobCategories"
  | "proposalsCount"
>;

type JobCardProps = {
  job: any;
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
  index = 0,
  canBookmark = false,
  isBookmarked = false,
  isBookmarkPending = false,
  onToggleBookmark,
  matchScore,
  components,
  recommendationId,
  onViewExplanation,
  showApplyButton = false,
}: JobCardProps) {
  const t = useTranslations("findWork");
  const tRec = useTranslations("recommendation");
  const tStatus = useTranslations("jobStatus");
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
  ).map((s: any, idx: number) => {
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
    if (days === 1) return "hôm qua";
    return `${days} ngày trước`;
  };

  // Lượng đề xuất THẬT từ schema dự án (không mockup)
  const realProposalsCount =
    job.proposalsCount ??
    job._count?.proposals ??
    (Array.isArray(job.proposals) ? job.proposals.length : 0);

  // Kiểm tra thời hạn nhận hồ sơ
  const isExpired =
    job.expiryDate && new Date(job.expiryDate).getTime() < Date.now();

  const budgetText =
    job.budgetMin === null || job.budgetMax === null
      ? t("negotiable")
      : `$${format.number(job.budgetMin)} - $${format.number(job.budgetMax)}`;

  // Trạng thái hiển thị chi tiết của job
  const renderJobStatusBadge = () => {
    if (job.status === "CLOSED") {
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-semibold">
          Đã đóng tuyển
        </span>
      );
    }

    if (job.status === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-xs font-semibold">
          Đang thực hiện
        </span>
      );
    }

    if (job.status === "COMPLETED") {
      return (
        <span className="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 px-2.5 py-0.5 text-xs font-semibold">
          Đã hoàn thành
        </span>
      );
    }

    if (job.status === "CANCELLED") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 text-xs font-semibold">
          Đã hủy
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 text-xs font-semibold">
          Đã hết hạn nộp
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-xs font-semibold">
        Đang mở tuyển
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs font-sans space-y-3"
    >
      {/* Hàng 1: Thời gian đăng + Trạng thái + Đề xuất thực tế + Bookmark */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {renderJobStatusBadge()}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Đăng {formatPostedTime(job.createdAt)}
          </span>

          <span>•</span>

          {/* Lượng ứng viên thật */}
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Users className="size-3.5 text-muted-foreground" />
            {realProposalsCount} đề xuất
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
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                recommendationId && onViewExplanation
                  ? "border-[#4fae2e]/30 bg-[#eaf8df] text-[#2d6e1a] hover:bg-[#ddf2cd] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d] dark:border-[#4fae2e]/30 cursor-pointer"
                  : "border-border bg-muted/40 text-foreground"
              }`}
            >
              <span>
                {tRec("matchScore", { score: Math.round(matchScore * 100) })}
              </span>
              {recommendationId && onViewExplanation ? (
                <span className="text-[10px] font-normal underline opacity-80">
                  {tRec("details")}
                </span>
              ) : null}
            </button>
          )}

          {job.hiringType === "MULTIPLE" && (
            <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              Đã tuyển {job.positionsFilled ?? 0}/{job.positionsRequired ?? 1} vị trí
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
            className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
              isBookmarked
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={
              isBookmarked ? tBookmark("removeTitle") : tBookmark("saveTitle")
            }
          >
            {isBookmarkPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart
                className={`size-4 ${
                  isBookmarked ? "fill-emerald-600 text-emerald-600" : ""
                }`}
              />
            )}
          </button>
        )}
      </div>

      {/* Hàng 2: Tiêu đề công việc + Nút ứng tuyển */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <Link
          href={`${jobBaseUrl}/${job.slug}`}
          className="text-base sm:text-lg font-bold text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors leading-snug line-clamp-2 hover:underline"
        >
          {job.title}
        </Link>

        {showApplyButton && job.status === "OPEN" && !isExpired && (
          <Link
            href={`${jobBaseUrl}/${job.slug}`}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            Ứng tuyển
          </Link>
        )}
      </div>

      {/* Hàng 3: Ngân sách & Hạn chót (từ dữ liệu thực tế) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-foreground/80">
        <div>
          <span className="font-semibold text-foreground">
            {tBudgetType(job.budgetType)}: {budgetText}
          </span>
        </div>

        {/* Hạn nhận hồ sơ (nếu có) */}
        {job.expiryDate && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Calendar className="size-3.5" />
            <span>
              Hạn nộp:{" "}
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
              Hạn hoàn thành:{" "}
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
              className="text-emerald-600 hover:underline font-medium ml-1 cursor-pointer"
            >
              Thu gọn
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
                className="text-emerald-600 hover:underline font-medium ml-1 inline cursor-pointer"
              >
                ... xem thêm
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

        {jobCategories.map((cat: any) => (
          <Link
            key={`${job.id}-cat-${cat.id}`}
            href={`${filterBasePath}?category=${encodeURIComponent(cat.slug)}`}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
          >
            <Tag className="size-3" />
            {cat.name}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
