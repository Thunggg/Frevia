"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CreditCard,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type { SavedPaymentMethodType } from "@shared/types";

function formatBrandName(brand: string): string {
  const normalized = brand.trim().toLowerCase();
  switch (normalized) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    case "jcb":
      return "JCB";
    case "discover":
      return "Discover";
    case "unionpay":
      return "UnionPay";
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1) || "Card";
  }
}

function CardBrandBadge({ brand }: { brand: string }) {
  const normalized = brand.trim().toLowerCase();
  const label =
    normalized === "mastercard"
      ? "MC"
      : normalized === "amex"
        ? "AMEX"
        : normalized.slice(0, 4).toUpperCase() || "CARD";

  const colorClass =
    normalized === "visa"
      ? "text-[#1A1F71] dark:text-blue-300"
      : normalized === "mastercard"
        ? "text-[#EB001B] dark:text-rose-400"
        : "text-foreground";

  return (
    <span
      className={`inline-flex h-7 min-w-[42px] items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-[10px] font-extrabold tracking-wider shadow-2xs shrink-0 ${colorClass}`}
    >
      {label}
    </span>
  );
}

/**
 * Displays the user's saved payment methods with card switching, setting default, and removing.
 */
export function PaymentMethodCard() {
  const queryClient = useQueryClient();
  const { can } = useActionPermission();

  const canGetPaymentMethods = can("GET", "/api/payments/payment-methods");
  const canSetDefaultPaymentMethod = can(
    "POST",
    "/api/payments/payment-methods/default",
  );
  const canRemovePaymentMethod = can(
    "DELETE",
    "/api/payments/payment-methods/:paymentMethodId",
  );

  const [manageOpen, setManageOpen] = useState(false);

  const { data: savedMethodsData, isLoading } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: canGetPaymentMethods,
  });

  const paymentMethods: SavedPaymentMethodType[] =
    savedMethodsData?.paymentMethods ?? [];
  const defaultCard =
    paymentMethods.find((pm) => pm.isDefault) ?? paymentMethods[0];

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApiRequest.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: async () => {
      toastSuccess({ message: "Default payment method updated." });
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
    },
    onError: (err: unknown) => {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to update default card.",
      });
    },
  });

  const removeCardMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApiRequest.removePaymentMethod(paymentMethodId),
    onSuccess: async () => {
      toastSuccess({ message: "Payment method removed." });
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
    },
    onError: (err: unknown) => {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to remove payment method.",
      });
    },
  });

  if (!canGetPaymentMethods) {
    return null;
  }

  return (
    <>
      <div className="h-full flex flex-col gap-3.5 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] tracking-tight text-foreground">
            Payment Method
          </h3>
          {paymentMethods.length > 0 && (
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="text-xs font-medium text-[#0069D3] hover:text-[#0055b3] transition-colors cursor-pointer"
            >
              Manage
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-3.5 py-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span>Loading payment methods...</span>
          </div>
        ) : defaultCard ? (
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-3.5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <CardBrandBadge brand={defaultCard.brand} />
              <div className="min-w-0">
                <p className="text-[13px] text-foreground truncate">
                  {formatBrandName(defaultCard.brand)} ending in {defaultCard.last4}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expires: {String(defaultCard.expMonth).padStart(2, "0")}/
                  {defaultCard.expYear}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Payment method options"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                <DropdownMenuItem
                  onClick={() => setManageOpen(true)}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  <CreditCard className="mr-2 size-3.5 text-muted-foreground" />
                  Manage Saved Cards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 px-3.5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                <CreditCard className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground">
                  No card saved yet
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Cards are automatically saved when you checkout with Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manage Saved Cards Modal */}
      <Dialog
        open={manageOpen}
        onOpenChange={setManageOpen}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base tracking-tight">
              Manage Saved Cards
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select your default card or remove cards saved on your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {paymentMethods.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {paymentMethods.map((pm) => {
                  const isBusy =
                    setDefaultMutation.isPending ||
                    removeCardMutation.isPending;

                  return (
                    <div
                      key={pm.id}
                      className={`rounded-xl border px-3.5 py-3 flex items-center justify-between gap-3 transition-colors ${pm.isDefault
                        ? "border-[#0069D3]/40 bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CardBrandBadge brand={pm.brand} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-foreground truncate">
                              {formatBrandName(pm.brand)} ending in {pm.last4}
                            </p>
                            {pm.isDefault && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                                <Check className="size-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Expires {String(pm.expMonth).padStart(2, "0")}/
                            {pm.expYear}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!pm.isDefault && canSetDefaultPaymentMethod && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => setDefaultMutation.mutate(pm.id)}
                            className="h-7 rounded-lg px-2.5 text-[11px] font-medium cursor-pointer"
                          >
                            Set Default
                          </Button>
                        )}
                        {canRemovePaymentMethod && (
                          <button
                            type="button"
                            disabled={isBusy}
                            aria-label="Remove saved card"
                            onClick={() => removeCardMutation.mutate(pm.id)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-muted-foreground">
                No saved cards found on your account. Cards will be saved when checking out via Stripe.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
