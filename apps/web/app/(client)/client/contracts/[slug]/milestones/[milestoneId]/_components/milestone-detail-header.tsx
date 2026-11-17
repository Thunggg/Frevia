"use client";

import Link from "next/link";
import { useFormatter } from "next-intl";
import {
  AlertTriangle,
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
  const isFreelancer = basePath === "/freelancer";
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

  const counterparty = isFreelancer ? contract.client : contract.freelancer;
  const counterpartyName =
    counterparty?.profile?.displayName ||
    counterparty?.email?.split("@")[0] ||
    (isFreelancer ? "Client" : "Freelancer");
  const counterpartyRole = isFreelancer ? "Client" : "Freelancer";

  const renderWorkStatusBadge = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" />
            <span>Delivered • In Review</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span className="size-2 rounded-full bg-sky-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" />
            <span>Revision Requested</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
            <span>Overdue (Late)</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Scale className="size-3.5" />
            <span>Disputed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Clock className="size-3.5" />
            <span>Draft / Pending</span>
          </span>
        );
    }
  };

  const renderEscrowBadge = () => {
    switch (milestone.paymentStatus) {
      case "FUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
            <span>Escrow Funded</span>
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="size-4" />
            <span>Payment Released</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <RotateCcw className="size-4" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <Lock className="size-4" />
            <span>Awaiting Deposit</span>
          </span>
        );
    }
  };

  const countdownText = getDueCountdown();
  const isOverdue =
    milestone.dueDate &&
    milestone.status !== "COMPLETED" &&
    milestone.status !== "LATE" &&
    new Date(milestone.dueDate).getTime() < new Date().getTime();

  return (
    <div className="space-y-3 pb-3 border-b border-border/50">
      {/* ── Breadcrumb ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`${basePath}/contracts`}
          className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Contracts</span>
        </Link>
        <span>/</span>
        <Link
          href={`${basePath}/contracts/${contractSlug}`}
          className="font-medium hover:text-foreground transition-colors"
        >
          {contract.slug || contractCode}
        </Link>
        {canViewMilestones && (
          <>
            <span>/</span>
            <Link
              href={`${basePath}/contracts/${contractSlug}/milestones`}
              className="font-medium hover:text-foreground transition-colors"
            >
              Milestones
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-foreground">{milestoneCode}</span>
      </div>

      {/* ── Header Title & Badges ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              {milestoneCode}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {counterpartyRole}: <strong>{counterpartyName}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            {milestone.title}
          </h1>
        </div>

        {/* Right side: Price & Status */}
        <div className="flex items-center gap-4 lg:text-right shrink-0">
          <div>
            <span className="font-mono text-xl sm:text-2xl font-black text-foreground block leading-tight">
              ${Number(milestone.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
            <div className="flex items-center gap-2 justify-end pt-0.5">
              {renderEscrowBadge()}
            </div>
          </div>
          <div className="pl-3 border-l border-border/60">
            {renderWorkStatusBadge()}
          </div>
        </div>
      </div>

      {/* ── Meta Sub-bar ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
        {milestone.dueDate && (
          <div className="inline-flex items-center gap-1.5 font-mono">
            <Clock className="size-3.5" />
            <span
              className={
                isOverdue || milestone.status === "LATE"
                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                  : ""
              }
            >
              Due: {formatDate(milestone.dueDate)}
            </span>
            {countdownText && (
              <span className="font-sans font-medium text-muted-foreground">
                ({countdownText})
              </span>
            )}
          </div>
        )}
        <span>•</span>
        <span>
          Created: {formatDate(milestone.createdAt)}
        </span>
        {milestone.completedAt && (
          <>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Completed on: {formatDate(milestone.completedAt)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
