"use client";

import { useFormatter } from "next-intl";
import { Check, Clock, Loader2, RotateCcw } from "lucide-react";
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
  const isCompleted = milestone.status === "COMPLETED";

  const steps: StepItem[] = [
    {
      id: "created",
      label: "Created",
      sublabel: formatDate(milestone.createdAt),
      status: "completed",
    },
    {
      id: "funded",
      label: "Escrow Funded",
      sublabel: isFunded ? "Secured" : "Pending deposit",
      status: isFunded
        ? "completed"
        : milestone.paymentStatus === "PENDING"
          ? "current"
          : "upcoming",
    },
    {
      id: "progress",
      label: "In Progress",
      sublabel: isStarted
        ? milestone.status === "IN_PROGRESS"
          ? "Active work"
          : "Done"
        : "Not started",
      status:
        milestone.status === "IN_PROGRESS"
          ? "current"
          : isStarted
            ? "completed"
            : "upcoming",
    },
    {
      id: "submitted",
      label: isChangesRequested ? "Correction Requested" : "Submitted for Review",
      sublabel: latestSubmission
        ? isChangesRequested
          ? "Revisions needed"
          : formatDate(latestSubmission.submittedAt)
        : "Awaiting deliverables",
      status: isChangesRequested
        ? "warning"
        : milestone.status === "SUBMITTED"
          ? "current"
          : isCompleted
            ? "completed"
            : "upcoming",
    },
    {
      id: "released",
      label: "Accepted & Released",
      sublabel: isCompleted
        ? formatDate(milestone.completedAt) || "Payment released"
        : "Final approval",
      status: isCompleted ? "completed" : "upcoming",
    },
  ];

  return (
    <div className="mx-[-30] dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-start sm:items-center text-left sm:text-center group"
              >
                {/* Connecting Line for desktop */}
                {!isLast && (
                  <div
                    className={`hidden sm:block absolute top-3.5 left-1/2 w-full h-[2px] -z-0 ${step.status === "completed"
                      ? "bg-zinc-950 dark:bg-zinc-100"
                      : step.status === "warning"
                        ? "border-t-2 border-dashed border-amber-400"
                        : "border-t-2 border-dashed border-zinc-200 dark:border-zinc-800"
                      }`}
                  />
                )}

                {/* Step Icon Badge */}
                <div className="relative z-10 mb-2 flex items-center justify-center">
                  {step.status === "completed" && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs">
                      <Check className="size-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  {step.status === "current" && (
                    <div className="relative flex size-7 items-center justify-center rounded-full bg-[#0069D3] text-white shadow-2xs">
                      <Loader2 className="size-3.5 animate-spin" />
                    </div>
                  )}

                  {step.status === "warning" && (
                    <div className="flex size-7 items-center justify-center rounded-full bg-amber-600 text-white shadow-2xs">
                      <RotateCcw className="size-3 stroke-[2.5]" />
                    </div>
                  )}

                  {step.status === "upcoming" && (
                    <div className="flex size-7 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
                      <div className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  )}
                </div>

                {/* Step Label & Sublabel */}
                <div className="space-y-0.5">
                  <p
                    className={`text-xs leading-tight ${step.status === "completed"
                      ? "text-zinc-950 dark:text-zinc-100"
                      : step.status === "current"
                        ? "text-[#0069D3] dark:text-blue-400 font-extrabold"
                        : step.status === "warning"
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                  >
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[130px]">
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
