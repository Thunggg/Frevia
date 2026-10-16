"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Ellipsis,
  ExternalLink,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
  Upload,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { Button } from "@repo/ui/components/shadcn/button";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import type { GetSubmissionResponseType, MilestoneType } from "@shared/types";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null) {
  if (!date) return "Not specified";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getMilestoneStatusBadge(status: MilestoneType["status"]) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-[#F1F0F5] text-foreground border border-border/80",
      };
    case "SUBMITTED":
      return {
        label: "Ready for Review",
        className: "bg-[#D0E1F8] text-[#0069D3] border border-[#0069D3]/20 font-semibold",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className: "bg-[#D0E1F8]/40 text-[#0069D3] border border-[#0069D3]/15 font-medium",
      };
    case "CHANGES_REQUESTED":
      return {
        label: "Revisions Requested",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium",
      };
    default:
      return {
        label: "Upcoming",
        className: "bg-[#F1F0F5] text-muted-foreground border border-border/60",
      };
  }
}

interface MilestoneCardProps {
  contractId: number;
  milestone: MilestoneType;
  index: number;
  isFreelancer?: boolean;
  onEdit?: (milestone: MilestoneType) => void;
  onDelete?: (milestone: MilestoneType) => void;
  onReview?: (milestone: MilestoneType, submission: GetSubmissionResponseType) => void;
  onSubmitWork?: (milestone: MilestoneType) => void;
  onStartWork?: (milestone: MilestoneType) => void;
}

