"use client";

import Link from "next/link";
import {
  ChevronLeft,
  CreditCard,
  FileCheck,
  Play,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ContractDetailType, MilestoneType } from "@shared/types";

interface MilestoneDetailHeaderProps {
  contract: ContractDetailType;
  milestone: MilestoneType;
  submissionCount?: number;
  basePath?: string;
  isFreelancer?: boolean;
  onFund?: () => void;
  onSubmitWork?: () => void;
  onReview?: () => void;
  onStartWork?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MilestoneDetailHeader({
  contract,
  milestone,
  basePath = "/client",
  isFreelancer = false,
  onFund,
  onSubmitWork,
  onReview,
  onStartWork,
}: MilestoneDetailHeaderProps) {
  const isClient = !isFreelancer;

  const rawSlug = contract.slug || String(contract.id);
  const contractSlug = encodeURIComponent(rawSlug);
  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  return (
    <div className="space-y-4">
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3 text-xs">
        <Link
          href={`${basePath}/contracts`}
          className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Contracts</span>
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <Link
          href={`${basePath}/contracts/${contractSlug}`}
          className="font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {contract.slug || contractCode}
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <Link
          href={`${basePath}/contracts/${contractSlug}/milestones`}
          className="font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Milestone
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <span className="font-semibold text-foreground truncate max-w-xs">
          MLS-{String(milestone.id).padStart(4, "0")}
        </span>
      </div>

      {/* ── Main Header Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isClient &&
            milestone.paymentStatus === "PENDING" &&
            onFund && (
              <Button
                onClick={onFund}
                className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer"
              >
                <CreditCard className="mr-1.5 size-4" />
                Fund Escrow
              </Button>
            )}

          {isClient &&
            milestone.status === "SUBMITTED" &&
            onReview && (
              <Button
                onClick={onReview}
                className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer"
              >
                <FileCheck className="mr-1.5 size-4" />
                Review & Approve Work
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "PENDING" &&
            milestone.paymentStatus === "FUNDED" &&
            onStartWork && (
              <Button
                onClick={onStartWork}
                className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                <Play className="mr-1.5 size-4" />
                Start Milestone
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "IN_PROGRESS" &&
            onSubmitWork && (
              <Button
                onClick={onSubmitWork}
                className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                <Upload className="mr-1.5 size-4" />
                Submit Deliverables
              </Button>
            )}

          {isFreelancer &&
            milestone.status === "CHANGES_REQUESTED" &&
            onSubmitWork && (
              <Button
                onClick={onSubmitWork}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                <RotateCcw className="mr-1.5 size-4" />
                Resubmit Deliverables
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
