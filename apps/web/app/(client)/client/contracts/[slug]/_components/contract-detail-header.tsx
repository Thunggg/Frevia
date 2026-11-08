"use client";

import {
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  XCircle,
} from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import type { ContractDetailType } from "@shared/types";
import { CONTRACT_STATUSES } from "../../_components";

interface ContractDetailHeaderProps {
  contract: ContractDetailType;
  isFreelancer: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  tStatus: (status: string) => string;
  isStartingChat: boolean;
  onMessageCounterparty: () => void;
  onOpenEditContract: () => void;
  onOpenFullAgreement: () => void;
  onOpenConfirmComplete: () => void;
  onOpenConfirmCancel: () => void;
}

export function ContractDetailHeader({
  contract,
  isFreelancer,
  t,
  tStatus,
  isStartingChat,
  onMessageCounterparty,
  onOpenEditContract,
  onOpenFullAgreement,
  onOpenConfirmComplete,
  onOpenConfirmCancel,
}: ContractDetailHeaderProps) {
  const getTopStatusBadge = () => {
    switch (contract.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#D0E1F8] text-[#0069D3] border border-[#0069D3]/20">
            {tStatus("ACTIVE")}
          </span>
        );
      case "PENDING_SIGN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-foreground border border-border">
            {tStatus("PENDING_SIGN")}
          </span>
        );
      case "AWAITING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {tStatus("AWAITING_PAYMENT")}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-[#F1F0F5] text-[#0069D3] border border-border">
            {tStatus("COMPLETED")}
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
      case "EXPIRED":
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            {(CONTRACT_STATUSES as readonly string[]).includes(contract.status)
              ? tStatus(contract.status)
              : contract.status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {contract.status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {contract.job?.title || t("agreementFallback")}
          </h1>
        </div>

        {/* Action Menu (...) */}
        <div className="flex items-center gap-2">
          {getTopStatusBadge()}

          <Button
            variant="outline"
            size="sm"
            onClick={onMessageCounterparty}
            disabled={isStartingChat}
            className="h-9 rounded-xl border-border bg-card text-xs font-semibold gap-1.5 cursor-pointer"
          >
            {isStartingChat ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MessageSquare className="size-3.5" />
            )}
            {isFreelancer ? "Chat with Client" : "Chat with Freelancer"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
              {!isFreelancer &&
                contract.status === "PENDING_SIGN" &&
                !contract.signedByClient && (
                  <DropdownMenuItem
                    onClick={onOpenEditContract}
                    className="cursor-pointer text-xs font-medium"
                  >
                    <FileText className="mr-2 size-3.5 text-[#0069D3]" />
                    {t("editContractTerms")}
                  </DropdownMenuItem>
                )}

              <DropdownMenuItem
                onClick={onOpenFullAgreement}
                className="cursor-pointer text-xs font-medium"
              >
                <FileText className="mr-2 size-3.5" />
                {t("viewFullAgreement")}
              </DropdownMenuItem>

              {!isFreelancer && contract.status === "ACTIVE" && (
                <DropdownMenuItem
                  onClick={onOpenConfirmComplete}
                  className="cursor-pointer text-xs font-medium text-emerald-600"
                >
                  <CheckCircle2 className="mr-2 size-3.5" />
                  {t("completeContract")}
                </DropdownMenuItem>
              )}

              {contract.status !== "COMPLETED" &&
                contract.status !== "CANCELLED" &&
                contract.status !== "REJECTED" &&
                contract.status !== "EXPIRED" && (
                  <DropdownMenuItem
                    onClick={onOpenConfirmCancel}
                    className="cursor-pointer text-xs font-medium text-red-600"
                  >
                    <XCircle className="mr-2 size-3.5" />
                    {t("cancelContract")}
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