export function MilestoneCard({
  contractId,
  milestone,
  index,
  isFreelancer = false,
  onEdit,
  onDelete,
  onReview,
  onSubmitWork,
  onStartWork,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [submissions, setSubmissions] = useState<GetSubmissionResponseType[] | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Auto-expand if milestone needs attention
  useEffect(() => {
    if (
      milestone.status === "SUBMITTED" ||
      milestone.status === "CHANGES_REQUESTED" ||
      milestone.status === "IN_PROGRESS"
    ) {
      setIsExpanded(true);
    }
  }, [milestone.status]);

  // Fetch submissions when expanded
  useEffect(() => {
    if (isExpanded && submissions === null && !loadingSubmissions) {
      setLoadingSubmissions(true);
      contractApiRequest
        .getSubmissions(contractId, milestone.id)
        .then((res) => {
          const data = extractContractData(res);
          setSubmissions(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setSubmissions([]);
        })
        .finally(() => {
          setLoadingSubmissions(false);
        });
    }
  }, [isExpanded, submissions, loadingSubmissions, contractId, milestone.id]);

  const latestSubmission = submissions && submissions.length > 0 ? submissions[0] : null;
  const badge = getMilestoneStatusBadge(milestone.status);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="group rounded-2xl border border-border/70 bg-card hover:border-[#0069D3]/40 transition-all shadow-xs overflow-hidden">
      {/* Top Main Bar (Always Visible) */}
      <div
        onClick={handleToggleExpand}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer gap-4 transition-colors hover:bg-muted/20 select-none"
      >
        {/* Left: Index badge + Title + Dates + Amount */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Milestone Number Index */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F1F0F5] text-xs font-bold text-foreground">
            {index + 1}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground truncate">
                {milestone.title}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5 text-muted-foreground/70" />
                Due {formatDate(milestone.dueDate)}
              </span>
              <span>•</span>
              <span className="capitalize">
                Payment: {milestone.paymentStatus.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="text-right shrink-0">
            <span className="text-base font-extrabold text-foreground block tracking-tight">
              {money(Number(milestone.amount))}
            </span>
          </div>
        </div>

        {/* Right: Status badge + 3 dots action menu (Client only) + Chevron */}
        <div
          className="flex items-center gap-2 shrink-0 self-start sm:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>
            {badge.label}
          </span>

          {/* 3-dots action menu (Only Client can edit/delete milestones) */}
          {!isFreelancer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-[#F1F0F5] hover:bg-[#D0E1F8]/50 text-muted-foreground hover:text-[#0069D3] cursor-pointer transition-colors outline-none"
                  title="Milestone options"
                >
                  <Ellipsis className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-44 rounded-[20px] border border-border bg-white dark:bg-zinc-900 p-1.5 shadow-xl flex flex-col gap-1"
              >
                {milestone.status === "PENDING" && onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(milestone)}
                    className="group flex items-center justify-between rounded-full px-3 py-1.5 bg-[#F1F0F5] hover:bg-[#D0E1F8]/60 cursor-pointer transition-all outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Edit2 className="size-3.5 text-foreground" />
                      <span className="text-xs font-medium text-foreground">Edit</span>
                    </div>
                    <ChevronRight className="size-3 text-muted-foreground/50 group-hover:text-[#0069D3] transition-all" />
                  </DropdownMenuItem>
                )}

                {milestone.status === "PENDING" && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(milestone)}
                    className="group flex items-center justify-between rounded-full px-3 py-1.5 bg-[#F1F0F5] hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-all outline-none text-red-600"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="size-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Delete</span>
                    </div>
                    <ChevronRight className="size-3 text-red-400/50 group-hover:text-red-600 transition-all" />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Expand / Collapse Chevron */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="flex size-8 items-center justify-center rounded-full bg-[#F1F0F5] hover:bg-[#D0E1F8]/50 text-muted-foreground hover:text-[#0069D3] cursor-pointer transition-all outline-none"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border/60 px-5 py-4 space-y-4 bg-[#F1F0F5]/20 dark:bg-zinc-900/20">
          {/* Deliverable Scope & Criteria */}
          {milestone.description && (
            <div>
              <span className="text-[11px] block mb-1">
                Deliverable Requirements: <span className="text-foreground/90">{milestone.description}</span>
              </span>
            </div>
          )}

          {/* Revision Requested Message Banner */}
          {milestone.status === "CHANGES_REQUESTED" && latestSubmission?.changeRequestMessage && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
              <span className="font-semibold text-amber-600 dark:text-amber-400 block">
                Feedback / Changes Requested by Client:
              </span>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {latestSubmission.changeRequestMessage}
              </p>
            </div>
          )}

          {/* Submissions Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {milestone.status === "SUBMITTED" && latestSubmission && (
                <span className="text-[11px] font-semibold text-[#0069D3]">
                  Deliverables submitted for review
                </span>
              )}
            </div>

            {loadingSubmissions ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading submitted deliverables...</span>
              </div>
            ) : latestSubmission ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                {/* Submission Meta */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Submitted {formatDate(latestSubmission.submittedAt)}
                  </span>
                  <span className="rounded-full bg-[#D0E1F8] text-[#0069D3] px-2.5 py-0.5 text-[11px] font-semibold">
                    {latestSubmission.status}
                  </span>
                </div>

                {/* Submission Notes */}
                {latestSubmission.message && (
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Deliverable Notes: <span className="font-medium text-foreground">{latestSubmission.message}</span>
                    </span>
                  </div>
                )}

                {/* Submitted Links */}
                {latestSubmission.links && latestSubmission.links.length > 0 && (
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Project / Preview Links:
                    </span>
                    <div className="space-y-1.5">
                      {latestSubmission.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2 text-xs text-primary hover:underline"
                        >
                          <span className="truncate">{link}</span>
                          <ExternalLink className="size-3.5 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {latestSubmission.files && latestSubmission.files.length > 0 && (
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Attached Files:
                    </span>
                    <div className="space-y-1.5">
                      {latestSubmission.files.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="size-4 text-muted-foreground" />
                            <span className="truncate font-medium text-foreground">
                              {item.file?.fileName || `File #${item.fileId}`}
                            </span>
                          </div>
                          {item.file?.fileUrl && (
                            <a
                              href={item.file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline p-1 text-xs shrink-0"
                            >
                              <Download className="size-3.5" />
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CLIENT-ONLY: Review & Evaluation Actions */}
                {!isFreelancer && milestone.status === "SUBMITTED" && onReview && (
                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onReview(milestone, latestSubmission)}
                      className="w-full sm:w-auto rounded-full text-xs border-border bg-[#F1F0F5] hover:bg-[#D0E1F8]/60 text-foreground"
                    >
                      <RotateCcw className="mr-1.5 size-3.5" />
                      Request Changes / Revisions
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onReview(milestone, latestSubmission)}
                      className="w-full sm:w-auto rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="mr-1.5 size-3.5" />
                      Approve & Release {money(Number(milestone.amount))}
                    </Button>
                  </div>
                )}

                {/* FREELANCER-ONLY: Waiting for review badge */}
                {isFreelancer && milestone.status === "SUBMITTED" && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-end text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full font-medium">
                      <Clock className="size-3.5 text-primary" />
                      <span>Deliverables submitted • Awaiting client review</span>
                    </div>
                  </div>
                )}

                {milestone.status === "COMPLETED" && (
                  <div className="flex items-center gap-2 text-xs text-foreground bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Milestone approved and payment of{" "}
                      <strong>{money(Number(milestone.amount))}</strong> released.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground bg-card">
                {milestone.status === "COMPLETED" ? (
                  <span className="text-foreground font-medium">
                    Milestone has been approved and completed.
                  </span>
                ) : (
                  <span>No work deliverables submitted yet.</span>
                )}
              </div>
            )}
          </div>

          {/* FREELANCER WORK ACTIONS */}
          {isFreelancer && (
            <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
              {/* 1. Start milestone (when PENDING and FUNDED) */}
              {milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED" && onStartWork && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onStartWork(milestone)}
                  className="rounded-full bg-[#4fae2e] hover:bg-[#459928] text-white text-xs font-semibold"
                >
                  <Play className="mr-1.5 size-3.5" />
                  Start Working on Milestone
                </Button>
              )}

              {/* 2. Submit Work (when IN_PROGRESS) */}
              {milestone.status === "IN_PROGRESS" && onSubmitWork && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="rounded-full bg-[#4fae2e] hover:bg-[#459928] text-white text-xs font-semibold"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Submit Work / Deliverables
                </Button>
              )}

              {/* 3. Resubmit Work (when CHANGES_REQUESTED) */}
              {milestone.status === "CHANGES_REQUESTED" && onSubmitWork && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="rounded-full bg-[#4fae2e] hover:bg-[#459928] text-white text-xs font-semibold"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Resubmit Deliverables
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
