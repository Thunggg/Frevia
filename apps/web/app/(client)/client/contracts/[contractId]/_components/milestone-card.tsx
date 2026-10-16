"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Ellipsis,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
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
        className: "bg-[#D0E1F8]/40 text-[#0069D3] border border-[#0069D3]/15",
      };
    case "CHANGES_REQUESTED":
      return {
        label: "Revisions Requested",
        className: "bg-[#F1F0F5] text-foreground/80 border border-border",
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
  onEdit: (milestone: MilestoneType) => void;
  onDelete: (milestone: MilestoneType) => void;
  onReview: (milestone: MilestoneType, submission: GetSubmissionResponseType) => void;
}

export function MilestoneCard({
  contractId,
  milestone,
  index,
  onEdit,
  onDelete,
  onReview,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [submissions, setSubmissions] = useState<GetSubmissionResponseType[] | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Auto-expand if milestone is submitted (awaiting review)
  useEffect(() => {
    if (milestone.status === "SUBMITTED") {
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
      {/* Header Row (List card summary) */}
      <div
        onClick={handleToggleExpand}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer select-none transition-colors hover:bg-[#F1F0F5]/30"
      >
        {/* Left: Title & Due Date & Amount */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground/70">#{index + 1}</span>
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-[#0069D3] transition-colors">
              {milestone.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5 text-muted-foreground/70" />
              Due: {formatDate(milestone.dueDate)}
            </span>
            <span className="font-semibold text-foreground">
              {money(Number(milestone.amount))}
            </span>
          </div>
        </div>

        {/* Right: Status badge + 3 dots action menu + Chevron */}
        <div
          className="flex items-center gap-2 shrink-0 self-start sm:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>
            {badge.label}
          </span>

          {/* 3-dots action menu (Like Job Card) */}
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

              {milestone.status !== "COMPLETED" && (
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

          {/* Expand / Collapse Chevron */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="flex size-8 items-center justify-center rounded-full bg-[#F1F0F5] hover:bg-[#D0E1F8]/50 text-muted-foreground hover:text-[#0069D3] cursor-pointer transition-all outline-none"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details ("Showdown" / Slide-down) */}
      {isExpanded && (
        <div className="border-t border-border/60 px-5 py-4 space-y-4 bg-[#F1F0F5]/20 dark:bg-zinc-900/20">
          {/* Deliverable Scope & Criteria */}
          {milestone.description && (
            <div>
              <span className="text-[11px] block mb-1">
                Deliverable Requirements: <span className="text-foreground/90"> {milestone.description}</span>
              </span>
            </div>
          )}

          {/* Freelancer Submissions Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {milestone.status === "SUBMITTED" && latestSubmission && (
                <span className="text-[11px] font-semibold text-[#0069D3]">
                  Action required
                </span>
              )}
            </div>

            {loadingSubmissions ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-[#0069D3]" />
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
                      Deliverable Notes: <span className="font-medium">  {latestSubmission.message}</span>
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
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2 text-xs text-[#0069D3] hover:underline"
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
                              className="flex items-center gap-1 text-[#0069D3] hover:underline p-1 text-xs shrink-0"
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

                {/* Review & Evaluation Actions */}
                {milestone.status === "SUBMITTED" && (
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

                {milestone.status === "COMPLETED" && (
                  <div className="flex items-center gap-2 text-xs text-foreground bg-[#D0E1F8]/30 rounded-xl p-3">
                    <CheckCircle2 className="size-4 text-[#0069D3]" />
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
                  <span>Freelancer hasn&apos;t submitted deliverables for this milestone yet.</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
