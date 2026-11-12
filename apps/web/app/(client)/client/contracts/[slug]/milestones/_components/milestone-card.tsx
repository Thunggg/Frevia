"use client";

import Link from "next/link";
import { useFormatter } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  FileCheck,
  Lock,
  Play,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import type { MilestoneType } from "@shared/types";
import { MilestoneMiniStepper } from "./milestone-mini-stepper";

export interface MilestoneCardProps {
  contractId: number;
  contractSlug?: string;
  contractStatus?: string;
  isHeldInContract?: boolean;
  milestone: MilestoneType;
  index: number;
  isFreelancer?: boolean;
  basePath?: string;
  hasOtherInProgressMilestone?: boolean;
  variant?: "table-row" | "card";
  onEdit?: (milestone: MilestoneType) => void;
  onDelete?: (milestone: MilestoneType) => void;
  onFund?: (milestone: MilestoneType) => void;
  onRelease?: (milestone: MilestoneType) => void;
  onRefund?: (milestone: MilestoneType) => void;
  onReview?: (milestone: MilestoneType) => void;
  onSubmitWork?: (milestone: MilestoneType) => void;
  onStartWork?: (milestone: MilestoneType) => void;
}

export function MilestoneCard({
  contractId,
  contractSlug,
  contractStatus,
  isHeldInContract = false,
  milestone,
  index,
  isFreelancer = false,
  basePath = "/client",
  hasOtherInProgressMilestone = false,
  variant = "table-row",
  onEdit,
  onDelete,
  onFund,
  onRelease,
  onRefund,
  onReview,
  onSubmitWork,
  onStartWork,
}: MilestoneCardProps) {
  const format = useFormatter();

  const slugParam = contractSlug || String(contractId);
  const detailUrl = `${basePath}/contracts/${slugParam}/milestones/${milestone.id}`;
  const milestoneCode = `MLS-${String(milestone.id).padStart(4, "0")}`;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue =
    milestone.dueDate &&
    milestone.status !== "COMPLETED" &&
    milestone.status !== "LATE" &&
    new Date(milestone.dueDate).getTime() < new Date().getTime();

  // Status without border and without background color
  const renderWorkStatus = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
            <span>Late</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" />
            <span>Ready for Review</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0069D3] dark:text-blue-400">
            <Clock className="size-3.5" />
            <span>In Progress</span>
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" />
            <span>Revisions Requested</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            ✕ Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Clock className="size-3.5" />
            <span>Draft</span>
          </span>
        );
    }
  };

  const renderEscrowStatus = () => {
    switch (milestone.paymentStatus) {
      case "FUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Lock className="size-3" />
            <span>Funded in Escrow</span>
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0069D3] dark:text-blue-400">
            ✓ Released
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            Pending Escrow
          </span>
        );
    }
  };

  const isClient = !isFreelancer;
  const canEdit =
    isClient &&
    (contractStatus === "AWAITING_PAYMENT" ||
      (contractStatus === "PENDING_SIGN" && !isHeldInContract));
  const canFundMilestone =
    isClient &&
    contractStatus === "ACTIVE" &&
    milestone.paymentStatus === "PENDING" &&
    Boolean(onFund);
  const canReleaseMilestone =
    isClient &&
    milestone.status === "COMPLETED" &&
    milestone.paymentStatus === "FUNDED" &&
    Boolean(onRelease);
  const canRefundMilestone =
    isClient &&
    contractStatus === "ACTIVE" &&
    milestone.paymentStatus === "FUNDED" &&
    (milestone.status === "LATE" || milestone.status === "PENDING") &&
    Boolean(onRefund);

  if (variant === "card") {
    return (
      <div className="border-b border-zinc-100 dark:border-zinc-800/80 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100 block">
              {milestoneCode}
            </span>
            <Link
              href={detailUrl}
              className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-[#0069D3] transition-colors line-clamp-1 mt-0.5"
            >
              {milestone.title}
            </Link>
          </div>
          <span className="font-mono text-sm font-bold text-zinc-950 dark:text-zinc-50 shrink-0">
            ${Number(milestone.amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Stepper */}
        <div className="py-1 overflow-x-auto">
          <MilestoneMiniStepper milestone={milestone} />
        </div>

        {/* Statuses (no border, no bg) */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {renderWorkStatus()}
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          {renderEscrowStatus()}
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-500 font-mono text-[11px]">
            Due: {formatDate(milestone.dueDate)}
          </span>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium"
            >
              <Link href={detailUrl} className="inline-flex items-center gap-1">
                <span>View Details</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>

            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(milestone)}
                className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:text-[#0069D3]"
              >
                <Edit2 className="mr-1 size-3 text-[#0069D3]" />
                <span>Edit</span>
              </Button>
            )}

            {canEdit && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(milestone)}
                className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canFundMilestone && onFund && (
              <Button
                size="sm"
                onClick={() => onFund(milestone)}
                className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3"
              >
                Fund Escrow
              </Button>
            )}

            {canReleaseMilestone && onRelease && (
              <Button
                size="sm"
                onClick={() => onRelease(milestone)}
                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3"
              >
                Release Payment
              </Button>
            )}

            {canRefundMilestone && onRefund && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefund(milestone)}
                className="h-8 rounded-lg border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold px-3 cursor-pointer"
              >
                Refund
              </Button>
            )}

            {isFreelancer &&
              milestone.status === "IN_PROGRESS" &&
              onSubmitWork && (
                <Button
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3"
                >
                  Submit Work
                </Button>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
      {/* Milestone ID & Code */}
      <td className="py-4 px-4 text-xs">
        <Link
          href={detailUrl}
          className="font-mono font-bold text-zinc-950 dark:text-zinc-100 hover:text-[#0069D3] transition-colors block"
        >
          {milestoneCode}
        </Link>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block truncate max-w-[120px]">
          Step {index + 1}
        </span>
      </td>

      {/* Milestone Title & Scope */}
      <td className="py-4 px-4 text-xs max-w-xs">
        <Link
          href={detailUrl}
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[#0069D3] transition-colors line-clamp-1"
        >
          {milestone.title}
        </Link>
        {milestone.description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
            {milestone.description}
          </p>
        )}
      </td>

      {/* Work Status (no border, no bg color) */}
      <td className="py-4 px-4 text-xs">
        <div className="space-y-0.5">
          {renderWorkStatus()}
          <div>{renderEscrowStatus()}</div>
        </div>
      </td>

      {/* Expected Due Date */}
      <td className="py-4 px-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span>{formatDate(milestone.dueDate)}</span>
          {isOverdue && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <AlertTriangle className="size-3" /> Delay
            </span>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="py-4 px-4 text-xs font-mono font-bold text-zinc-950 dark:text-zinc-50 text-right whitespace-nowrap">
        ${Number(milestone.amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
      </td>

      {/* Actions */}
      <td className="py-4 px-4 text-xs text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-2">
          {/* Quick Action Button if pending action */}
          {canFundMilestone && onFund && (
            <Button
              size="sm"
              onClick={() => onFund(milestone)}
              className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3 shadow-xs cursor-pointer"
            >
              <CreditCard className="mr-1 size-3" />
              Fund
            </Button>
          )}

          {canReleaseMilestone && onRelease && (
            <Button
              size="sm"
              onClick={() => onRelease(milestone)}
              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 shadow-xs cursor-pointer"
            >
              Release Payment
            </Button>
          )}

          {canRefundMilestone && onRefund && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefund(milestone)}
              className="h-8 rounded-lg border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold px-3 cursor-pointer"
            >
              Refund
            </Button>
          )}

          {isClient &&
            milestone.status === "SUBMITTED" &&
            onReview && (
              <Button
                size="sm"
                onClick={() => onReview(milestone)}
                className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3 shadow-xs cursor-pointer"
              >
                <FileCheck className="mr-1 size-3" />
                Review
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "PENDING" &&
            milestone.paymentStatus === "FUNDED" &&
            onStartWork && (
              <Button
                size="sm"
                disabled={hasOtherInProgressMilestone}
                onClick={() => onStartWork(milestone)}
                className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3 cursor-pointer"
              >
                <Play className="mr-1 size-3" />
                Start
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "IN_PROGRESS" &&
            onSubmitWork && (
              <Button
                size="sm"
                onClick={() => onSubmitWork(milestone)}
                className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3 cursor-pointer"
              >
                <Upload className="mr-1 size-3" />
                Submit
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "CHANGES_REQUESTED" &&
            onSubmitWork && (
              <Button
                size="sm"
                onClick={() => onSubmitWork(milestone)}
                className="h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 cursor-pointer"
              >
                <RotateCcw className="mr-1 size-3" />
                Resubmit
              </Button>
            )}

          {/* View Details link */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 text-xs font-medium px-2.5"
          >
            <Link href={detailUrl} className="inline-flex items-center gap-1">
              <span>View</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>

          {/* Edit / Delete direct buttons for Client when milestone is pending & unpaid */}
          {canEdit && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(milestone)}
              className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:text-[#0069D3] px-2.5 cursor-pointer"
              title="Edit Milestone"
            >
              <Edit2 className="mr-1 size-3 text-[#0069D3]" />
              <span>Edit</span>
            </Button>
          )}

          {canEdit && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(milestone)}
              className="h-8 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 cursor-pointer"
              title="Delete Milestone"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
