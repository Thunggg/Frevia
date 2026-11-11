"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import type { ContractDetailType } from "@shared/types";

interface ContractActionDialogsProps {
  contract: ContractDetailType;
  isFreelancer: boolean;
  clientName: string;
  freelancerName: string;
  avatarUrl?: string | null;
  freelancerId?: number;
  money: (amount: number | string, currency?: string) => string;
  contractStatusText: string;

  // Profile Sheet
  profileSheetOpen: boolean;
  onOpenProfileSheetChange: (open: boolean) => void;

  // Full Agreement Sheet
  fullContractOpen: boolean;
  onOpenFullContractChange: (open: boolean) => void;

  // Sign Confirmation
  confirmSign: boolean;
  onConfirmSignChange: (open: boolean) => void;
  isSigning: boolean;
  onSign: () => void;

  // Complete Confirmation
  confirmComplete: boolean;
  onConfirmCompleteChange: (open: boolean) => void;
  isCompleting: boolean;
  onComplete: () => void;

  // Cancel Confirmation
  confirmCancel: boolean;
  onConfirmCancelChange: (open: boolean) => void;
  isCancelling: boolean;
  onCancel: () => void;

  // Freelancer Reject Confirmation
  confirmReject: boolean;
  onConfirmRejectChange: (open: boolean) => void;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  isRejecting: boolean;
  onReject: () => void;
}

export function ContractActionDialogs({
  contract,
  isFreelancer,
  clientName,
  freelancerName,
  avatarUrl,
  freelancerId,
  money,
  contractStatusText,

  profileSheetOpen,
  onOpenProfileSheetChange,

  fullContractOpen,
  onOpenFullContractChange,

  confirmSign,
  onConfirmSignChange,
  isSigning,
  onSign,

  confirmComplete,
  onConfirmCompleteChange,
  isCompleting,
  onComplete,

  confirmCancel,
  onConfirmCancelChange,
  isCancelling,
  onCancel,

  confirmReject,
  onConfirmRejectChange,
  rejectReason,
  onRejectReasonChange,
  isRejecting,
  onReject,
}: ContractActionDialogsProps) {
  const t = useTranslations("contractDetail");
  const tCommon = useTranslations("common");
  const totalContractAmount = contract.totalAmount;

  return (
    <>
      {/* Sheet: View Full Contract Agreement */}
      <Sheet open={fullContractOpen} onOpenChange={onOpenFullContractChange}>
        <SheetContent
          side="right"
          closeLabel={tCommon("close")}
          className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
        >
          <div>
            <SheetHeader className="p-0 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="size-5 text-[#0069D3]" />
                <SheetTitle className="text-lg font-bold">
                  {t("agreementTitle", { id: contract.id })}
                </SheetTitle>
              </div>
              <SheetDescription className="mt-1 text-xs text-muted-foreground">
                {contract.job?.title}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("totalAmount")}
                  </span>
                  <span className="font-bold text-foreground">
                    {money(totalContractAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("statusLabel")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {contractStatusText}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-foreground block mb-1">
                  {t("termsTitle")}
                </span>
                <div className="rounded-xl border border-border bg-card p-4 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {contract.terms || t("defaultFullTerms")}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog: Confirm Sign Contract */}
      <AlertDialog open={confirmSign} onOpenChange={onConfirmSignChange}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("signAction")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t.rich("signHint", {
                amount: money(totalContractAmount),
                name: isFreelancer ? clientName : freelancerName,
                strong: (chunks) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isSigning}
                onClick={onSign}
                className="w-full rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold cursor-pointer"
              >
                {isSigning ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-1.5 size-3.5" />
                )}
                {t("confirmSign")}
              </Button>
              <AlertDialogCancel
                disabled={isSigning}
                className="w-full rounded-full text-xs cursor-pointer"
              >
                {tCommon("cancel")}
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Complete Contract */}
      <AlertDialog
        open={confirmComplete}
        onOpenChange={onConfirmCompleteChange}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("completeContract")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("completeHint")}
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isCompleting}
                onClick={onComplete}
                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                {isCompleting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                )}
                {t("markCompleted")}
              </Button>
              <AlertDialogCancel
                disabled={isCompleting}
                className="w-full rounded-full text-xs cursor-pointer"
              >
                {tCommon("cancel")}
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Cancel Contract */}
      <AlertDialog open={confirmCancel} onOpenChange={onConfirmCancelChange}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("cancelContract")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("cancelHint")}
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isCancelling}
                onClick={onCancel}
                className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                {isCancelling ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 size-3.5" />
                )}
                {t("confirmCancel")}
              </Button>
              <AlertDialogCancel
                disabled={isCancelling}
                className="w-full rounded-full text-xs cursor-pointer"
              >
                {t("goBack")}
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embedded Freelancer Profile Sheet */}
      {!isFreelancer && (
        <FreelancerProfileSheet
          open={profileSheetOpen}
          onOpenChange={onOpenProfileSheetChange}
          profileId={freelancerId ?? null}
          initialData={{
            displayName: freelancerName,
            avatarUrl: avatarUrl ?? null,
            title: null,
            freelancerId,
          }}
        />
      )}

      {/* Freelancer Reject Offer Confirmation */}
      <AlertDialog
        open={confirmReject}
        onOpenChange={onConfirmRejectChange}
      >
        <AlertDialogContent className="rounded-3xl p-6 max-w-md border border-border/80 shadow-xl font-sans">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <XCircle className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Decline Contract Offer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Declining this contract releases the Client&apos;s card
              authorization hold immediately with zero refund fee.
            </AlertDialogDescription>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="Optional reason for declining..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
            />

            <div className="flex flex-col gap-2 w-full pt-2">
              <Button
                disabled={isRejecting}
                onClick={onReject}
                className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 shadow-xs cursor-pointer"
              >
                {isRejecting ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 size-4" />
                )}
                Confirm Decline
              </Button>
              <AlertDialogCancel
                disabled={isRejecting}
                className="w-full rounded-full text-xs cursor-pointer"
              >
                {t("goBack")}
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
