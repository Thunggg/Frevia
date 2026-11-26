"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
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
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
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
 * Displays the client's saved payment card as a sleek matte-black virtual card
 * and provides full interactive wallet management (Set Default, Remove Card).
 */
export function PaymentMethodCard() {
  const t = useTranslations("payments.card");
  const queryClient = useQueryClient();
  const { can } = useActionPermission();
  const canGetPaymentMethods = can("GET", "/api/payments/payment-methods");
  const { data: me } = useMe();

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<SavedPaymentMethodType | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId);
      await paymentApiRequest.setDefaultPaymentMethod(paymentMethodId);
      toastSuccess({
        message: t("defaultUpdatedSuccess"),
      });
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
    } catch {
      toastError({
        message: t("actionFailed"),
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleRemove = async () => {
    if (!cardToDelete) return;
    try {
      setIsDeleting(true);
      await paymentApiRequest.removePaymentMethod(cardToDelete.id);
      toastSuccess({
        message: t("removeSuccess"),
      });
      setCardToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["saved-payment-methods"],
      });
    } catch {
      toastError({
        message: t("actionFailed"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cardholderName =
    defaultCard?.cardholderName?.trim() ||
    me?.profile?.displayName?.trim() ||
    me?.email?.split("@")[0] ||
    t("defaultCardholder");

  const formattedExpiry = defaultCard
    ? `${String(defaultCard.expMonth).padStart(2, "0")}/${String(defaultCard.expYear).slice(-2)}`
    : null;

  return (
    <div className="h-full flex flex-col justify-between gap-4 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium tracking-tight text-foreground">
          {t("title")}
        </h3>
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          {t("securedByStripe")}
        </span>
      </div>

      {isLoading ? (
        <div className="relative flex min-h-[188px] w-full flex-col justify-center items-center rounded-sm bg-gradient-to-br from-[#232326] via-[#151517] to-[#0B0B0D] text-white/70 ring-1 ring-white/10">
          <Loader2 className="size-4 animate-spin mb-2" />
          <span className="text-xs">{t("loadingCard")}</span>
        </div>
      ) : defaultCard ? (
        <div className="relative flex min-h-[188px] w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#242427] via-[#141416] to-[#09090B] p-5 text-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          {/* Subtle diagonal matte sheen matching the reference card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_18%_12%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_45%,transparent_72%)]"
          />

          {/* Top Row */}
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-normal tracking-wide text-white/90">
                {t("virtualCard")}
              </span>
              {defaultCard.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/25 px-2 py-0.5 text-[10px] font-medium text-blue-200 border border-blue-400/30">
                  <Check className="size-2.5" />
                  {t("defaultBadge")}
                </span>
              )}
            </div>
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
                {t("nameLabel")}
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
              {t("virtualCard")}
            </span>
            <span className="text-[11px] text-white/45">{t("noCardSaved")}</span>
          </div>

          <div className="relative my-3">
            <p className="font-mono text-[15px] sm:text-[17px] tracking-[0.2em] text-white/35 tabular-nums">
              •••• &nbsp;•••• &nbsp;•••• &nbsp;••••
            </p>
          </div>

          <div className="relative flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-white/40 mb-0.5">
                {t("nameLabel")}
              </span>
              <p className="text-xs text-white/60 truncate">
                {t("savedAutomaticallyHint")}
              </p>
            </div>
            <span className="text-lg font-black italic tracking-tight text-white/25 leading-none select-none shrink-0">
              VISA
            </span>
          </div>
        </div>
      )}

      {/* Interactive Wallet Management Bar */}
      {paymentMethods.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{paymentMethods.length}</span>
            <span>{paymentMethods.length > 1 ? "cards saved" : "card saved"}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs font-medium gap-1.5"
            onClick={() => setIsManageOpen(true)}
          >
            <CreditCard className="size-3.5" />
            {t("manageCards")}
          </Button>
        </div>
      )}

      {/* Manage Saved Payment Methods Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("manageDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("manageDialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {paymentMethods.map((card) => {
              const isDefault = card.isDefault;
              const isUpdating = settingDefaultId === card.id;

              return (
                <div
                  key={card.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-all ${
                    isDefault
                      ? "border-blue-500/50 bg-blue-50/40 dark:bg-blue-950/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white font-bold text-xs p-1 shadow-sm">
                      <CardBrandMark brand={card.brand} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground tracking-wider">
                          •••• {card.last4}
                        </span>
                        {isDefault && (
                          <Badge
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-600 text-[10px] h-4 px-1.5 font-normal"
                          >
                            {t("defaultBadge")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expires {String(card.expMonth).padStart(2, "0")}/
                        {String(card.expYear).slice(-2)}
                        {card.cardholderName ? ` • ${card.cardholderName}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-900"
                        disabled={isUpdating}
                        onClick={() => handleSetDefault(card.id)}
                      >
                        {isUpdating ? (
                          <Loader2 className="size-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="size-3.5 mr-1" />
                        )}
                        {t("setDefault")}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700"
                      onClick={() => setCardToDelete(card)}
                      aria-label={t("removeCard")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Removing a Payment Method */}
      <AlertDialog
        open={!!cardToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCardToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="flex size-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                <Trash2 className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-base">
                {t("removeDialogTitle")}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-2">
              {cardToDelete
                ? t("removeDialogDesc", {
                    brand: cardToDelete.brand.toUpperCase(),
                    last4: cardToDelete.last4,
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-9">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  {t("removing")}
                </>
              ) : (
                t("removeConfirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
