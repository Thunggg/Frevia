"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { Lock, ShieldCheck } from "@/components/icons";
import { paymentApiRequest } from "@/apiRequests/payment";

function money(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({
  amount,
  currency = "USD",
  onSuccess,
  onClose,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Payment processing failed");
        toastError({
          message: result.error.message || "Could not process your card",
        });
      } else if (
        result.paymentIntent &&
        (result.paymentIntent.status === "succeeded" ||
          result.paymentIntent.status === "processing")
      ) {
        try {
          await paymentApiRequest.syncPaymentIntent(result.paymentIntent.id);
        } catch {
          // Non-blocking sync fallback
        }
        toastSuccess({ message: "Payment processed successfully!" });
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
      toastError({
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="rounded-xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2.5">
          <span>Amount due</span>
          <span className="text-base font-bold text-foreground">
            {money(amount, currency)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Held securely in Escrow until you approve completed deliverables.</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block">
          Card or Payment Method
        </label>
        <div className="min-h-[140px] rounded-xl border border-input p-3 bg-white dark:bg-zinc-950">
          <PaymentElement />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3 text-muted-foreground/70" />
          <span>256-bit Stripe encryption</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full text-xs h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!stripe || submitting}
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-5 shadow-sm"
          >
            {submitting ? "Processing..." : `Pay ${money(amount, currency)}`}
          </Button>
        </div>
      </div>
    </form>
  );
}

export interface StripePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  clientSecret?: string;
  onSuccess: () => void;
}

export function StripePaymentDialog({
  open,
  onOpenChange,
  title,
  description,
  amount,
  currency = "USD",
  clientSecret,
  onSuccess,
}: StripePaymentDialogProps) {
  const stripePromise = getStripe();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-border shadow-2xl bg-white dark:bg-zinc-950 font-sans">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0069D3]">
              <Lock className="size-3.5" />
            </div>
            <DialogTitle className="text-base font-bold tracking-tight">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
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
            <PaymentForm
              amount={amount}
              currency={currency}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </Elements>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="size-5 border-2 border-[#0069D3] border-t-transparent rounded-full animate-spin" />
            <span>Preparing secure checkout session...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
