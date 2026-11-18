"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useActionPermission } from "@/hooks/use-action-permission";
import { useMe } from "@/hooks/use-auth";
import { paymentApiRequest } from "@/apiRequests/payment";
import type { SavedPaymentMethodType } from "@shared/types";

function CardBrandMark({ brand }: { brand: string }) {
  const normalized = brand.trim().toLowerCase();

  if (normalized === "visa") {
    return (
      <span className="text-[22px] font-black italic tracking-tight text-white leading-none select-none">
        VISA
      </span>
    );
  }

  if (normalized === "mastercard") {
    return (
      <span
        className="inline-flex items-center select-none"
        aria-label="Mastercard"
      >
        <span className="size-5 rounded-full bg-white/80" />
        <span className="-ml-2 size-5 rounded-full bg-white/45" />
      </span>
    );
  }

  const label =
    normalized === "amex"
      ? "AMEX"
      : normalized === "jcb"
        ? "JCB"
        : normalized === "discover"
          ? "DISCOVER"
          : normalized.toUpperCase() || "CARD";

  return (
    <span className="text-base font-bold italic tracking-wider text-white leading-none select-none">
      {label}
    </span>
  );
}

/**
 * Displays the client's saved payment card as a sleek matte-black virtual card.
 */
export function PaymentMethodCard() {
  const { can } = useActionPermission();
  const canGetPaymentMethods = can("GET", "/api/payments/payment-methods");
  const { data: me } = useMe();

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

  const cardholderName =
    defaultCard?.cardholderName?.trim() ||
    me?.profile?.displayName?.trim() ||
    me?.email?.split("@")[0] ||
    "Cardholder";

  const formattedExpiry = defaultCard
    ? `${String(defaultCard.expMonth).padStart(2, "0")}/${String(defaultCard.expYear).slice(-2)}`
    : null;

  return (
    <div className="h-full flex flex-col justify-between gap-4 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium tracking-tight text-foreground">
          Payment Method
        </h3>
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          Secured by Stripe
        </span>
      </div>

      {isLoading ? (
        <div className="relative flex min-h-[188px] w-full flex-col justify-center items-center rounded-sm bg-gradient-to-br from-[#232326] via-[#151517] to-[#0B0B0D] text-white/70 ring-1 ring-white/10">
          <Loader2 className="size-4 animate-spin mb-2" />
          <span className="text-xs">Loading card...</span>
        </div>
      ) : defaultCard ? (
        <div
          className="relative flex min-h-[188px] w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#242427] via-[#141416] to-[#09090B] p-5 text-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        >
          {/* Subtle diagonal matte sheen matching the reference card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_18%_12%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_45%,transparent_72%)]"
          />

          {/* Top Row */}
          <div className="relative flex items-center justify-between gap-2">
            <span className="text-[15px] font-normal tracking-wide text-white/90">
              Virtual Card
            </span>
            {formattedExpiry && (
              <span className="text-xs font-mono text-white/55 tabular-nums">
                {formattedExpiry}
              </span>
            )}
          </div>

          {/* Middle: Masked Card Number */}
          <div className="relative my-3">
            <p className="font-mono text-[15px] sm:text-[17px] tracking-[0.2em] text-white/95 tabular-nums">
              •••• &nbsp;•••• &nbsp;•••• &nbsp;{defaultCard.last4}
            </p>
          </div>

          {/* Bottom Row: Cardholder Name & Brand Mark */}
          <div className="relative flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-white/45 mb-0.5">
                Name
              </span>
              <p className="text-sm font-normal tracking-wide text-white/95 truncate">
                {cardholderName}
              </p>
            </div>
            <div className="shrink-0 pb-0.5">
              <CardBrandMark brand={defaultCard.brand} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-[188px] w-full flex-col justify-between overflow-hidden rounded-sm bg-gradient-to-br from-[#232326] via-[#151517] to-[#0B0B0D] p-5 text-white ring-1 ring-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_18%_12%,rgba(255,255,255,0.08)_0%,transparent_65%)]"
          />

          <div className="relative flex items-center justify-between gap-2">
            <span className="text-[15px] font-normal tracking-wide text-white/75">
              Virtual Card
            </span>
            <span className="text-[11px] text-white/45">No card saved</span>
          </div>

          <div className="relative my-3">
            <p className="font-mono text-[15px] sm:text-[17px] tracking-[0.2em] text-white/35 tabular-nums">
              •••• &nbsp;•••• &nbsp;•••• &nbsp;••••
            </p>
          </div>

          <div className="relative flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-white/40 mb-0.5">
                Name
              </span>
              <p className="text-xs text-white/60 truncate">
                Saved automatically on first Stripe checkout
              </p>
            </div>
            <span className="text-lg font-black italic tracking-tight text-white/25 leading-none select-none shrink-0">
              VISA
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
