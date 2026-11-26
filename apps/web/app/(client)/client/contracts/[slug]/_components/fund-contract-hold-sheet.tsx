"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, ShieldCheck } from "@/components/icons";
import { Zap } from "lucide-react";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type { ContractDetailType } from "@shared/types";

interface FundContractHoldSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetailType;
  initialMilestoneId?: number;
  onSuccess?: () => void;
}

export function FundContractHoldSheet({
  open,
  onOpenChange,
  contract,
  initialMilestoneId,
  onSuccess,
}: FundContractHoldSheetProps) {
  const t = useTranslations("contractWorkspace.fundHold");
  const tCommon = useTranslations("common");
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
  const defaultCard =
    savedCards.find((card) => card.isDefault) || savedCards[0];
  const activeCard =
    savedCards.find((card) => card.id === (selectedPmId || defaultCard?.id)) ||
    defaultCard;

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
        message: t("selectAtLeastOne"),
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
        message: t("checkoutInitFailed"),
      });
      setIsRedirecting(false);
    } catch (error) {
      let errorMessage = t("initFailed");
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

  const handleAuthorizeWithSavedCard = async (pmId?: string) => {
    if (selectedIds.length === 0) {
      toastError({ message: t("selectAtLeastOne") });
      return;
    }
    const cardId = pmId || activeCard?.id;
    if (!cardId) {
      void handleAuthorizeHold();
      return;
    }

    setIsRedirecting(true);
    try {
      const returnUrl = window.location.href;
      const response = await paymentApiRequest.createContractHoldIntent(
        contract.id,
        selectedIds,
        cardId,
        returnUrl,
      );
      const data = response.data;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      toastSuccess({
        message: t("holdAuthorizedToast"),
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      let errorMessage = t("initFailed");
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
      // Fallback to Checkout
      await handleAuthorizeHold();
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={tCommon("close")}
        className="w-full sm:max-w-lg overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
      >
        <div className="space-y-5">
          <SheetHeader className="p-0 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                <ShieldCheck className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {t("title")}
              </SheetTitle>
            </div>
            <SheetDescription className="mt-1 text-xs text-muted-foreground">
              {t("description")}
            </SheetDescription>
          </SheetHeader>

          {/* Quick Selection Buttons */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {t("selectMilestones", {
                selected: selectedIds.length,
                total: pendingMilestones.length,
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectFirstOnly}
                className="text-[11px] font-medium text-[#0069D3] hover:underline cursor-pointer"
              >
                {t("firstOnly")}
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={selectAllPending}
                className="text-[11px] font-medium text-[#0069D3] hover:underline cursor-pointer"
              >
                {t("selectAll")}
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
                        {t("milestoneIndex", { index: index + 1 })}
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
              <span>{t("selectedMilestones", { count: selectedIds.length })}</span>
              <span className="font-mono text-foreground">
                {formatMoney(milestonesSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                {t("clientPlatformFee")}
              </span>
              <span className="font-mono text-foreground">
                {formatMoney(clientFeeAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between text-sm font-bold">
              <span className="text-foreground">{t("totalHold")}</span>
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
                {t("stripeExplainTitle")}
              </p>
              <p>{t("stripeExplainBody")}</p>
            </div>
          </div>

          {/* Saved Card Option if available */}
          {savedCards.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Saved Payment Method
              </span>
              <div className="flex flex-col gap-2">
                {savedCards.map((card) => {
                  const isSelected =
                    (selectedPmId || defaultCard?.id) === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedPmId(card.id)}
                      className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? "border-[#0069D3] bg-[#0069D3]/5"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="size-4 text-[#0069D3]" />
                        <span className="font-medium text-foreground uppercase">
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
                      <span className="text-[11px] font-semibold text-[#0069D3]">
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="pt-6 border-t border-border/60 gap-2 sm:justify-end flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRedirecting}
            className="rounded-full text-xs cursor-pointer"
          >
            {tCommon("cancel")}
          </Button>
          {canCreateHoldIntent && (
            <>
              {savedCards.length > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAuthorizeHold}
                    disabled={isRedirecting || selectedIds.length === 0}
                    className="rounded-full text-xs px-4 gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    Stripe Checkout
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isRedirecting || selectedIds.length === 0}
                    className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs px-5 gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isRedirecting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5 text-amber-300" />
                    )}
                    {t("payWithSavedCard", {
                      amount: formatMoney(totalHoldAmount),
                    })}
                  </Button>
                </>
              ) : (
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
                  {t("proceedCheckout", {
                    amount: formatMoney(totalHoldAmount),
                  })}
                </Button>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmHoldTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmHoldDesc", {
                amount: formatMoney(totalHoldAmount),
                brand: (activeCard?.brand || "CARD").toUpperCase(),
                last4: activeCard?.last4 || "****",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedirecting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRedirecting}
              onClick={(e) => {
                e.preventDefault();
                setIsConfirmOpen(false);
                void handleAuthorizeWithSavedCard(activeCard?.id);
              }}
              className="bg-[#0069D3] hover:bg-[#0055b3] text-white"
            >
              {isRedirecting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {t("confirmHoldButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
