"use client";

import { useFormatter } from "next-intl";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Lock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";

interface MilestoneOverviewTabProps {
  contract: ContractDetailType;
  milestone: MilestoneType;
  submissions: GetSubmissionResponseType[];
  isFreelancer?: boolean;
}

export function MilestoneOverviewTab({
  milestone,
  submissions,
}: MilestoneOverviewTabProps) {
  const format = useFormatter();
  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return format.dateTime(d, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDurationOrDaysRemaining = () => {
    if (milestone.status === "COMPLETED") {
      if (milestone.createdAt && milestone.completedAt) {
        const start = new Date(milestone.createdAt).getTime();
        const end = new Date(milestone.completedAt).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        return `${days} ${days === 1 ? "day" : "days"} total`;
      }
      return "Completed";
    }

    if (!milestone.dueDate) return "No deadline set";
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"} overdue`;
    }
    if (diffDays === 0) return "Due today";
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
  };

  const amountNumber = Number(milestone.amount) || 0;

  return (
    <div className="space-y-5">
      {/* ── 1. Top Status Banner (Minimalist, subtle left border, no heavy bg) ── */}
      {milestone.status === "COMPLETED" && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
              Milestone completed and payment released
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              All deliverables were approved. Gross value{" "}
              <strong className="text-zinc-950 dark:text-zinc-100 font-mono">
                ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
              </strong>{" "}
              (5% Freelancer platform fee deducted; 95% net credited to
              freelancer wallet).
            </p>
          </div>
        </div>
      )}

      {milestone.status === "SUBMITTED" && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <FileText className="size-4 shrink-0 text-[#0069D3] mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#0069D3]">
              Work submitted and awaiting client review
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Freelancer submitted deliverables on{" "}
              {formatDateTime(latestSubmission?.submittedAt)}. Client can review the files,
              links, and approve to release escrow.
            </p>
          </div>
        </div>
      )}

      {milestone.status === "CHANGES_REQUESTED" && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <RotateCcw className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-600">
              Revisions requested by client
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The client requested changes on the recent submission. Please review notes
              below and resubmit updated deliverables.
            </p>
          </div>
        </div>
      )}

      {milestone.status === "IN_PROGRESS" && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <Clock className="size-4 shrink-0 text-[#0069D3] mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#0069D3]">
              Work in progress
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Milestone is actively in progress. Funds remain securely held in escrow.
            </p>
          </div>
        </div>
      )}

      {milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED" && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-emerald-600">
              Escrow funded and ready
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Client deposited{" "}
              <strong className="text-zinc-950 dark:text-zinc-100 font-mono">
                ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
              </strong>{" "}
              into escrow. The freelancer can safely start work.
            </p>
          </div>
        </div>
      )}

      {milestone.status === "PENDING" && milestone.paymentStatus === "PENDING" && (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-start gap-3">
          <Lock className="size-4 shrink-0 text-zinc-400 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Awaiting escrow deposit
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Client should fund the milestone escrow before the freelancer begins work.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. Scope & Requirements Card ── */}
      <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
          <span className="text-xs text-zinc-400">
            Scope & Deliverables Requirements
          </span>
          <span className="font-mono text-xs font-semibold text-zinc-500">
            Budget: ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {milestone.description || (
            <span className="text-zinc-400 italic">
              No specific description provided. Execution follows contract agreement terms.
            </span>
          )}
        </div>
      </div>

      {/* ── 3. Latest Submission / Deliverables Card ── */}
      {latestSubmission && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Latest Deliverables Submission
            </span>
            <span className="text-xs text-zinc-400">
              Submitted {formatDateTime(latestSubmission.submittedAt)}
            </span>
          </div>

          {/* Submission Note */}
          {latestSubmission.message && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400">
                Freelancer Notes:
              </span>
              <p className="p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                {latestSubmission.message}
              </p>
            </div>
          )}

          {/* Links */}
          {latestSubmission.links && latestSubmission.links.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400 block">
                Deliverable Links:
              </span>
              <div className="flex flex-wrap gap-2">
                {latestSubmission.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-[#0069D3] hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    <span className="truncate max-w-[280px]">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {latestSubmission.files && latestSubmission.files.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400 block">
                Attached Files:
              </span>
              <div className="flex flex-wrap gap-2">
                {latestSubmission.files.map((item) => (
                  <div
                    key={item.fileId}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <FileText className="size-3.5 text-zinc-400" />
                    <span className="truncate max-w-[220px]">
                      {item.file?.fileName || `Deliverable File #${item.fileId}`}
                    </span>
                    {item.file?.fileUrl && (
                      <a
                        href={item.file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-[#0069D3] hover:underline ml-1"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Feedback / Revision Request */}
          {latestSubmission.changeRequestMessage && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 p-3.5 text-xs space-y-1 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block text-[11px]">
                Revisions Requested by Client:
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {latestSubmission.changeRequestMessage}
              </p>
              {latestSubmission.changeRequestDueDate && (
                <span className="block pt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  Target revision deadline:{" "}
                  {formatDate(latestSubmission.changeRequestDueDate)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Three-Column Metrics Row (Clean white/gray) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1 */}
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            {milestone.status === "COMPLETED" ? "Elapsed Time" : "Time to Deadline"}
          </span>
          <p className="font-mono text-sm sm:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
            {getDurationOrDaysRemaining()}
          </p>
          <span className="text-[11px] text-zinc-400 block">
            {milestone.status === "COMPLETED"
              ? "Completed successfully"
              : "Track against contract schedule"}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Escrow Protection
          </span>
          <p className="font-mono text-sm sm:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
            ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400 block">
            {milestone.paymentStatus === "RELEASED"
              ? "Released to freelancer"
              : milestone.paymentStatus === "FUNDED"
                ? "Locked & guaranteed in escrow"
                : "Awaiting client deposit"}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Target Due Date
          </span>
          <p className="font-mono text-sm sm:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
            {formatDate(milestone.dueDate)}
          </p>
          <span className="text-[11px] text-zinc-400 block">
            {milestone.status === "COMPLETED" ? "Milestone fulfilled" : "Expected milestone delivery"}
          </span>
        </div>
      </div>
    </div>
  );
}
