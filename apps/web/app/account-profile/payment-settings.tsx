"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentApiRequest } from "@/apiRequests/payment";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "@/components/icons";
import type {
  GetTransactionListQueryType,
  StripeConnectStatusResponseType,
  TransactionType,
} from "@shared/types";

function money(amount: number | string, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

interface PaymentSettingsProps {
  userRole?: string;
}

export function PaymentSettings({ userRole }: PaymentSettingsProps) {
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const isFreelancerOrExpert =
    userRole === "FREELANCER" || userRole === "EXPERT";

  // Query Saved Payment Methods (Cards) for Client
  const {
    data: paymentMethodsData,
    isLoading: paymentMethodsLoading,
    refetch: refetchPaymentMethods,
  } = useQuery({
    queryKey: ["saved-payment-methods"],
    queryFn: async () => {
      const res = await paymentApiRequest.getSavedPaymentMethods();
      return res.data;
    },
    enabled: !isFreelancerOrExpert,
  });

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await paymentApiRequest.getCustomerPortalLink();
      if (res.data?.portalUrl) {
        toastSuccess({ message: "Opening Stripe Customer Portal..." });
        window.location.href = res.data.portalUrl;
      }
    } catch {
      toastError({ message: "Failed to open Stripe Customer Portal." });
    } finally {
      setPortalLoading(false);
    }
  };

  // Query Connect Status (only relevant for recipients)
  const {
    data: connectStatus,
    isLoading: connectLoading,
    refetch: refetchConnect,
  } = useQuery<StripeConnectStatusResponseType>({
    queryKey: ["stripe-connect-status"],
    queryFn: async () => {
      const res = await paymentApiRequest.getConnectStatus();
      return res.data;
    },
    enabled: isFreelancerOrExpert,
  });

  // Query Transaction History
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", page, selectedType],
    queryFn: async () => {
      const query: Partial<GetTransactionListQueryType> = {
        page,
        limit: 10,
        ...(selectedType !== "ALL" && {
          type: selectedType as TransactionType["type"],
        }),
      };
      const res = await paymentApiRequest.getTransactions(query);
      return res.data;
    },
  });

  const handleStartOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const res = await paymentApiRequest.getOnboardingLink();
      if (res.data?.onboardingUrl) {
        toastSuccess({ message: "Redirecting to Stripe Express..." });
        window.location.href = res.data.onboardingUrl;
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { error?: { message?: string } } }).response
                ?.error?.message || "Stripe account creation failed."
            : "Could not create Stripe onboarding link. Please check your Stripe keys.";
      toastError({
        message: errorMsg,
      });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ESCROW_DEPOSIT":
        return {
          label: "Escrow Deposit",
          className: "bg-blue-50 text-[#0069D3] border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
        };
      case "MILESTONE_PAYOUT":
        return {
          label: "Milestone Payout",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
        };
      case "PLATFORM_FEE":
        return {
          label: "Platform Fee",
          className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
        };
      case "DISPUTE_FEE":
        return {
          label: "Dispute Fee",
          className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
        };
      case "ARBITRATOR_PAYOUT":
        return {
          label: "Arbitrator Payout",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400",
        };
      case "REFUND":
        return {
          label: "Refund",
          className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
        };
      default:
        return {
          label: type,
          className: "bg-zinc-100 text-zinc-700 border-zinc-200",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" /> Succeeded
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Clock className="size-3" /> Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <XCircle className="size-3" /> Failed
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
            <RefreshCw className="size-3" /> Refunded
          </span>
        );
      default:
        return <span className="text-[11px] text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Stripe Connect Card (For Freelancer & Expert) */}
      {isFreelancerOrExpert && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0069D3]">
                  <Wallet className="size-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Stripe Payout Account
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl pt-1">
                Link your bank account or debit card using Stripe Express. When a client releases a milestone or arbitration decision, your earnings transfer directly to your bank account.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchConnect()}
              disabled={connectLoading}
              className="rounded-full text-xs h-8 px-3 shrink-0 self-start sm:self-center"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${connectLoading ? "animate-spin" : ""}`}
              />
              Refresh status
            </Button>
          </div>

          <div className="pt-5">
            {connectLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin text-[#0069D3]" />
                <span>Checking Stripe account verification...</span>
              </div>
            ) : connectStatus?.isConnected && connectStatus.payoutsEnabled ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Connected & Payouts Active
                      </span>
                      <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5">
                        Verified
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
                      Account ID: {connectStatus.stripeAccountId}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartOnboarding}
                  disabled={onboardingLoading}
                  className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold h-8 px-4 shrink-0"
                >
                  {onboardingLoading ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-1.5 size-3.5" />
                  )}
                  Stripe Express Dashboard
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      No Payout Account Connected
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                      Action Required
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You cannot receive released payments until you complete the simple Stripe Express bank onboarding.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartOnboarding}
                  disabled={onboardingLoading}
                  className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-5 shrink-0 shadow-sm"
                >
                  {onboardingLoading ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Building2 className="mr-1.5 size-3.5" />
                  )}
                  Connect Bank Account with Stripe
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Client Saved Payment Methods Card */}
      {!isFreelancerOrExpert && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0069D3]">
                <CreditCard className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Saved Payment Methods
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  1-Click checkout and card management powered by Stripe
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCustomerPortal}
              disabled={portalLoading}
              className="rounded-full text-xs font-semibold h-9 px-4 shrink-0 border-border/80 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {portalLoading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="mr-1.5 size-3.5 text-muted-foreground" />
              )}
              Manage in Stripe Portal
            </Button>
          </div>

          {paymentMethodsLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              <span className="text-xs">Loading saved cards...</span>
            </div>
          ) : paymentMethodsData?.paymentMethods &&
            paymentMethodsData.paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethodsData.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="rounded-xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {pm.brand}
                    </span>
                    {pm.isDefault && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-mono tracking-widest text-foreground font-semibold">
                    •••• •••• •••• {pm.last4}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>Expires</span>
                    <span>
                      {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-zinc-50/50 dark:bg-zinc-900/20 p-5 text-center space-y-2">
              <CreditCard className="size-6 text-muted-foreground mx-auto stroke-1" />
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No cards saved yet. When you fund a milestone or pay a platform fee via Stripe Checkout, your card will be securely remembered for 1-click payments.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOpenCustomerPortal}
                disabled={portalLoading}
                className="text-xs text-[#0069D3] hover:text-[#005bb8] h-8"
              >
                Add Card via Stripe Portal
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. Client Escrow Info Card */}
      {!isFreelancerOrExpert && (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Payment Protection & Escrow
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                How payments work on Frevia marketplace
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                1. Fund Milestones
              </span>
              <p>
                Deposit milestone funds into Escrow using Stripe. Funds are securely locked until you are satisfied.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                2. Review Work
              </span>
              <p>
                Review submitted deliverables. Request revisions or ask for adjustments if needed.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-zinc-50 dark:bg-zinc-900/40 p-4 space-y-1">
              <span className="font-semibold text-foreground block">
                3. Release or Refund
              </span>
              <p>
                Approve deliverables to release payouts directly to freelancer, or refund if mutually agreed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Transaction History Table */}
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 text-foreground">
              <History className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Transaction History
              </h3>
              <p className="text-xs text-muted-foreground">
                All platform fee, escrow deposit, release, and refund records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-full border border-border bg-transparent px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="ESCROW_DEPOSIT">Escrow Deposit</option>
              <option value="MILESTONE_PAYOUT">Milestone Payout</option>
              <option value="PLATFORM_FEE">Platform Fee</option>
              <option value="DISPUTE_FEE">Dispute Fee</option>
              <option value="REFUND">Refund</option>
              <option value="ARBITRATOR_PAYOUT">Arbitrator Payout</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchTransactions()}
              disabled={transactionsLoading}
              className="rounded-full text-xs h-8 px-3"
            >
              <RefreshCw
                className={`size-3.5 ${transactionsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-muted-foreground border-b border-border/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#0069D3]" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                transactionsData.data.map((tx: TransactionType) => {
                  const typeBadge = getTypeBadge(tx.type);
                  const isDebit =
                    tx.type === "MILESTONE_PAYOUT" ||
                    tx.type === "ARBITRATOR_PAYOUT";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${typeBadge.className}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isDebit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }
                        >
                          {isDebit ? "+" : ""}
                          {money(tx.amount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {tx.stripePaymentIntentId ||
                          tx.stripeTransferId ||
                          tx.stripeRefundId ||
                          `#${tx.id}`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    <CreditCard className="size-6 mx-auto mb-2 text-muted-foreground/40" />
                    <span>No transactions recorded yet.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactionsData && transactionsData.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>
              Page {transactionsData.page} of {transactionsData.totalPages} (
              {transactionsData.totalItems} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full text-xs h-8 px-3"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(transactionsData.totalPages, p + 1))
                }
                disabled={page >= transactionsData.totalPages}
                className="rounded-full text-xs h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
