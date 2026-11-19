"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
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
import { useActionPermission } from "@/hooks/use-action-permission";
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
  TransactionStatusPill,
  usePaymentTypeLabel,
} from "./payment-utils";
import { StripeConnectCard } from "./stripe-connect-card";

interface BillingPaymentsViewProps {
  mode: "client" | "freelancer";
}

/**
 * Unified minimalist Billing & Payments view styled cleanly for Client and Freelancer roles.
 */
export function BillingPaymentsView({ mode }: BillingPaymentsViewProps) {
  const t = useTranslations("payments");
  const locale = useLocale();
  const getTransactionTypeLabel = usePaymentTypeLabel();
  const isClient = mode === "client";
  const basePath = isClient ? "/client" : "/freelancer";
  const returnPath = `${basePath}/payments`;

  const { can } = useActionPermission();
  const canGetTransactions = can("GET", "/api/payments/transactions");

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
    enabled: canGetTransactions,
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
    enabled: canGetTransactions,
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

  return (
    <div className="space-y-5">
      {/* Top Row: Virtual Payment Card / Connect Stripe + Usage Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          {isClient ? (
            <PaymentMethodCard />
          ) : (
            <StripeConnectCard returnPath={returnPath} />
          )}
        </div>

        {/* Overview / Usage Card */}
        <div className="lg:col-span-7">
          <div className="h-full flex flex-col justify-between gap-4 rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-[15px] font-medium tracking-tight text-foreground">
              {isClient
                ? t("billing.clientUsageTitle")
                : t("billing.freelancerUsageTitle")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
              <div className="flex flex-col justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground">
                    {isClient ? (
                      <ShieldCheck className="size-4" />
                    ) : (
                      <Wallet className="size-4" />
                    )}
                  </div>
                  <span className="text-[13px] text-foreground">
                    {isClient
                      ? t("billing.escrowReleased")
                      : t("billing.netPayouts")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs gap-2">
                    <span className="text-muted-foreground">
                      {isClient
                        ? t("billing.releasedOfFunded")
                        : t("billing.percentReleased")}
                    </span>
                    <span className="tabular-nums text-foreground font-medium">
                      {isClient
                        ? `${formatCurrency(totalPayouts)} / ${formatCurrency(totalEscrowDeposited)}`
                        : `${formatCurrency(totalPayouts)} / ${formatCurrency(grossEarnings)}`}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-200 transition-all duration-300"
                      style={{
                        width: `${isClient ? clientReleasePercent : freelancerNetPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground">
                    <Percent className="size-4" />
                  </div>
                  <span className="text-[13px] text-foreground">
                    {isClient
                      ? t("billing.clientFeesAndRefunds")
                      : t("billing.freelancerPlatformFees")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs gap-2">
                    <span className="text-muted-foreground">
                      {isClient
                        ? t("billing.refundedAmount", {
                            amount: formatCurrency(totalRefunded),
                          })
                        : t("billing.deductedOnRelease")}
                    </span>
                    <span className="tabular-nums text-foreground font-medium">
                      {formatCurrency(totalPlatformFees)}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-200 transition-all duration-300"
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
      </div>

      {/* Bottom Section: Invoice & Payment History Table */}
      {canGetTransactions && (
        <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-medium tracking-tight text-foreground">
                {isClient
                  ? t("billing.clientHistoryTitle")
                  : t("billing.freelancerHistoryTitle")}
              </h2>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                {totalItems}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={t("billing.filterByTypeAria")}
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
              >
                <option value="ALL">{t("billing.allTypes")}</option>
                <option value="ESCROW_DEPOSIT">
                  {t("types.ESCROW_DEPOSIT")}
                </option>
                <option value="MILESTONE_PAYOUT">
                  {t("types.PAYOUT_SHORT")}
                </option>
                <option value="PLATFORM_FEE">{t("types.PLATFORM_FEE")}</option>
                <option value="REFUND">{t("types.REFUND")}</option>
              </select>

              <select
                aria-label={t("billing.filterByStatusAria")}
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 cursor-pointer"
              >
                <option value="ALL">{t("billing.allStatus")}</option>
                <option value="SUCCEEDED">{t("statuses.PAID")}</option>
                <option value="PENDING">{t("statuses.PENDING")}</option>
                <option value="FAILED">{t("statuses.FAILED")}</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("billing.contractFilterPlaceholder")}
                  value={contractIdFilter}
                  onChange={(e) => {
                    setContractIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-24 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isLoading || isRefetching}
                aria-label={t("billing.refreshHistoryAria")}
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
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-muted-foreground">
                  <th className="px-3 py-2.5 font-normal">
                    {t("billing.colTransaction")}
                  </th>
                  <th className="px-3 py-2.5 font-normal">
                    {t("billing.colDescription")}
                  </th>
                  <th className="px-3 py-2.5 font-normal">
                    {t("billing.colDate")}
                  </th>
                  <th className="px-3 py-2.5 font-normal">
                    {t("billing.colAmount")}
                  </th>
                  <th className="px-3 py-2.5 font-normal">
                    {t("billing.colStatus")}
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal">
                    {t("billing.colDetail")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-muted-foreground"
                    >
                      <Loader2 className="size-4 animate-spin mx-auto mb-2" />
                      <span>{t("billing.loadingRecords")}</span>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center max-w-xs mx-auto space-y-1.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground mb-1">
                          <History className="size-4" />
                        </div>
                        <p className="text-sm text-foreground">
                          {t("billing.emptyTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedType !== "ALL" ||
                            selectedStatus !== "ALL" ||
                            contractIdFilter
                            ? t("billing.emptyFiltered")
                            : isClient
                              ? t("billing.emptyClient")
                              : t("billing.emptyFreelancer")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const txCode = `TX-${String(tx.id).padStart(4, "0")}`;

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-3.5 whitespace-nowrap font-mono text-muted-foreground tabular-nums">
                          {txCode}
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-foreground">
                            {getTransactionTypeLabel(tx.type)}
                          </p>
                          {tx.contractId && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[260px] mt-0.5">
                              {t("detail.contractNumber", {
                                id: tx.contractId,
                              })}
                              {tx.contract?.job?.title
                                ? ` · ${tx.contract.job.title}`
                                : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                          {formatShortDate(tx.createdAt, locale)}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap font-medium tabular-nums text-foreground">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <TransactionStatusPill
                            status={tx.status}
                            type={tx.type}
                          />
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(tx);
                            }}
                            aria-label={t("billing.viewDetailAria", {
                              code: txCode,
                            })}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Eye className="size-3.5" />
                            <span>{t("billing.view")}</span>
                          </button>
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
                {t("billing.pageOf", { page, totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
                >
                  {t("billing.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 rounded-lg px-2.5 text-xs cursor-pointer"
                >
                  {t("billing.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Read-only Transaction Detail Sheet */}
      <PaymentDetailSheet
        transaction={selectedTransaction}
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      />
    </div>
  );
}
