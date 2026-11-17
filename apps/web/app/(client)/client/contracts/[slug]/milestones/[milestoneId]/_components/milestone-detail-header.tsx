"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
  const { can } = useActionPermission();
  const canViewMilestones = can("GET", "/api/contracts/:contractId/milestones");

  const rawSlug = contract.slug || String(contract.id);
  const contractSlug = encodeURIComponent(rawSlug);
  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contract.id}`;

  const milestoneCode = `MLS-${String(milestone.id).padStart(4, "0")}`;

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
    </div>
  );
}
