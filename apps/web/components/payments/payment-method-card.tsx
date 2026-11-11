"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import { getStripe } from "@/lib/stripe";
import type { SavedPaymentMethodType } from "@shared/types";

interface PaymentMethodCardProps {
  returnPath: string;
}

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

interface AddCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCardSetupForm({ onSuccess, onCancel }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        const msg = result.error.message || "Could not verify card details.";
        setErrorMessage(msg);
        toastError({ message: msg });
        return;
      }

      const rawPm = result.setupIntent?.payment_method;
      const paymentMethodId =
        typeof rawPm === "string" ? rawPm : rawPm?.id;

      if (paymentMethodId) {
        await paymentApiRequest.setDefaultPaymentMethod(paymentMethodId);
      }

      toastSuccess({
        message: "Payment method saved and set as default.",
      });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiFail
          ? err.response.error.message
          : err instanceof Error
            ? err.message
            : "Failed to save payment method.";
      setErrorMessage(msg);
      toastError({ message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50/40 dark:bg-zinc-900/40">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" />
          Secured by Stripe
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg text-xs h-8 px-3"
          >
            Back
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!stripe || !elements || submitting}
            className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs h-8 px-4 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Use Card"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Displays the user's active payment method with in-app card switching, adding, removing,
 * and Stripe Billing Portal fallback.
 */
export function PaymentMethodCard({ returnPath }: PaymentMethodCardProps) {
  const queryClient = useQueryClient();
  const [manageOpen, setManageOpen] = useState(false);
  const [modalView, setModalView] = useState<"list" | "add">("list");
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(
    null,
  );
  const [setupLoading, setSetupLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: savedMethodsData, isLoading } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
  });

  const paymentMethods: SavedPaymentMethodType[] =
    savedMethodsData?.paymentMethods ?? [];
  const defaultCard =
    paymentMethods.find((pm) => pm.isDefault) ?? paymentMethods[0] ?? null;

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApiRequest.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
      toastSuccess({ message: "Default payment method updated." });
    },
    onError: (err: unknown) => {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to change default payment method.",
      });
    },
  });

  const removeCardMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApiRequest.removePaymentMethod(paymentMethodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
      toastSuccess({ message: "Payment method removed." });
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

  const startAddCardFlow = async () => {
    setModalView("add");
    setManageOpen(true);
    setSetupLoading(true);
    setSetupClientSecret(null);
    try {
      const res = await paymentApiRequest.createSetupIntent();
      setSetupClientSecret(res.data.clientSecret);
    } catch (err: unknown) {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to initialize Stripe card form.",
      });
      setModalView("list");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const returnUrl = `${window.location.origin}${returnPath}`;
      const res = await paymentApiRequest.getCustomerPortalLink(returnUrl);
      if (res.data?.portalUrl) {
        window.location.href = res.data.portalUrl;
      }
    } catch (err: unknown) {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to open Stripe Billing Portal. You can switch or add cards right here.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const openManageList = () => {
    setModalView("list");
    setManageOpen(true);
  };

  return (
    <>
      <div className="h-full flex flex-col gap-3.5 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] tracking-tight text-foreground">
            Payment Method
          </h3>
          <button
            type="button"
            onClick={defaultCard ? openManageList : () => void startAddCardFlow()}
            className="text-xs font-medium text-[#0069D3] hover:text-[#0055b3] transition-colors cursor-pointer"
          >
            {defaultCard ? "Change" : "+ Add card"}
          </button>
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
                  onClick={openManageList}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  <CreditCard className="mr-2 size-3.5 text-muted-foreground" />
                  Switch / Manage Cards
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void startAddCardFlow()}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  <Plus className="mr-2 size-3.5 text-muted-foreground" />
                  Add New Card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void handleOpenCustomerPortal()}
                  disabled={portalLoading}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  <ExternalLink className="mr-2 size-3.5 text-muted-foreground" />
                  {portalLoading ? "Opening Stripe..." : "Stripe Billing Portal"}
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
                  Add a default card for faster checkout
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void startAddCardFlow()}
              className="rounded-lg text-xs h-8 px-3 shrink-0 cursor-pointer"
            >
              Add Card
            </Button>
          </div>
        )}
      </div>

      {/* Manage / Switch / Add Card Modal */}
      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          setManageOpen(open);
          if (!open) {
            setSetupClientSecret(null);
            setModalView("list");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base tracking-tight">
              {modalView === "add"
                ? "Add New Payment Method"
                : "Change Payment Method"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {modalView === "add"
                ? "Add a debit or credit card via Stripe. It will become your default payment method."
                : "Select your default saved card or add a new card."}
            </DialogDescription>
          </DialogHeader>

          {modalView === "list" ? (
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
                          {!pm.isDefault && (
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
                          <button
                            type="button"
                            disabled={isBusy}
                            aria-label="Remove saved card"
                            onClick={() => removeCardMutation.mutate(pm.id)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-muted-foreground">
                  No saved cards found on your account yet.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => void handleOpenCustomerPortal()}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  {portalLoading ? "Opening..." : "Stripe Portal"}
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void startAddCardFlow()}
                  className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs h-8 px-3.5 cursor-pointer"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Add New Card
                </Button>
              </div>
            </div>
          ) : setupLoading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-[#0069D3]" />
              <span>Initializing secure Stripe card setup...</span>
            </div>
          ) : setupClientSecret ? (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret: setupClientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0069D3",
                    borderRadius: "8px",
                    fontSizeBase: "14px",
                  },
                },
              }}
            >
              <AddCardSetupForm
                onSuccess={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ["saved-payment-methods"],
                  });
                  setManageOpen(false);
                }}
                onCancel={() => {
                  if (paymentMethods.length === 0) {
                    setManageOpen(false);
                  } else {
                    setModalView("list");
                  }
                }}
              />
            </Elements>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

