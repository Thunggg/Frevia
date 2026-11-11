"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type { MilestoneType } from "@shared/types";

interface FundMilestoneDialogProps {
  contractId: number;
  milestone: MilestoneType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FundMilestoneDialog({
  contractId,
  milestone,
  open,
  onOpenChange,
  onSuccess,
}: FundMilestoneDialogProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<string>("");

  const { data: savedCardsData } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: open,
  });

  const savedCards = savedCardsData?.paymentMethods || [];
  const defaultCard = savedCards.find((card) => card.isDefault) || savedCards[0];

  if (!milestone) return null;

  const milestoneAmount = Number(milestone.amount) || 0;

  const handlePaySavedCard = async (pmId?: string) => {
    setIsProcessing(true);
    try {
      await paymentApiRequest.fundMilestoneWithSavedCard(
        contractId,
        milestone.id,
        pmId || selectedPmId || defaultCard?.id,
      );
      toastSuccess({
        message: `Escrow funded $${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} for "${milestone.title}"!`,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["client-contract-milestones", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-detail", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-detail", contractId, milestone.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["saved-payment-methods"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-transactions"],
        }),
      ]);

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Card payment failed. Redirecting to Stripe Checkout...",
      });
      // Fallback to Stripe Checkout
      await handleStripeCheckout();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      const res =
        await paymentApiRequest.createMilestoneFundCheckoutSession(
          contractId,
          milestone.id,
        );
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to create Stripe Checkout session.",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#0069D3]/10">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  Fund Milestone Escrow
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400 mt-0.5">
                  Funds are held safely in escrow until you approve the work.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4 pt-4">
            {/* Milestone Info Card */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Milestone:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]">
                  {milestone.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Deposit Amount:</span>
                <span className="font-mono font-bold text-zinc-950 dark:text-zinc-50 text-sm">
                  $
                  {milestoneAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/70 dark:border-zinc-800/70">
                <span className="text-zinc-500">Client Fee:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  $0.00 (Covered in initial contract fee)
                </span>
              </div>
            </div>

            {/* 1-Click Saved Card Option if available */}
            {savedCards.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Quick Pay with Saved Card
                  </span>
                  <Link
                    href="/client/payments"
                    className="text-[11px] font-medium text-[#0069D3] hover:underline"
                  >
                    Manage cards
                  </Link>
                </div>
                <div className="space-y-2">
                  {savedCards.map((card) => {
                    const isSelected =
                      (selectedPmId || defaultCard?.id) === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedPmId(card.id)}
                        className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? "border-[#0069D3] bg-[#0069D3]/5"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="size-4 text-[#0069D3]" />
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 uppercase">
                            {card.brand} •••• {card.last4}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {String(card.expMonth).padStart(2, "0")}/
                            {card.expYear}
                          </span>
                          {card.isDefault && (
                            <span className="rounded-full bg-[#0069D3]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0069D3]">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-[#0069D3]">
                          {isSelected ? "Selected" : "Choose"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handlePaySavedCard()}
                  className="w-full h-9 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 size-4 text-amber-300" />
                  )}
                  Pay $
                  {milestoneAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  (1-Click Escrow Deposit)
                </Button>
              </div>
            )}

            {/* Fallback Stripe Checkout */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => void handleStripeCheckout()}
                className="w-full h-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 text-xs font-medium cursor-pointer"
              >
                {isProcessing && savedCards.length === 0 ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 size-3.5 text-zinc-400" />
                )}
                {savedCards.length > 0
                  ? "Pay with Another Card (Stripe Checkout)"
                  : `Deposit $${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} via Stripe`}
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="rounded-lg text-xs cursor-pointer h-8"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
