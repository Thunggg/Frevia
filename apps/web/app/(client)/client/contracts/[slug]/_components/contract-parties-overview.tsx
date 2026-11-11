"use client";

import Link from "next/link";
import { CheckCircle2, FileText } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ContractDetailType } from "@shared/types";

interface ContractPartiesOverviewProps {
  contract: ContractDetailType;
  isFreelancer: boolean;
  clientName: string;
  clientAvatarUrl?: string | null;
  freelancerName: string;
  avatarUrl?: string | null;
  money: (amount: number | string, currency?: string) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tRole: (role: string) => string;
  onOpenEditContract: () => void;
  onOpenProfileSheet: () => void;
  onOpenFullAgreement: () => void;
}

export function ContractPartiesOverview({
  contract,
  isFreelancer,
  clientName,
  clientAvatarUrl,
  freelancerName,
  avatarUrl,
  money,
  t,
  tRole,
  onOpenEditContract,
  onOpenProfileSheet,
  onOpenFullAgreement,
}: ContractPartiesOverviewProps) {
  const clientFee =
    Number(contract.clientPlatformFee) ||
    Math.round(Number(contract.totalAmount) * 0.03 * 100) / 100;

  const freelancerFee =
    Math.round(Number(contract.totalAmount) * 0.05 * 100) / 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs font-sans">
      {/* Header: Title & Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-3">
        <h2 className="text-base font-bold text-foreground">
          {t("detailsTitle")}
        </h2>

        {!isFreelancer &&
          contract.status === "PENDING_SIGN" &&
          !contract.signedByClient && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEditContract}
              className="rounded-full text-xs gap-1.5 h-8 border-border hover:bg-accent self-start sm:self-auto cursor-pointer"
            >
              <FileText className="size-3.5 text-[#0069D3]" />
              {t("editContract")}
            </Button>
          )}
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
        {/* Left Subcolumn */}
        <div className="space-y-4">
          {/* Job Link */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("jobLabel")}
            </span>
            <Link
              href={
                isFreelancer
                  ? `/freelancer/jobs/${contract.job?.slug || contract.jobId}`
                  : `/client/jobs/${contract.jobId}`
              }
              className="text-sm font-bold text-[#0069D3] hover:underline mt-1 inline-block line-clamp-2"
            >
              {contract.job?.title || t("viewJobPosting")}
            </Link>
          </div>

          {/* Counterparty & Parties info */}
          <div className="grid grid-cols-2 gap-3">
            {/* Client Info */}
            <div className="rounded-xl border border-border/60 p-3 bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {tRole("CLIENT")}
              </span>
              <Link
                href={`/clients/${contract.clientId}`}
                className="flex items-center gap-2 mt-2 group"
              >
                <Avatar className="size-7 border border-border">
                  <AvatarImage src={clientAvatarUrl || undefined} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {clientName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate block">
                    {clientName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    ID #{contract.clientId}
                  </span>
                </div>
              </Link>
            </div>

            {/* Freelancer Info */}
            <div className="rounded-xl border border-border/60 p-3 bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {tRole("FREELANCER")}
              </span>
              <div
                onClick={onOpenProfileSheet}
                className="flex items-center gap-2 mt-2 cursor-pointer group"
              >
                <Avatar className="size-7 border border-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {freelancerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground group-hover:text-[#0069D3] transition-colors truncate block">
                    {freelancerName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    ID #{contract.freelancerId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Budget & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3 bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("totalAmount")}
              </span>
              <span className="text-base font-extrabold text-foreground mt-1 block font-mono">
                {money(contract.totalAmount)}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 p-3 bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("paymentMethod")}
              </span>
              <span className="text-xs font-semibold text-foreground mt-1 block">
                Frevia Escrow Protection
              </span>
            </div>
          </div>

          {/* Platform Fee Breakdown */}
          <div className="rounded-xl border border-border/60 p-3.5 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Platform Fees
              </span>
              <span className="text-[11px] text-muted-foreground">
                Client (3%) • Freelancer (5%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center justify-between border rounded-lg p-2 bg-card">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Client (3%):</span>
                  <span className="text-xs font-bold font-mono text-foreground">
                    {money(clientFee)}
                  </span>
                </div>
                {contract.clientFeeStatus === "PAID" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="size-3" /> Paid
                  </span>
                ) : contract.holdPaymentIntentId ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0069D3] bg-[#0069D3]/10 px-1.5 py-0.5 rounded">
                    Held (Pending Capture)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                    Awaiting Hold
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border rounded-lg p-2 bg-card">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Freelancer (5%):</span>
                  <span className="text-xs font-bold font-mono text-foreground">
                    {money(freelancerFee)}
                  </span>
                </div>
                {contract.freelancerFeeStatus === "PAID" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="size-3" /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                    On Release
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Subcolumn: Terms / Scope */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="rounded-xl border border-border/60 p-3.5 bg-card space-y-1.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("descriptionScope")}
              </span>
              <button
                type="button"
                onClick={onOpenFullAgreement}
                className="text-[11px] font-medium text-[#0069D3] hover:underline cursor-pointer"
              >
                {t("viewFullAgreement")}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-8 whitespace-pre-wrap flex-1">
              {contract.terms || t("defaultTerms")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

