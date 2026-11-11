"use client";

import { useFormatter } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";

interface MilestoneActivityTimelineProps {
  contract: ContractDetailType;
  milestone: MilestoneType;
  submissions: GetSubmissionResponseType[];
  isFreelancer?: boolean;
}

interface ActivityEvent {
  id: string;
  type:
  | "created"
  | "funded"
  | "started"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "disputed";
  title: string;
  description?: string;
  timestamp?: string | Date | null;
  actor?: string;
}

export function MilestoneActivityTimeline({
  contract,
  milestone,
  submissions,
  isFreelancer = false,
}: MilestoneActivityTimelineProps) {
  const format = useFormatter();

  const clientName =
    contract.client?.profile?.displayName ||
    contract.client?.email?.split("@")[0] ||
    "Client";

  const freelancerName =
    contract.freelancer?.profile?.displayName ||
    contract.freelancer?.email?.split("@")[0] ||
    "Freelancer";

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return format.dateTime(d, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Compile timeline events in reverse chronological order (newest first)
  const events: ActivityEvent[] = [];

  // Completed / Approved
  if (milestone.status === "COMPLETED" && milestone.completedAt) {
    events.push({
      id: "completed",
      type: "approved",
      title: "Accepted & Released",
      description: `Approved by ${clientName}. Payment of $${Number(milestone.amount).toFixed(2)} transferred to freelancer.`,
      timestamp: milestone.completedAt,
      actor: clientName,
    });
  }

  // Submissions & Revision Requests (newest first)
  submissions.forEach((sub, idx) => {
    const attemptNumber = submissions.length - idx;

    if (sub.status === "APPROVED" && sub.reviewedAt && milestone.status !== "COMPLETED") {
      events.push({
        id: `approved-${sub.id}`,
        type: "approved",
        title: "Deliverables Approved",
        description: `Accepted by ${clientName}. Escrow payout approved.`,
        timestamp: sub.reviewedAt,
        actor: clientName,
      });
    }

    if (sub.status === "CHANGES_REQUESTED" && sub.reviewedAt) {
      events.push({
        id: `changes-${sub.id}`,
        type: "changes_requested",
        title: "Correction Requested",
        description: sub.changeRequestMessage || "Revisions required by client.",
        timestamp: sub.reviewedAt,
        actor: clientName,
      });
    }

    events.push({
      id: `sub-${sub.id}`,
      type: "submitted",
      title: `Deliverables Submitted`,
      description: sub.message
        ? `Attempt #${attemptNumber}: "${sub.message.slice(0, 70)}${sub.message.length > 70 ? "..." : ""}"`
        : `Attempt #${attemptNumber} submitted by ${freelancerName}.`,
      timestamp: sub.submittedAt,
      actor: freelancerName,
    });
  });

  // Started Work
  if (
    milestone.status === "IN_PROGRESS" ||
    milestone.status === "SUBMITTED" ||
    milestone.status === "CHANGES_REQUESTED" ||
    milestone.status === "COMPLETED"
  ) {
    events.push({
      id: "started",
      type: "started",
      title: "Work In Progress",
      description: `Freelancer ${freelancerName} started active milestone work.`,
      timestamp: milestone.updatedAt,
      actor: freelancerName,
    });
  }

  // Escrow Funded
  if (
    milestone.paymentStatus === "FUNDED" ||
    milestone.paymentStatus === "RELEASED"
  ) {
    events.push({
      id: "funded",
      type: "funded",
      title: "Escrow Funded",
      description: `$${Number(milestone.amount).toFixed(2)} USD deposited and secured in escrow.`,
      timestamp: milestone.updatedAt,
      actor: clientName,
    });
  }

  // Milestone Created
  events.push({
    id: "created",
    type: "created",
    title: "Milestone Created",
    description: `Budget set at $${Number(milestone.amount).toFixed(2)} USD.`,
    timestamp: milestone.createdAt,
    actor: clientName,
  });

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "approved":
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
            <CheckCircle2 className="size-3.5" />
          </div>
        );
      case "submitted":
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-[#0069D3] text-white">
            <FileText className="size-3.5" />
          </div>
        );
      case "changes_requested":
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-amber-600 text-white">
            <RotateCcw className="size-3" />
          </div>
        );
      case "started":
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900">
            <Play className="size-3" />
          </div>
        );
      case "funded":
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Lock className="size-3" />
          </div>
        );
      default:
        return (
          <div className="flex size-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Clock className="size-3" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 shadow-2xs space-y-4 font-sans">
      <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-zinc-50">
          Activity
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Audited lifecycle and decision trail
        </p>
      </div>

      <div className="relative pl-1 space-y-4">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[15px] top-2 bottom-3 w-[1.5px] bg-zinc-200 dark:bg-zinc-800" />

        {events.map((event) => (
          <div key={event.id} className="relative flex items-start gap-2.5 text-xs">
            {/* Event Icon badge */}
            <div className="relative z-10 shrink-0 bg-white dark:bg-zinc-950">
              {getEventIcon(event.type)}
            </div>

            {/* Event Content */}
            <div className="space-y-0.5 min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {event.title}
                </span>
                {event.timestamp && (
                  <span className="text-[10px] text-zinc-400 shrink-0 font-medium font-mono">
                    {formatDate(event.timestamp)}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {event.description}
                </p>
              )}

              {event.actor && (
                <p className="text-[10px] text-zinc-400">
                  By {event.actor}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

