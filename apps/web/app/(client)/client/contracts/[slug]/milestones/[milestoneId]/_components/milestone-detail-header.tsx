"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
  const rawSlug = contract.slug || String(contract.id);
  const contractSlug = encodeURIComponent(rawSlug);
  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  return (
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
  );
}
