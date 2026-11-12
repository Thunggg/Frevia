"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "@/components/icons";
import { paymentApiRequest } from "@/apiRequests/payment";
import dynamic from "next/dynamic";
import { ApiFail } from "@/lib/http";

const StripePaymentDialog = dynamic(
  () =>
    import("@/components/payments/stripe-payment-dialog").then(
      (m) => m.StripePaymentDialog,
    ),
  { ssr: false },
);
import type { ContractDetailType } from "@shared/types";

interface FundContractHoldSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetailType;
  initialMilestoneId?: number;
  onSuccess: () => void;
}

export function FundContractHoldSheet({
  open,
  onOpenChange,
  contract,
  initialMilestoneId,
  onSuccess,
}: FundContractHoldSheetProps) {
  const pendingMilestones = useMemo(
    () =>
      (contract.milestones ?? []).filter(
        (m) => (m.paymentStatus || "PENDING") === "PENDING",
      ),
    [contract.milestones],
  );

  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [stripeModal, setStripeModal] = useState<{
    open: boolean;
    clientSecret: string;
    amount: number;
  }>({ open: false, clientSecret: "", amount: 0 });

  const { data: savedCardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: open,
  });

  const savedCards = savedCardsData?.paymentMethods ?? [];
  const defaultCard =
    savedCards.find((card) => card.isDefault) ?? savedCards[0];
  const useNewCard = selectedPmId === "__NEW__" || savedCards.length === 0;
  const activePaymentMethodId = useNewCard
    ? undefined
    : selectedPmId && savedCards.some((card) => card.id === selectedPmId)
      ? selectedPmId
      : defaultCard?.id;

  useEffect(() => {
    if (!open) return;
    setSelectedPmId(null);
    if (
      initialMilestoneId &&
      pendingMilestones.some((m) => m.id === initialMilestoneId)
    ) {
      setSelectedIds([initialMilestoneId]);
      return;
    }
    if (pendingMilestones.length > 0 && pendingMilestones[0]) {
      setSelectedIds([pendingMilestones[0].id]);
    } else {
      setSelectedIds([]);
    }
  }, [open, initialMilestoneId, pendingMilestones]);

  const milestonesSubtotal = useMemo(
    () =>
      Math.round(
        pendingMilestones
          .filter((m) => selectedIds.includes(m.id))
          .reduce((sum, m) => sum + Number(m.amount || 0), 0) * 100,
      ) / 100,
    [pendingMilestones, selectedIds],
  );

  const clientFeeAmount = useMemo(
    () => Math.round(Number(contract.totalAmount || 0) * 0.03 * 100) / 100,
    [contract.totalAmount],
  );

  const totalHoldAmount =
    Math.round((milestonesSubtotal + clientFeeAmount) * 100) / 100;

  const toggleMilestone = (milestoneId: number) => {
    setSelectedIds((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId],
    );
  };

  const selectAllPending = () => {
    setSelectedIds(pendingMilestones.map((m) => m.id));
  };

  const selectFirstOnly = () => {
    if (pendingMilestones[0]) {
      setSelectedIds([pendingMilestones[0].id]);
    }
  };

  const formatMoney = (value: number) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleAuthorizeHold = async () => {
    if (selectedIds.length === 0) {
      toastError({
        message: "Please select at least one milestone to authorize.",
      });
      return;
    }

    setIsCreatingIntent(true);
    try {
      const response = await paymentApiRequest.createContractHoldIntent(
        contract.id,
        selectedIds,
        activePaymentMethodId,
      );
      const data = response.data;
      if (data?.authorized) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["client-contract-detail", contract.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["client-contract-milestones", contract.id],
          }),
          queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
          queryClient.invalidateQueries({
            queryKey: ["saved-payment-methods"],
          }),
        ]);
        toastSuccess({
          message:
            "Card hold authorized with your saved card! You can now sign the contract.",
        });
        onOpenChange(false);
        onSuccess();
        return;
      }

      if (!data?.clientSecret) {
        toastError({
          message: "Stripe did not return a payment secret. Please try again.",
        });
        return;
      }

      onOpenChange(false);
      setStripeModal({
        open: true,
        clientSecret: data.clientSecret,
        amount: data.amount,
      });
    } catch (error) {
      let errorMessage = "Failed to initialize payment hold.";
      if (error instanceof ApiFail) {
        const resp = error.response as unknown as Record<string, unknown>;
        if (Array.isArray(resp?.message) && resp.message[0]?.message) {
          errorMessage = String(resp.message[0].message);
        } else if (typeof resp?.message === "string") {
          errorMessage = resp.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toastError({ message: errorMessage });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
        >
          <div className="space-y-5">
            <SheetHeader className="p-0 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2 text-[#0069D3]">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                  <ShieldCheck className="size-5" />
                </div>
                <SheetTitle className="text-lg font-bold text-foreground">
                  Authorize Contract Escrow Hold
                </SheetTitle>
              </div>
              <SheetDescription className="mt-1 text-xs text-muted-foreground">
                Select at least 1 milestone (or all milestones) plus the 3%
                contract fee to place a card hold before signing.
              </SheetDescription>
            </SheetHeader>

            {/* Quick selection controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Select Milestones to Hold ({selectedIds.length}/
                {pendingMilestones.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectFirstOnly}
                  disabled={pendingMilestones.length === 0}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  First only
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={selectAllPending}
                  disabled={pendingMilestones.length === 0}
                  className="text-[11px] font-semibold text-[#0069D3] hover:underline cursor-pointer"
                >
                  Select all
                </button>
              </div>
            </div>

            {/* Milestones list */}
            {pendingMilestones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Please create at least one milestone before authorizing the
                contract escrow hold.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pendingMilestones.map((milestone, index) => {
                  const checked = selectedIds.includes(milestone.id);
                  return (
                    <label
                      key={milestone.id}
                      onClick={() => toggleMilestone(milestone.id)}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        checked
                          ? "border-[#0069D3] bg-[#0069D3]/5"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleMilestone(milestone.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {index + 1}. {milestone.title}
                          </p>
                          {milestone.dueDate && (
                            <p className="text-[11px] text-muted-foreground">
                              Due{" "}
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-foreground shrink-0">
                        {formatMoney(Number(milestone.amount))}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Hold Summary */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Selected Milestones ({selectedIds.length})
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatMoney(milestonesSubtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Client Contract Fee (3% of{" "}
                  {formatMoney(Number(contract.totalAmount || 0))})
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatMoney(clientFeeAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-sm">
                <span>Total Authorization Hold</span>
                <span className="font-mono text-[#0069D3]">
                  {formatMoney(totalHoldAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method (Synced with Billing & Payments) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Payment Method
                </span>
                <Link
                  href="/client/payments"
                  className="text-[11px] font-medium text-[#0069D3] hover:underline"
                >
                  Manage in Billing &amp; Payments
                </Link>
              </div>

              {cardsLoading ? (
                <div className="rounded-xl border border-border p-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Loading saved cards...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedCards.map((card) => {
                    const selected =
                      !useNewCard && activePaymentMethodId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedPmId(card.id)}
                        className={`w-full flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors cursor-pointer ${
                          selected
                            ? "border-[#0069D3] bg-[#0069D3]/5"
                            : "border-border bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CreditCard className="size-4 text-[#0069D3] shrink-0" />
                          <span className="font-semibold text-foreground uppercase truncate">
                            {card.brand} •••• {card.last4}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {String(card.expMonth).padStart(2, "0")}/
                            {card.expYear}
                          </span>
                          {card.isDefault && (
                            <span className="rounded-full bg-[#0069D3]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0069D3]">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-[#0069D3] shrink-0">
                          {selected ? "Selected" : "Use"}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedPmId("__NEW__")}
                    className={`w-full flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors cursor-pointer ${
                      useNewCard
                        ? "border-[#0069D3] bg-[#0069D3]/5"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {savedCards.length > 0
                          ? "Use a different / new card"
                          : "Pay with card via Stripe"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        New cards are saved automatically to Billing &amp;
                        Payments
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0069D3] shrink-0">
                      {useNewCard ? "Selected" : "Select"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Authorization Explanation */}
            <div className="rounded-xl border border-[#0069D3]/20 bg-[#0069D3]/5 p-3.5 flex gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <CheckCircle2 className="size-4 text-[#0069D3] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-0.5">
                  Manual Card Hold (Authorize Now, Capture on Counter-Sign)
                </p>
                <p>
                  Stripe places a hold on your card without capturing money yet.
                  Funds are charged only when the Freelancer signs the contract.
                  If declined or expired, the hold cancels automatically with $0
                  refund fee.
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-6 border-t border-border/60 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingIntent}
              className="rounded-full text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAuthorizeHold}
              disabled={isCreatingIntent || selectedIds.length === 0}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs px-5 gap-1.5 cursor-pointer"
            >
              {isCreatingIntent ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CreditCard className="size-3.5" />
              )}
              Authorize Hold ({formatMoney(totalHoldAmount)})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <StripePaymentDialog
        open={stripeModal.open}
        onOpenChange={(nextOpen) =>
          setStripeModal((prev) => ({ ...prev, open: nextOpen }))
        }
        title="Authorize Contract Escrow Hold"
        description={`Card hold for ${selectedIds.length} milestone(s) + 3% contract fee. Charged only after both parties sign.`}
        amount={stripeModal.amount}
        clientSecret={stripeModal.clientSecret}
        onSuccess={onSuccess}
      />
    </>
  );
}
