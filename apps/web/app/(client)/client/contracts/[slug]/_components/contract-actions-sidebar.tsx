"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileCheck,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import type {
  ContractDetailType,
  SharedFileType,
  StripeConnectStatusResponseType,
} from "@shared/types";

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
  onOpenFundHold?: () => void;
  onOpenConfirmReject?: () => void;
}

export function ContractActionsSidebar({
  contract,
  isFreelancer,
  pdfFile,
  isStartingChat = false,
  isSigning = false,
  onMessageCounterparty,
  onOpenSignConfirm,
  onOpenConfirmComplete,
  onOpenConfirmCancel,
  onOpenFundHold,
  onOpenConfirmReject,
}: ContractActionsSidebarProps) {
  const t = useTranslations("contractDetail");
  const tSidebar = useTranslations("contractWorkspace.sidebar");
  const tStatus = useTranslations("contractStatus");
  const tRole = useTranslations("roleName");
  const { can } = useActionPermission();
  const canSignContract = can("PATCH", "/api/contracts/:id/sign");
  const canCompleteContract = can("PATCH", "/api/contracts/:id/complete");
  const canCancelContract = can("PATCH", "/api/contracts/:id/cancel");
  const canRejectContract = can("PATCH", "/api/contracts/:id/reject");
  const canExportPdf = can("GET", "/api/contracts/:id/pdf");
  const canCreateConversation = can("POST", "/api/conversations");
  const canFundContractHold = can(
    "POST",
    "/api/payments/contracts/:contractId/fund-hold/intent",
  );
  const canGetConnectStatus = can("GET", "/api/payments/connect/status");

  const shouldCheckStripeOnboarding =
    isFreelancer &&
    !contract.signedByFreelancer &&
    (contract.status === "AWAITING_PAYMENT" ||
      contract.status === "PENDING_SIGN") &&
    canGetConnectStatus;

  const { data: connectStatus, isLoading: isConnectLoading } =
    useQuery<StripeConnectStatusResponseType>({
      queryKey: ["stripe-connect-status"],
      queryFn: async () => {
        const res = await paymentApiRequest.getConnectStatus();
        return res.data;
      },
      enabled: shouldCheckStripeOnboarding,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    });

  const isStripeOnboardingReady = Boolean(
    connectStatus?.isConnected && connectStatus?.payoutsEnabled,
  );
  const needsStripeOnboarding =
    shouldCheckStripeOnboarding &&
    !isConnectLoading &&
    !isStripeOnboardingReady;

  const canSign =
    (isFreelancer
      ? contract.status === "PENDING_SIGN" &&
        contract.signedByClient &&
        !contract.signedByFreelancer
      : contract.status === "PENDING_SIGN" && !contract.signedByClient) &&
    canSignContract;

  const waitingForClientSignature =
    isFreelancer &&
    contract.status === "PENDING_SIGN" &&
    !contract.signedByClient;

  const canFundHold =
    !isFreelancer &&
    contract.status === "AWAITING_PAYMENT" &&
    Boolean(onOpenFundHold) &&
    canFundContractHold;

  const hasUnsettledMilestones =
    Array.isArray(contract.milestones) &&
    contract.milestones.some(
      (m) => m.paymentStatus !== "RELEASED" && m.paymentStatus !== "REFUNDED"
    );

  const canComplete =
    !isFreelancer &&
    contract.status === "ACTIVE" &&
    canCompleteContract &&
    !hasUnsettledMilestones;

  const canReject =
    isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT") &&
    Boolean(onOpenConfirmReject) &&
    canRejectContract;

  const canCancel =
    !isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT") &&
    canCancelContract;

  const targetRoleName = isFreelancer ? tRole("CLIENT") : tRole("FREELANCER");

  // Get status color
  const getStatusBadge = () => {
    switch (contract.status) {
      case "ACTIVE":
        return (
          <Badge className="bg-white border-0 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-white shadow-none">
            {tStatus("ACTIVE")}
          </Badge>
        );
      case "PENDING_SIGN":
        return (
          <Badge className="bg-white border-0 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-white shadow-none">
            {tStatus("PENDING_SIGN")}
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-white border-0 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-white shadow-none">
            {tStatus("COMPLETED")}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-white border-0 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-white shadow-none">
            {tStatus("CANCELLED")}
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
            {tSidebar("contractStatus")}
          </span>
          {getStatusBadge()}
        </div>

        {/* Signatures status pill */}
        <div className="mt-3.5 space-y-2 rounded-xl bg-muted/30 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {tSidebar("clientSignature")}
            </span>
            {contract.signedByClient ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> {tSidebar("signed")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Clock className="size-3.5" /> {tSidebar("pending")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {tSidebar("freelancerSignature")}
            </span>
            {contract.signedByFreelancer ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> {tSidebar("signed")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Clock className="size-3.5" /> {tSidebar("pending")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          {tSidebar("actionsTitle")}
        </span>
        {/* 1. Authorize Escrow Hold (Client while AWAITING_PAYMENT) */}
        {canFundHold && (
          <div className="space-y-1.5">
            <Button
              onClick={onOpenFundHold}
              className="w-full h-10 rounded-xl bg-[#0069D3] hover:bg-[#0055b3] text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              <CreditCard className="mr-2 size-4" />
              {tSidebar("fundContractEscrow")}
            </Button>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {tSidebar("fundEscrowHint")}
            </p>
          </div>
        )}

        {contract.status === "PENDING_SIGN" && contract.holdPaymentIntentId && (
          <div className="rounded-xl border border-[#0069D3]/20 bg-[#0069D3]/5 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-[#0069D3] block">
              {tSidebar("escrowHoldAuthorized")}
            </span>
            {tSidebar("escrowHoldDetail", {
              count: contract.holdMilestoneIds?.length ?? 1,
            })}
          </div>
        )}

        {/* 2. Freelancer Stripe Onboarding Gate */}
        {needsStripeOnboarding && (
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] leading-snug">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  {tSidebar("stripeRequiredTitle")}
                </p>
                <p className="text-amber-800/85 dark:text-amber-300/80">
                  {tSidebar("stripeRequiredDesc")}
                </p>
              </div>
            </div>
            <Link
              href="/freelancer/payments"
              className="w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium transition-colors"
            >
              <span>{tSidebar("completeStripeOnboarding")}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* 3. Sign Contract Button */}
        {canSign && (
          <Button
            onClick={onOpenSignConfirm}
            disabled={
              isSigning ||
              (shouldCheckStripeOnboarding &&
                (isConnectLoading || !isStripeOnboardingReady))
            }
            className="w-full h-10 rounded-xl bg-[#0069D3] hover:bg-[#0055b3] text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSigning || (shouldCheckStripeOnboarding && isConnectLoading) ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileCheck className="mr-2 size-4" />
            )}
            {t("signAction")}
          </Button>
        )}

        {waitingForClientSignature && (
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            {tSidebar("waitingClientSign")}
          </div>
        )}

        {/* 5. Download PDF Agreement */}
        {canExportPdf && (pdfFile?.fileUrl || contract.id) && (
          <a
            href={pdfFile?.fileUrl || `/api/contracts/${contract.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="w-full h-9 inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
          >
            <Download className="mr-2 size-3.5 text-[#0069D3]" />
            {tSidebar("downloadPdfAgreement")}
          </a>
        )}

        {/* 6. Message Counterparty */}
        {canCreateConversation && (
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
        )}
      </div>

      {/* ── Secondary / Lifecycle Actions ── */}
      {(canComplete || canCancel || canReject) && (
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

          {canReject && (
            <Button
              variant="ghost"
              onClick={onOpenConfirmReject}
              className="w-full h-8 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 text-xs font-medium cursor-pointer"
            >
              <XCircle className="mr-1.5 size-3.5 text-rose-500" />
              {tSidebar("declineOffer")}
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
