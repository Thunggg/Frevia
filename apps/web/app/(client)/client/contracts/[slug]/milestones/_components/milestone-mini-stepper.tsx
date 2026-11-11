"use client";

import { Check, FileText, Lock, Play, Upload } from "lucide-react";
import type { MilestoneType } from "@shared/types";

interface MilestoneMiniStepperProps {
  milestone: MilestoneType;
}

export function MilestoneMiniStepper({ milestone }: MilestoneMiniStepperProps) {
  const isFunded =
    milestone.paymentStatus === "FUNDED" ||
    milestone.paymentStatus === "RELEASED";

  const isStarted =
    milestone.status === "IN_PROGRESS" ||
    milestone.status === "SUBMITTED" ||
    milestone.status === "CHANGES_REQUESTED" ||
    milestone.status === "COMPLETED";

  const isSubmitted =
    milestone.status === "SUBMITTED" ||
    milestone.status === "CHANGES_REQUESTED" ||
    milestone.status === "COMPLETED";

  const isCompleted = milestone.status === "COMPLETED";

  const steps = [
    { id: 1, label: "Created", completed: true, icon: FileText },
    { id: 2, label: "Funded", completed: isFunded, icon: Lock },
    { id: 3, label: "In Progress", completed: isStarted, icon: Play },
    { id: 4, label: "Submitted", completed: isSubmitted, icon: Upload },
    { id: 5, label: "Released", completed: isCompleted, icon: Check },
  ];

  return (
    <div className="inline-flex items-center" title={`Progress: ${milestone.status}`}>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isLast = idx === steps.length - 1;
        const nextStepCompleted = !isLast && Boolean(steps[idx + 1]?.completed);

        return (
          <div key={step.id} className="flex items-center">
            {/* Step node */}
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-all ${
                step.completed
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
              title={step.label}
            >
              <Icon className="size-3 stroke-[2.2]" />
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={`h-[2px] w-4 sm:w-6 transition-colors ${
                  nextStepCompleted
                    ? "bg-zinc-950 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
