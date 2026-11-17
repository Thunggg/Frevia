"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useActionPermission } from "@/hooks/use-action-permission";
import { paymentApiRequest } from "@/apiRequests/payment";
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
 * Displays the user's saved payment method from Stripe cleanly without complex card management modals.
 */
export function PaymentMethodCard() {
  const { can } = useActionPermission();
  const canGetPaymentMethods = can("GET", "/api/payments/payment-methods");

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

  if (!canGetPaymentMethods) {
    return null;
  }

  return (
    <div className="h-full flex flex-col gap-3.5 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] tracking-tight text-foreground">
          Payment Method
        </h3>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="size-3 text-[#0069D3]" />
          Secured by Stripe
        </span>
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
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            Saved Card
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 px-3.5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              <CreditCard className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-foreground font-medium">
                No card saved yet
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Your card is automatically saved when you checkout on Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
