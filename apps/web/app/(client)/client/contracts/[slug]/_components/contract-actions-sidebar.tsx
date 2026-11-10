"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Download,
  FileEdit,
  FileCheck,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import type { ContractDetailType, SharedFileType } from "@shared/types";

interface ContractActionsSidebarProps {
  contract: ContractDetailType;
  isFreelancer: boolean;
  basePath?: string;
  pdfFile?: SharedFileType | null;
  isStartingChat?: boolean;
  isSigning?: boolean;
  onMessageCounterparty: () => void;
  onOpenSignConfirm: () => void;
  onOpenEditContract?: () => void;
  onOpenAddMilestone?: () => void;
  onOpenConfirmComplete: () => void;
  onOpenConfirmCancel: () => void;
  onPayPlatformFee?: () => void;
}

export function ContractActionsSidebar({
  contract,
  isFreelancer,
  basePath = "/client",
  pdfFile,
  isStartingChat = false,
  isSigning = false,
  onMessageCounterparty,
  onOpenSignConfirm,
  onOpenEditContract,
  onOpenAddMilestone,
  onOpenConfirmComplete,
  onOpenConfirmCancel,
  onPayPlatformFee,
}: ContractActionsSidebarProps) {
  const t = useTranslations("contractDetail");
  const tStatus = useTranslations("contractStatus");
  const tRole = useTranslations("roleName");

  const canSign = isFreelancer
    ? !contract.signedByFreelancer && contract.status === "PENDING_SIGN"
    : !contract.signedByClient && contract.status === "PENDING_SIGN";

  const canEdit =
    !isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT");

  const canAddMilestone =
    !isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT");

  const canPayPlatformFee =
    !isFreelancer &&
    contract.platformFeeStatus === "UNPAID" &&
    Boolean(onPayPlatformFee);

  const canComplete =
    !isFreelancer && contract.status === "ACTIVE";

  const canCancel =
    contract.status === "PENDING_SIGN" || contract.status === "AWAITING_PAYMENT";

  const targetRoleName = isFreelancer ? tRole("CLIENT") : tRole("FREELANCER");

  // Get status color
  const getStatusBadge = () => {
    switch (contract.status) {
      case "ACTIVE":
        return (
          <Badge className="bg-white border-0 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-white shadow-none">
            Active
          </Badge>
        );
      case "PENDING_SIGN":
        return (
          <Badge className="bg-white border-0 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-white shadow-none">
            Pending Signatures
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-white border-0 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-white shadow-none">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-white border-0 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-white shadow-none">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {tStatus(contract.status) || contract.status}
          </Badge>
        );
    }
  };

  return (
    <div className="border border-border bg-card p-5 shadow-xs space-y-5 font-sans">
      {/* ── Status & Summary ── */}
      <div className="border-b border-border/70 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contract Status
          </span>
          {getStatusBadge()}
        </div>

        {/* Signatures status pill */}
        <div className="mt-3.5 space-y-2 rounded-xl bg-muted/30 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Client Signature:</span>
            {contract.signedByClient ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Signed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Clock className="size-3.5" /> Pending
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Freelancer Signature:</span>
            {contract.signedByFreelancer ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Signed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Clock className="size-3.5" /> Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Actions
        </span>
        {/* 1. Sign Contract Button */}
        {canSign && (
          <Button
            onClick={onOpenSignConfirm}
            disabled={isSigning}
            className="w-full h-10 rounded-xl bg-[#0069D3] hover:bg-[#0055b3] text-white font-semibold text-xs shadow-sm cursor-pointer"
          >
            {isSigning ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileCheck className="mr-2 size-4" />
            )}
            {t("signAction")}
          </Button>
        )}

        {/* 4. Pay Platform Fee (Client) */}
        {canPayPlatformFee && (
          <Button
            onClick={onPayPlatformFee}
            className="w-full h-9 rounded-xl bg-emerald-400 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs cursor-pointer"
          >
            <CreditCard className="mr-2 size-3.5" />
            Pay Platform Fee
          </Button>
        )}

        {/* 5. Download PDF Agreement */}
        {pdfFile?.fileUrl && (
          <a
            href={pdfFile.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="w-full h-9 inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
          >
            <Download className="mr-2 size-3.5 text-[#0069D3]" />
            Download PDF Agreement
          </a>
        )}

        {/* 6. Message Counterparty */}
        <Button
          variant="secondary"
          onClick={onMessageCounterparty}
          disabled={isStartingChat}
          className="w-full h-9 rounded-xl text-xs font-medium cursor-pointer"
        >
          {isStartingChat ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 size-3.5 text-zinc-600 dark:text-zinc-300" />
          )}
          {t("messageRole", { role: targetRoleName })}
        </Button>
      </div>

      {/* ── Secondary / Lifecycle Actions ── */}
      {(canComplete || canCancel) && (
        <div className="border-t border-border/70 pt-4 space-y-2">
          {canComplete && (
            <Button
              variant="outline"
              onClick={onOpenConfirmComplete}
              className="w-full h-8 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 text-xs font-medium cursor-pointer"
            >
              <ShieldCheck className="mr-1.5 size-3.5 text-emerald-600" />
              {t("completeContract")}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="ghost"
              onClick={onOpenConfirmCancel}
              className="w-full h-8 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 text-xs font-medium cursor-pointer"
            >
              <XCircle className="mr-1.5 size-3.5 text-rose-500" />
              {t("cancelContract")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
