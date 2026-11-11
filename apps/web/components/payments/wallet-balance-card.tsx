"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Landmark,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { paymentApiRequest } from "@/apiRequests/payment";
import { ApiFail } from "@/lib/http";
import type {
  CreateWithdrawalBodyType,
  StripeConnectStatusResponseType,
  WalletSummaryResponseType,
  WithdrawalRequestType,
} from "@shared/types";
import { formatCurrency } from "./payment-utils";

interface WalletBalanceCardProps {
  latestBankWithdrawal?: WithdrawalRequestType;
}

/**
 * Displays the Freelancer's platform wallet balance and lets them withdraw funds
 * via Bank Transfer (zero Stripe onboarding required) or optional Stripe Express.
 */
export function WalletBalanceCard({
  latestBankWithdrawal,
}: WalletBalanceCardProps) {
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [method, setMethod] = useState<"BANK_TRANSFER" | "STRIPE_EXPRESS">(
    "BANK_TRANSFER",
  );
  const [amountInput, setAmountInput] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [note, setNote] = useState("");

  const { data: wallet, isLoading } = useQuery<WalletSummaryResponseType>({
    queryKey: ["wallet-summary"],
    queryFn: async () => {
      const res = await paymentApiRequest.getWalletSummary();
      return res.data;
    },
  });

  const { data: connectStatus } = useQuery<StripeConnectStatusResponseType>({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => {
      const res = await paymentApiRequest.getConnectStatus();
      return res.data;
    },
  });

  useEffect(() => {
    if (!withdrawOpen) return;
    if (latestBankWithdrawal) {
      setBankName((prev) => prev || latestBankWithdrawal.bankName || "");
      setBankAccountNumber(
        (prev) => prev || latestBankWithdrawal.bankAccountNumber || "",
      );
      setBankAccountHolder(
        (prev) => prev || latestBankWithdrawal.bankAccountHolder || "",
      );
    }
  }, [withdrawOpen, latestBankWithdrawal]);

  const balance = wallet?.balance ?? 0;
  const pendingWithdrawal = wallet?.pendingWithdrawalAmount ?? 0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 0;
  const isStripeReady = Boolean(
    connectStatus?.isConnected && connectStatus?.payoutsEnabled,
  );

  const withdrawMutation = useMutation({
    mutationFn: (body: CreateWithdrawalBodyType) =>
      paymentApiRequest.requestWithdrawal(body),
    onSuccess: async (res) => {
      toastSuccess({
        message: res.data.message || "Withdrawal submitted successfully.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["freelancer-withdrawals"] }),
        queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] }),
        queryClient.invalidateQueries({
          queryKey: ["transactions-summary", "freelancer"],
        }),
      ]);
      setWithdrawOpen(false);
      setAmountInput("");
      setNote("");
    },
    onError: (err: unknown) => {
      toastError({
        message:
          err instanceof ApiFail
            ? err.response.error.message
            : "Failed to submit withdrawal request.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountInput);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toastError({ message: "Please enter a valid withdrawal amount." });
      return;
    }
    if (numericAmount > balance) {
      toastError({
        message: "Withdrawal amount exceeds your available wallet balance.",
      });
      return;
    }

    if (method === "BANK_TRANSFER") {
      if (
        !bankName.trim() ||
        !bankAccountNumber.trim() ||
        !bankAccountHolder.trim()
      ) {
        toastError({
          message:
            "Please enter your bank name, account number, and account holder name.",
        });
        return;
      }
      withdrawMutation.mutate({
        amount: numericAmount,
        method: "BANK_TRANSFER",
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        ...(note.trim() && { note: note.trim() }),
      });
      return;
    }

    withdrawMutation.mutate({
      amount: numericAmount,
      method: "STRIPE_EXPRESS",
      ...(note.trim() && { note: note.trim() }),
    });
  };

  return (
    <>
      <div className="h-full flex flex-col gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              Wallet Balance
            </h3>
            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              Instant Payouts
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isLoading || balance <= 0}
            onClick={() => {
              setAmountInput(balance > 0 ? String(balance) : "");
              setWithdrawOpen(true);
            }}
            className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold px-3 cursor-pointer"
          >
            <ArrowUpRight className="mr-1 size-3.5" />
            Withdraw
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-3.5 py-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-[#0069D3]" />
            <span>Loading wallet balance...</span>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0069D3]">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Available to Withdraw
                  </span>
                  <p className="text-xl font-bold tracking-tight tabular-nums text-foreground">
                    {formatCurrency(balance, wallet?.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  Pending Withdrawals
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(pendingWithdrawal, wallet?.currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">
                  Total Withdrawn
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(totalWithdrawn, wallet?.currency)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Funds Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold tracking-tight">
              Withdraw Wallet Funds
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Available balance:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(balance)}
              </span>
              . Request a bank transfer anytime without Stripe onboarding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Payout Method Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod("BANK_TRANSFER")}
                className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  method === "BANK_TRANSFER"
                    ? "border-[#0069D3] bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Building2 className="size-3.5 text-[#0069D3]" />
                  <span>Bank Transfer</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  No onboarding needed
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("STRIPE_EXPRESS")}
                className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  method === "STRIPE_EXPRESS"
                    ? "border-[#0069D3] bg-blue-50/40 dark:bg-blue-950/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Landmark className="size-3.5 text-[#635BFF]" />
                  <span>Stripe Express</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  {isStripeReady ? (
                    <span className="text-emerald-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Connected
                    </span>
                  ) : (
                    "Optional account"
                  )}
                </span>
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="withdraw-amount"
                  className="font-medium text-foreground"
                >
                  Amount (USD)
                </label>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(balance))}
                  className="text-[11px] font-semibold text-[#0069D3] hover:underline cursor-pointer"
                >
                  Use max ({formatCurrency(balance)})
                </button>
              </div>
              <input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
              />
            </div>

            {/* Bank Fields when Bank Transfer selected */}
            {method === "BANK_TRANSFER" ? (
              <div className="space-y-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5">
                <div className="space-y-1">
                  <label
                    htmlFor="bank-name"
                    className="text-xs font-medium text-foreground block"
                  >
                    Bank Name
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Vietcombank, Techcombank, Chase..."
                    className="h-8.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="bank-account-number"
                    className="text-xs font-medium text-foreground block"
                  >
                    Account Number
                  </label>
                  <input
                    id="bank-account-number"
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className="h-8.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="bank-account-holder"
                    className="text-xs font-medium text-foreground block"
                  >
                    Account Holder Name
                  </label>
                  <input
                    id="bank-account-holder"
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Full legal name matching bank account"
                    className="h-8.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                  />
                </div>
              </div>
            ) : (
              !isStripeReady && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Your optional Stripe Express account is not verified yet. Use{" "}
                  <strong className="font-semibold">Bank Transfer</strong>{" "}
                  instead to withdraw immediately without onboarding, or complete
                  Stripe Express in the card above.
                </div>
              )
            )}

            <div className="space-y-1">
              <label
                htmlFor="withdraw-note"
                className="text-xs font-medium text-foreground block"
              >
                Note (optional)
              </label>
              <input
                id="withdraw-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Payout memo or reference note"
                className="h-8.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWithdrawOpen(false)}
                disabled={withdrawMutation.isPending}
                className="h-8 rounded-lg text-xs px-3 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  withdrawMutation.isPending ||
                  (method === "STRIPE_EXPRESS" && !isStripeReady)
                }
                className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold px-4 cursor-pointer"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : method === "BANK_TRANSFER" ? (
                  "Submit Bank Withdrawal"
                ) : (
                  "Transfer to Stripe"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

