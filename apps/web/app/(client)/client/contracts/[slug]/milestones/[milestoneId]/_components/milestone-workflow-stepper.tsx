"use client";

import { useFormatter } from "next-intl";
import { Check, Clock, Loader2, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import type { GetSubmissionResponseType, MilestoneType } from "@shared/types";

interface MilestoneWorkflowStepperProps {
  milestone: MilestoneType;
  submissions: GetSubmissionResponseType[];
}

interface StepItem {
  id: string;
  label: string;
  sublabel: string;
  status: "completed" | "current" | "upcoming" | "warning";
  icon: typeof ShieldCheck;
}

export function MilestoneWorkflowStepper({
  milestone,
  submissions,
}: MilestoneWorkflowStepperProps) {
  const format = useFormatter();

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

  const isFunded =
    milestone.paymentStatus === "FUNDED" ||
    milestone.paymentStatus === "RELEASED";
  const isStarted =
    milestone.status === "IN_PROGRESS" ||
    milestone.status === "SUBMITTED" ||
    milestone.status === "CHANGES_REQUESTED" ||
    milestone.status === "COMPLETED";
  const hasSubmissions = submissions.length > 0;
  const latestSubmission = hasSubmissions ? submissions[0] : null;
  const isChangesRequested = milestone.status === "CHANGES_REQUESTED";
  const isLate = milestone.status === "LATE";
  const isCompleted = milestone.status === "COMPLETED";

  const steps: StepItem[] = [
    {
      id: "funded",
      label: "Escrow Deposit",
      sublabel: isFunded ? "Funds secured" : "Awaiting deposit",
      status: isFunded
        ? "completed"
        : milestone.paymentStatus === "PENDING"
          ? "current"
          : "upcoming",
      icon: ShieldCheck,
    },
    {
      id: "progress",
      label: "In Progress",
      sublabel: isStarted
        ? milestone.status === "IN_PROGRESS"
          ? "Work underway"
          : "Completed"
        : "Not started",
      status:
        milestone.status === "IN_PROGRESS"
          ? "current"
          : isStarted
            ? "completed"
            : "upcoming",
      icon: Clock,
    },
    {
      id: "submitted",
      label: isLate
        ? "Overdue (Late)"
        : isChangesRequested
          ? "Revisions Requested"
          : "Work Delivered",
      sublabel: isLate
        ? milestone.paymentStatus === "REFUNDED"
          ? "Refunded to client"
          : "Deadline passed"
        : latestSubmission
          ? isChangesRequested
            ? "Action required"
            : formatDate(latestSubmission.submittedAt)
          : "Awaiting submission",
      status:
        isLate || isChangesRequested
          ? "warning"
          : milestone.status === "SUBMITTED"
            ? "current"
            : isCompleted
              ? "completed"
              : "upcoming",
      icon: Upload,
    },
    {
      id: "released",
      label: "Approved & Paid",
      sublabel: isCompleted
        ? formatDate(milestone.completedAt) || "Funds released"
        : "Final payout",
      status: isCompleted ? "completed" : "upcoming",
      icon: Check,
    },
  ];

  return (
    <div className="py-2">
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-start sm:items-center text-left sm:text-center group"
              >
                {/* Connecting Line for desktop */}
                {!isLast && (
                  <div
                    className={`hidden sm:block absolute top-3.5 left-1/2 w-full h-[2px] -z-0 ${
                      step.status === "completed"
                        ? "bg-emerald-500/80"
                        : step.status === "warning"
                          ? "border-t-2 border-dashed border-amber-400"
                          : "border-t-2 border-dashed border-zinc-200 dark:border-zinc-800"
                    }`}
                  />
                )}

                {/* Step Icon Badge */}
                <div className="relative z-10 mb-2 flex items-center justify-center">
                  {step.status === "completed" && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  )}

                  {step.status === "current" && (
                    <div className="relative flex size-7 items-center justify-center rounded-full bg-[#0069D3] text-white shadow-2xs ring-4 ring-blue-500/20">
                      <Loader2 className="size-3.5 animate-spin" />
                    </div>
                  )}

                  {step.status === "warning" && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-amber-600 text-white shadow-2xs ring-4 ring-amber-500/20">
                      <RotateCcw className="size-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  {step.status === "upcoming" && (
                    <div className="flex size-7 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400">
                      <Icon className="size-3" />
                    </div>
                  )}
                </div>

                {/* Step Label & Sublabel */}
                <div className="space-y-0.5">
                  <p
                    className={`text-xs leading-tight ${
                      step.status === "completed"
                        ? "text-foreground font-bold"
                        : step.status === "current"
                          ? "text-[#0069D3] dark:text-blue-400 font-extrabold"
                          : step.status === "warning"
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-muted-foreground font-medium"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                      {step.sublabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
