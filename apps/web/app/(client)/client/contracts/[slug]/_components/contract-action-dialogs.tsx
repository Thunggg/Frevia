"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { StripePaymentDialog } from "@/components/payments/stripe-payment-dialog";
import type { ContractDetailType } from "@shared/types";

interface SavedCardItem {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault?: boolean;
}

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

  // Stripe Payment Modal
  paymentModalOpen: boolean;
  onPaymentModalOpenChange: (open: boolean) => void;
  paymentModalConfig: {
    clientSecret: string;
    amount: number;
    title: string;
    description: string;
  } | null;
  onPaymentSuccess: () => void;

  // 1-Click Saved Card Modal
  oneClickModal: {
    open: boolean;
    type: "PLATFORM_FEE";
    amount: number;
    title: string;
  } | null;
  onCloseOneClickModal: () => void;
  savedCards: SavedCardItem[];
  selectedPmId: string;
  onSelectPmId: (id: string) => void;
  isProcessingOneClick: boolean;
  isInitiatingPayment: boolean;
  onConfirmOneClickPay: () => void;
  onPayViaStripeCheckout: () => void;
  onOpenCustomerPortal: () => void;
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

  paymentModalOpen,
  onPaymentModalOpenChange,
  paymentModalConfig,
  onPaymentSuccess,

  oneClickModal,
  onCloseOneClickModal,
  savedCards,
  selectedPmId,
  onSelectPmId,
  isProcessingOneClick,
  isInitiatingPayment,
  onConfirmOneClickPay,
  onPayViaStripeCheckout,
  onOpenCustomerPortal,
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

      {/* Stripe Payment Dialog */}
      {paymentModalConfig && (
        <StripePaymentDialog
          open={paymentModalOpen}
          onOpenChange={onPaymentModalOpenChange}
          title={paymentModalConfig.title}
          description={paymentModalConfig.description}
          amount={paymentModalConfig.amount}
          clientSecret={paymentModalConfig.clientSecret}
          onSuccess={onPaymentSuccess}
        />
      )}

      {/* Dialog: 1-Click Saved Card Payment Modal for Platform Fee */}
      {oneClickModal && (
        <Dialog
          open={oneClickModal.open}
          onOpenChange={(open) => !open && onCloseOneClickModal()}
        >
          <DialogContent className="max-w-md rounded-[24px] border border-border bg-background p-6 shadow-2xl font-sans space-y-4">
            <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <ShieldCheck className="size-4" />
                </div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Confirm Fee Payment
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {oneClickModal.title}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Fee</span>
                <span className="text-lg font-extrabold text-foreground">
                  {money(oneClickModal.amount)}
                </span>
              </div>
            </div>

            {/* Saved Cards Selection */}
            {savedCards.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Pay with Saved Card (1-Click)
                </label>
                <div className="space-y-2">
                  {savedCards.map((card) => {
                    const isSelected =
                      selectedPmId === card.id ||
                      (!selectedPmId && card.isDefault);
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => onSelectPmId(card.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-[#0069D3] bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-[#0069D3]"
                            : "border-border/80 hover:border-border bg-white dark:bg-zinc-950"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="size-4 text-foreground/80 shrink-0" />
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                              {card.brand} •••• {card.last4}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              Exp: {String(card.expMonth).padStart(2, "0")}/
                              {card.expYear}
                            </span>
                          </div>
                        </div>
                        {card.isDefault && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Default
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={onConfirmOneClickPay}
                disabled={isProcessingOneClick || isInitiatingPayment}
                className="w-full rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-10 shadow-xs cursor-pointer"
              >
                {isProcessingOneClick ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-1.5 size-4" />
                )}
                Pay {money(oneClickModal.amount)} with Saved Card
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPayViaStripeCheckout}
                disabled={isProcessingOneClick || isInitiatingPayment}
                className="w-full rounded-full text-xs font-medium h-9 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {isInitiatingPayment ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-1.5 size-3.5" />
                )}
                Pay with Other Method (Stripe Checkout)
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onOpenCustomerPortal}
                  className="text-[11px] text-muted-foreground hover:text-[#0069D3] underline underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  Manage or change cards in Stripe Customer Portal
                  <ExternalLink className="size-2.5" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
