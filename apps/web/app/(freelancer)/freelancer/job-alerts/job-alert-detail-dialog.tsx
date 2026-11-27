"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, Loader2, Search } from "@/components/icons";

import jobAlertApiRequest from "@/apiRequests/job-alert";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import type { JobAlertType, MatchingJobItemType } from "@shared/types";

type JobAlertDetailDialogProps = {
  alert: JobAlertType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canViewMatchingJobs: boolean;
};

function toSearchJobsHref(alert: JobAlertType) {
  const params = new URLSearchParams();
  if (alert.keywords?.trim()) params.set("q", alert.keywords.trim());
  if (alert.skills?.length) params.set("skill", alert.skills.join(","));
  const query = params.toString();
  return query
    ? `/freelancer/search/jobs?${query}`
    : "/freelancer/search/jobs";
}

export function JobAlertDetailDialog({
  alert,
  open,
  onOpenChange,
  canViewMatchingJobs,
}: JobAlertDetailDialogProps) {
  const t = useTranslations("jobAlerts");
  const format = useFormatter();

  const [matchingJobs, setMatchingJobs] = useState<MatchingJobItemType[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState(false);

  useEffect(() => {
    if (!open || !alert || !canViewMatchingJobs) {
      setMatchingJobs([]);
      setJobsError(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingJobs(true);
    setJobsError(false);

    void jobAlertApiRequest
      .getMatchingJobs(alert.id)
      .then((res) => {
        if (!isCancelled) {
          setMatchingJobs(res.data ?? []);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setJobsError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingJobs(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, alert, canViewMatchingJobs]);

  if (!alert) return null;

  const formatDate = (value: string | Date) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatBudget = (job: MatchingJobItemType) => {
    const currency = {
      style: "currency" as const,
      currency: "USD",
      maximumFractionDigits: 0,
    };
    if (
      job.budgetMin !== null &&
      job.budgetMin !== undefined &&
      job.budgetMax !== null &&
      job.budgetMax !== undefined &&
      job.budgetMin !== job.budgetMax
    ) {
      return `${format.number(job.budgetMin, currency)} - ${format.number(job.budgetMax, currency)}`;
    }
    if (job.budgetMax !== null && job.budgetMax !== undefined) {
      return format.number(job.budgetMax, currency);
    }
    if (job.budgetMin !== null && job.budgetMin !== undefined) {
      return format.number(job.budgetMin, currency);
    }
    return t("negotiable");
  };

  const title =
    alert.name?.trim() ||
    alert.keywords?.trim() ||
    alert.skills?.join(" • ") ||
    t("title");

  const frequencyLabel =
    alert.frequency === "INSTANT"
      ? t("frequencyInstant")
      : alert.frequency === "WEEKLY"
        ? t("frequencyWeekly")
        : t("frequencyDaily");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl font-sans">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-[#0069D3]">
              <Bell className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-[#0069D3]">
                  {t("detailTitle")}
                </span>
                <span>•</span>
                <span
                  className={
                    alert.isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {alert.isActive ? t("statusActive") : t("statusPaused")}
                </span>
              </div>
              <DialogTitle className="mt-0.5 text-lg font-bold tracking-tight text-foreground break-words">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                {t("createdAt", { date: formatDate(alert.createdAt) })}
                {" • "}
                {alert.lastSentAt
                  ? t("lastSentAt", { date: formatDate(alert.lastSentAt) })
                  : t("neverSent")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Alert Criteria & Config */}
        <div className="mt-2 grid gap-3 sm:grid-cols-2 rounded-xl border border-border bg-muted/30 p-4 text-xs">
          <div>
            <p className="text-muted-foreground">{t("keywordsLabel")}</p>
            <p className="mt-1 font-medium text-foreground">
              {alert.keywords?.trim() || "—"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">{t("frequencyLabel")}</p>
            <p className="mt-1 font-medium text-foreground">{frequencyLabel}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t("skillsLabel")}</p>
            {alert.skills?.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {alert.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-[11px] font-normal"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-1 font-medium text-foreground">—</p>
            )}
          </div>

          <div>
            <p className="text-muted-foreground">{t("channelsLabel")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {alert.channels?.includes("IN_APP") && (
                <Badge variant="outline" className="text-[11px] font-normal">
                  {t("channelInApp")}
                </Badge>
              )}
              {alert.channels?.includes("EMAIL") && (
                <Badge variant="outline" className="text-[11px] font-normal">
                  {t("channelEmail")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Matching Open Jobs from GET /api/job-alerts/:id/matching-jobs */}
        {canViewMatchingJobs && (
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("matchingJobsTitle")}
              </h3>
              {!isLoadingJobs && !jobsError && (
                <span className="text-xs text-muted-foreground">
                  {matchingJobs.length}
                </span>
              )}
            </div>

            {isLoadingJobs ? (
              <div className="flex items-center justify-center rounded-xl border border-border py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : jobsError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                {t("matchingJobsFailed")}
              </div>
            ) : matchingJobs.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
                {t("matchingJobsEmpty")}
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {matchingJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/freelancer/jobs/${job.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate hover:text-[#0069D3]">
                        {job.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBudget(job)} • {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg text-xs h-9 px-4 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-lg bg-[#0069D3] text-white hover:bg-[#005bb8] text-xs font-medium h-9 px-4"
          >
            <Link
              href={toSearchJobsHref(alert)}
              onClick={() => onOpenChange(false)}
            >
              <Search className="mr-1.5 size-3.5" />
              {t("openInSearch")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
