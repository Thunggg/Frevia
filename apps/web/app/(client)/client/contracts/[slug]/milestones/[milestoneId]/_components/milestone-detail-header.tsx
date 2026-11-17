"use client";

import Link from "next/link";
import { useFormatter } from "next-intl";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileCheck,
  Lock,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useActionPermission } from "@/hooks/use-action-permission";
import type { ContractDetailType, MilestoneType } from "@shared/types";

interface MilestoneDetailHeaderProps {
  contract: ContractDetailType;
  milestone: MilestoneType;
  basePath?: string;
}

export function MilestoneDetailHeader({
  contract,
  milestone,
  basePath = "/client",
}: MilestoneDetailHeaderProps) {
  const format = useFormatter();
  const { can } = useActionPermission();
  const canViewMilestones = can("GET", "/api/contracts/:contractId/milestones");

  const rawSlug = contract.slug || String(contract.id);
  const contractSlug = encodeURIComponent(rawSlug);
  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  const milestoneCode = `MLS-${String(milestone.id).padStart(4, "0")}`;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDueCountdown = () => {
    if (milestone.status === "COMPLETED") return "Completed";
    if (!milestone.dueDate) return null;
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || milestone.status === "LATE") {
      const overdueDays = Math.abs(diffDays);
      return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
    }
    if (diffDays === 0) return "Due today";
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
  };

  const renderWorkStatusText = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" />
            <span>Delivered • In Review</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
            <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" />
            <span>Revision Requested</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
            <span>Overdue (Late)</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <Scale className="size-3.5" />
            <span>Disputed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const renderEscrowStatusText = () => {
    switch (milestone.paymentStatus) {
      case "FUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            <span>Escrow Funded</span>
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <Check className="size-3.5" />
            <span>Payment Released</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <RotateCcw className="size-3.5" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            <span>Awaiting Deposit</span>
          </span>
        );
    }
  };

  const countdownText = getDueCountdown();

  return (
    <div className="space-y-3 pb-3 border-b border-border/50">
      {/* ── Breadcrumb ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`${basePath}/contracts`}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Contracts</span>
        </Link>
        <span>/</span>
        <Link
          href={`${basePath}/contracts/${contractSlug}`}
          className="hover:text-foreground transition-colors"
        >
          {contract.slug || contractCode}
        </Link>
        {canViewMilestones && (
          <>
            <span>/</span>
            <Link
              href={`${basePath}/contracts/${contractSlug}/milestones`}
              className="hover:text-foreground transition-colors"
            >
              Milestones
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium">{milestoneCode}</span>
      </div>

      {/* ── Header Title & Details (Clean line, no shouting) ── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {milestoneCode}: {milestone.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {renderWorkStatusText()}
            <span className="text-border">•</span>
            {renderEscrowStatusText()}
            {milestone.dueDate && (
              <>
                <span className="text-border">•</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Due: {formatDate(milestone.dueDate)}
                  {countdownText && (
                    <span className="font-sans ml-1 opacity-75">
                      ({countdownText})
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="shrink-0 sm:text-right">
          <span className="font-mono text-base sm:text-lg font-semibold text-foreground">
            ${Number(milestone.amount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
