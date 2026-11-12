"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Eye,
  History,
  Loader2,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastSuccess } from "@repo/ui/components/shadcn/toast";
import { paymentApiRequest } from "@/apiRequests/payment";
import type {
  GetTransactionListQueryType,
  TransactionType,
} from "@shared/types";
import { PaymentDetailSheet } from "./payment-detail-sheet";
import { PaymentMethodCard } from "./payment-method-card";
import {
  formatCurrency,
  formatShortDate,
  getTransactionTypeLabel,
  TransactionStatusPill,
} from "./payment-utils";
import { StripeConnectCard } from "./stripe-connect-card";

interface BillingPaymentsViewProps {
  mode: "client" | "freelancer";
}

/**
 * Unified minimalist Billing & Payments view styled cleanly for Client and Freelancer roles.
 */
export function BillingPaymentsView({ mode }: BillingPaymentsViewProps) {
  const isClient = mode === "client";
  const basePath = isClient ? "/client" : "/freelancer";
  const returnPath = `${basePath}/payments`;

  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [contractIdFilter, setContractIdFilter] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionType | null>(null);

  const parsedContractId = contractIdFilter.trim()
    ? Number(contractIdFilter.trim())
    : undefined;

  const { data: summaryLedger } = useQuery({
    queryKey: ["transactions-summary", mode],
    queryFn: async () => {
      const res = await paymentApiRequest.getTransactions({
        page: 1,
        limit: 50,
      });
      return res.data;
    },
  });

  const {
    data: transactionsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      isClient ? "client-transactions" : "freelancer-transactions",
      page,
      selectedType,
      selectedStatus,
      parsedContractId,
    ],
    queryFn: async () => {
      const query: Partial<GetTransactionListQueryType> = {
        page,
        limit: 10,
        ...(selectedType !== "ALL" && {
          type: selectedType as TransactionType["type"],
        }),
        ...(selectedStatus !== "ALL" && {
          status: selectedStatus as TransactionType["status"],
        }),
        ...(parsedContractId &&
          !Number.isNaN(parsedContractId) && {
          contractId: parsedContractId,
        }),
      };
      const res = await paymentApiRequest.getTransactions(query);
      return res.data;
    },
  });

  const transactions = transactionsData?.data ?? [];
  const totalPages = transactionsData?.totalPages ?? 1;
  const totalItems = transactionsData?.totalItems ?? 0;

  const summaryRows = summaryLedger?.data ?? transactions;
  const totalEscrowDeposited = summaryRows
    .filter((t) => t.type === "ESCROW_DEPOSIT" && t.status === "SUCCEEDED")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPayouts = summaryRows
    .filter((t) => t.type === "MILESTONE_PAYOUT" && t.status === "SUCCEEDED")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPlatformFees = summaryRows
    .filter((t) => t.type === "PLATFORM_FEE" && t.status === "SUCCEEDED")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunded = summaryRows
    .filter((t) => t.type === "REFUND" && t.status === "SUCCEEDED")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const clientReleasePercent =
    totalEscrowDeposited > 0
      ? Math.min(100, Math.round((totalPayouts / totalEscrowDeposited) * 100))
      : 0;
  const clientFeeRatioPercent =
    totalEscrowDeposited > 0
      ? Math.min(
        100,
        Math.max(
          totalPlatformFees > 0 ? 8 : 0,
          Math.round((totalPlatformFees / totalEscrowDeposited) * 100),
        ),
      )
      : 0;

  const grossEarnings = totalPayouts + totalPlatformFees;
  const freelancerNetPercent =
    grossEarnings > 0
      ? Math.min(100, Math.round((totalPayouts / grossEarnings) * 100))
      : 0;
  const freelancerFeePercent =
    grossEarnings > 0
      ? Math.min(
        100,
        Math.max(
          totalPlatformFees > 0 ? 5 : 0,
          Math.round((totalPlatformFees / grossEarnings) * 100),
        ),
      )
      : 0;

  const copyReference = (refId: string) => {
    void navigator.clipboard.writeText(refId);
    toastSuccess({ message: `Copied ${refId} to clipboard.` });
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header Row: Wallet / Payment Method / Connect Stripe / Usage Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          {isClient ? (
            <PaymentMethodCard returnPath={returnPath} />
          ) : (
            <StripeConnectCard returnPath={returnPath} />
          )}
        </div>

        {/* Overview / Usage Card */}
        <div className="lg:col-span-7">
          <div className="h-full flex flex-col gap-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              {isClient ? "Escrow & Spend Usage" : "Earnings & Fee Summary"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-sm border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0069D3]">
                    {isClient ? (
                      <ShieldCheck className="size-3.5" />
                    ) : (
                      <Wallet className="size-3.5" />
                    )}
                  </div>
                  <span className="text-[13px] text-foreground">
                    {isClient ? "Escrow Released" : "Net Payouts"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground">
                    {isClient ? "Released of funded" : "95% released"}
                  </span>
                  <span className=" tabular-nums text-foreground">
                    {isClient
                      ? `${formatCurrency(totalPayouts)} / ${formatCurrency(totalEscrowDeposited)}`
                      : `${formatCurrency(totalPayouts)} / ${formatCurrency(grossEarnings)}`}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#635BFF] transition-all duration-300"
                    style={{
                      width: `${isClient ? clientReleasePercent : freelancerNetPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-sm border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Percent className="size-3.5" />
                  </div>
                  <span className="text-[13px] text-foreground">
                    {isClient
                      ? "Platform Fees & Refunds"
                      : "Platform Fees (5%)"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground">
                    {isClient
                      ? `Refunded ${formatCurrency(totalRefunded)}`
                      : "Deducted on release"}
                  </span>
                  <span className=" tabular-nums text-foreground">
                    {formatCurrency(totalPlatformFees)}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#635BFF] transition-all duration-300"
                    style={{
                      width: `${isClient ? clientFeeRatioPercent : freelancerFeePercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* ── Bottom Full-Width Section: Invoice & Payment History Table ── */}
      <div>
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {isClient
                  ? "Invoice & Payment History"
                  : "Payout & Transaction History"}
              </h2>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {totalItems}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by transaction type"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3] cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="ESCROW_DEPOSIT">Escrow Deposit</option>
                <option value="MILESTONE_PAYOUT">Payout</option>
                <option value="PLATFORM_FEE">Platform Fee</option>
                <option value="REFUND">Refund</option>
              </select>

              <select
                aria-label="Filter by transaction status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCEEDED">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Contract #"
                  value={contractIdFilter}
                  onChange={(e) => {
                    setContractIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-24 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                />
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isLoading || isRefetching}
                aria-label="Refresh transaction history"
                className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`size-3.5 ${isLoading || isRefetching ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 text-muted-foreground">
                  <th className="rounded-l-lg px-3.5 py-2.5 font-medium">
                    Transaction ID
                  </th>
                  <th className="px-3.5 py-2.5 font-medium">Type & Contract</th>
                  <th className="px-3.5 py-2.5 font-medium">Date</th>
                  <th className="px-3.5 py-2.5 font-medium">Amount</th>
                  <th className="px-3.5 py-2.5 font-medium">Status</th>
                  <th className="rounded-r-lg px-3.5 py-2.5 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-muted-foreground"
                    >
                      <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#0069D3]" />
                      <span>Loading payment records...</span>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-xs mx-auto space-y-2">
                        <div className="flex size-10 items-center justify-center rounded-sm bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                          <History className="size-5" />
                        </div>
                        <p className="text-sm text-foreground">
                          No transactions yet
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedType !== "ALL" ||
                            selectedStatus !== "ALL" ||
                            contractIdFilter
                            ? "Try adjusting your filters to view more transactions."
                            : isClient
                              ? "Authorized contract holds, milestone deposits, and fees will appear here."
                              : "Completed milestone payouts and platform fee deductions will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const txCode = `TX-${String(tx.id).padStart(4, "0")}`;
                    const copyableRef =
                      tx.stripePaymentIntentId ||
                      tx.stripeTransferId ||
                      tx.stripeRefundId ||
                      txCode;

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
                      >
                        <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-foreground tabular-nums">
                          {txCode}
                        </td>
                        <td className="px-3.5 py-3.5">
                          <p className="font-medium text-foreground">
                            {getTransactionTypeLabel(tx.type)}
                          </p>
                          {tx.contractId && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              Contract #{tx.contractId}
                              {tx.contract?.job?.title
                                ? ` · ${tx.contract.job.title}`
                                : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap text-muted-foreground">
                          {formatShortDate(tx.createdAt)}
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap font-medium tabular-nums text-foreground">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap">
                          <TransactionStatusPill status={tx.status} type={tx.type} />
                        </td>
                        <td className="px-3.5 py-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTransaction(tx);
                              }}
                              title="View payment detail"
                              aria-label={`View payment detail ${txCode}`}
                              className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-[#0069D3] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyReference(copyableRef);
                              }}
                              title={`Copy ${copyableRef}`}
                              aria-label={`Copy ${copyableRef}`}
                              className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            {tx.contractId && (
                              <Link
                                href={`${basePath}/contracts/${tx.contractId}`}
                                onClick={(e) => e.stopPropagation()}
                                title={`Open Contract #${tx.contractId}`}
                                aria-label={`Open Contract #${tx.contractId}`}
                                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-[#0069D3] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <ExternalLink className="size-3.5" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 rounded-lg px-2.5 text-xs"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 rounded-lg px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Slide-Over Payment Detail Popup */}
      <PaymentDetailSheet
        transaction={selectedTransaction}
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
        basePath={basePath}
      />
    </div>
  );
}

