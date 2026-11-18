"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toastError } from "@repo/ui/components/shadcn/toast";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "@/components/icons";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
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
}: FundContractHoldSheetProps) {
  const pendingMilestones = useMemo(
    () =>
      (contract.milestones ?? []).filter(
        (m) => (m.paymentStatus || "PENDING") === "PENDING",
      ),
    [contract.milestones],
  );

  const { can } = useActionPermission();
  const canCreateHoldIntent = can(
    "POST",
    "/api/payments/contracts/:contractId/fund-hold/intent",
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!open) return;
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

    setIsRedirecting(true);
    try {
      const returnUrl = window.location.href;
      const response = await paymentApiRequest.createContractHoldIntent(
        contract.id,
        selectedIds,
        undefined,
        returnUrl,
      );
      const data = response.data;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toastError({
        message: "Could not initialize Stripe Checkout session. Please try again.",
      });
      setIsRedirecting(false);
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
      setIsRedirecting(false);
    }
  };

  return (
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
              contract fee to place an escrow card hold on Stripe Checkout before signing.
            </SheetDescription>
          </SheetHeader>

          {/* Quick Selection Buttons */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Select Milestones to Fund ({selectedIds.length}/
              {pendingMilestones.length})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectFirstOnly}
                className="text-[11px] font-medium text-[#0069D3] hover:underline cursor-pointer"
              >
                First milestone only
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={selectAllPending}
                className="text-[11px] font-medium text-[#0069D3] hover:underline cursor-pointer"
              >
                Select all
              </button>
            </div>
          </div>

          {/* Milestone checklist */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {pendingMilestones.map((m, index) => {
              const checked = selectedIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                    checked
                      ? "border-[#0069D3] bg-[#0069D3]/5"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleMilestone(m.id)}
                      className="data-[state=checked]:bg-[#0069D3] data-[state=checked]:border-[#0069D3]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {m.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Milestone #{index + 1}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0 font-mono">
                    {formatMoney(Number(m.amount || 0))}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Selected Milestones ({selectedIds.length})</span>
              <span className="font-mono text-foreground">
                {formatMoney(milestonesSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                Client Platform Fee (3% of contract)
              </span>
              <span className="font-mono text-foreground">
                {formatMoney(clientFeeAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between text-sm font-bold">
              <span className="text-foreground">Total Authorization Hold</span>
              <span className="font-mono text-[#0069D3]">
                {formatMoney(totalHoldAmount)}
              </span>
            </div>
          </div>

          {/* Authorization Explanation */}
          <div className="rounded-xl border border-[#0069D3]/20 bg-[#0069D3]/5 p-3.5 flex gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <CheckCircle2 className="size-4 text-[#0069D3] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-0.5">
                Stripe Hosted Checkout &amp; Card Hold
              </p>
              <p>
                You will be redirected to Stripe Checkout to authorize the hold and save your card.
                Funds are not charged until the Freelancer signs the contract.
                If declined or expired, the hold releases automatically with $0 refund fee.
              </p>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-6 border-t border-border/60 gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRedirecting}
            className="rounded-full text-xs cursor-pointer"
          >
            Cancel
          </Button>
          {canCreateHoldIntent && (
            <Button
              type="button"
              onClick={handleAuthorizeHold}
              disabled={isRedirecting || selectedIds.length === 0}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs px-5 gap-1.5 cursor-pointer"
            >
              {isRedirecting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="size-3.5" />
              )}
              Proceed to Stripe Checkout ({formatMoney(totalHoldAmount)})
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
