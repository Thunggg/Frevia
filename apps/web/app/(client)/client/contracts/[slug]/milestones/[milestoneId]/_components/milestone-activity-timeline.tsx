"use client";

import { useFormatter } from "next-intl";
import {
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Play,
  RotateCcw,
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

  // Icons: Clean transparent circles with colored stroke, NO solid background colors
  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "approved":
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-emerald-600">
            <CheckCircle2 className="size-3" />
          </div>
        );
      case "submitted":
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-[#0069D3]">
            <FileText className="size-3" />
          </div>
        );
      case "changes_requested":
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-amber-600">
            <RotateCcw className="size-2.5" />
          </div>
        );
      case "started":
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-foreground">
            <Play className="size-2.5" />
          </div>
        );
      case "funded":
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-emerald-600">
            <Lock className="size-2.5" />
          </div>
        );
      default:
        return (
          <div className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
            <Clock className="size-2.5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3 font-sans pt-1">
      <div className="border-b border-border/40 pb-2">
        <h3 className="text-xs font-semibold text-foreground">
          Activity History
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Lifecycle and milestone event log
        </p>
      </div>

      <div className="relative pl-1 space-y-3.5 pt-1">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[13px] top-2 bottom-2 w-[1px] bg-border/40" />

        {events.map((event) => (
          <div key={event.id} className="relative flex items-start gap-2.5 text-xs">
            {/* Event Icon badge */}
            <div className="relative z-10 shrink-0 bg-background">
              {getEventIcon(event.type)}
            </div>

            {/* Event Content */}
            <div className="space-y-0.5 min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-foreground truncate">
                  {event.title}
                </span>
                {event.timestamp && (
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {formatDate(event.timestamp)}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {event.description}
                </p>
              )}

              {event.actor && (
                <p className="text-[10px] text-muted-foreground/75">
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
