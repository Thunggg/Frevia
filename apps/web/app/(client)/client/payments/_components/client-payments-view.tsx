"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { paymentApiRequest } from "@/apiRequests/payment";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  History,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import type {
  GetTransactionListQueryType,
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

export function ClientPaymentsView() {
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [contractIdFilter, setContractIdFilter] = useState<string>("");

  const parsedContractId = contractIdFilter.trim()
    ? Number(contractIdFilter.trim())
    : undefined;

  const {
    data: transactionsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      "client-transactions",
      page,
      selectedType,
      selectedStatus,
      parsedContractId,
    ],
    queryFn: async () => {
      const query: Partial<GetTransactionListQueryType> = {
        page,
        limit: 12,
        ...(selectedType !== "ALL" && {
          type: selectedType as TransactionType["type"],
        }),
        ...(selectedStatus !== "ALL" && {
          status: selectedStatus as TransactionType["status"],
        }),
        ...(parsedContractId && !isNaN(parsedContractId) && {
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

  // Compute summary stats from current or overall dataset
  const totalEscrowDeposited = transactions
    .filter(
      (t) =>
        t.type === "ESCROW_DEPOSIT" && t.status === "SUCCEEDED",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalMilestonesReleased = transactions
    .filter(
      (t) =>
        t.type === "MILESTONE_PAYOUT" && t.status === "SUCCEEDED",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPlatformFees = transactions
    .filter(
      (t) =>
        t.type === "PLATFORM_FEE" && t.status === "SUCCEEDED",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRefunded = transactions
    .filter(
      (t) => t.type === "REFUND" && t.status === "SUCCEEDED",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toastSuccess({ message: `Copied ${label} to clipboard!` });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ESCROW_DEPOSIT":
        return {
          label: "Escrow Deposit",
          icon: ShieldCheck,
          className:
            "bg-blue-50 text-[#0069D3] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
        };
      case "MILESTONE_PAYOUT":
        return {
          label: "Milestone Payout",
          icon: ArrowUpRight,
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
        };
      case "PLATFORM_FEE":
        return {
          label: "Platform Fee",
          icon: CreditCard,
          className:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
        };
      case "DISPUTE_FEE":
        return {
          label: "Dispute Fee",
          icon: Info,
          className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
        };
      case "REFUND":
        return {
          label: "Refund Received",
          icon: ArrowDownLeft,
          className:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
        };
      case "ARBITRATOR_PAYOUT":
        return {
          label: "Arbitrator Payout",
          icon: Wallet,
          className:
            "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
        };
      default:
        return {
          label: type,
          icon: History,
          className: "bg-zinc-100 text-zinc-700 border-zinc-200",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900">
            <CheckCircle2 className="size-3" />
            Succeeded
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900">
            <Clock className="size-3 animate-pulse" />
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
            <XCircle className="size-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 border border-zinc-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Billing & Transaction History
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            View all contract escrow funding, released freelancer payouts, platform fees, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="rounded-full text-xs h-9 px-3.5 border-border bg-card hover:bg-accent"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${
                isLoading || isRefetching ? "animate-spin" : ""
              }`}
            />
            Refresh Ledger
          </Button>

          <Button
            size="sm"
            asChild
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-4 shadow-sm"
          >
            <Link href="/client/contracts">
              <FileText className="mr-1.5 size-3.5" />
              My Contracts
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Escrow Protection Assurance Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-indigo-500/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0069D3] text-white shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Stripe Escrow Protection Enabled
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                When you fund a milestone, your money is securely locked in Stripe Escrow. Funds are never released until you inspect the work and click Release.
              </p>
            </div>
          </div>
          <Badge className="bg-[#0069D3]/10 text-[#0069D3] dark:text-blue-300 border border-[#0069D3]/20 text-[11px] px-3 py-1 font-semibold shrink-0">
            100% Protected
          </Badge>
        </div>
      </div>

      {/* 3. Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Escrow Funded
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0069D3]">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {money(totalEscrowDeposited)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Locked in current page
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Released Payouts
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {money(totalMilestonesReleased)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Transferred to freelancers
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Platform Fees
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {money(totalPlatformFees)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            $10 contract setup fees
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Refunds Received
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <ArrowDownLeft className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {money(totalRefunded)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Returned to your card
          </span>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All Types" },
            { id: "ESCROW_DEPOSIT", label: "Escrow Deposit" },
            { id: "MILESTONE_PAYOUT", label: "Milestone Payout" },
            { id: "PLATFORM_FEE", label: "Platform Fee" },
            { id: "REFUND", label: "Refunds" },
            { id: "DISPUTE_FEE", label: "Dispute Fee" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === type.id
                  ? "bg-[#0069D3] text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Status & Contract ID Filter */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-full border border-border bg-transparent px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Contract ID..."
              value={contractIdFilter}
              onChange={(e) => {
                setContractIdFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 w-28 rounded-full border border-border bg-transparent pl-7 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0069D3]"
            />
          </div>
        </div>
      </div>

      {/* 5. Transactions Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Date & Time</th>
                <th className="px-4 py-3.5 font-semibold">Transaction Type</th>
                <th className="px-4 py-3.5 font-semibold">Contract / Scope</th>
                <th className="px-4 py-3.5 font-semibold text-right">Amount</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#0069D3]" />
                    <p className="text-xs font-medium">Loading transactions...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                        <History className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        No transactions found
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {selectedType !== "ALL" || selectedStatus !== "ALL" || contractIdFilter
                          ? "Try resetting your filter parameters to see all records."
                          : "When you fund milestones or pay platform fees on contracts, they will appear here in your ledger."}
                      </p>
                      <Button
                        size="sm"
                        asChild
                        className="mt-4 rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
                      >
                        <Link href="/client/contracts">Browse Contracts</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const typeBadge = getTypeBadge(tx.type);
                  const Icon = typeBadge.icon;
                  const isDebit =
                    tx.type === "MILESTONE_PAYOUT" ||
                    tx.type === "ARBITRATOR_PAYOUT";
                  const referenceId =
                    tx.stripePaymentIntentId ||
                    tx.stripeTransferId ||
                    tx.stripeRefundId ||
                    `TX-${tx.id}`;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${typeBadge.className}`}
                        >
                          <Icon className="size-3" />
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {tx.contractId ? (
                          <Link
                            href={`/client/contracts/${tx.contractId}`}
                            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-[#0069D3] transition-colors"
                          >
                            <FileText className="size-3 text-muted-foreground" />
                            <span>
                              Contract #{tx.contractId}
                              {tx.contract?.job?.title
                                ? ` - ${tx.contract.job.title}`
                                : ""}
                            </span>
                            <ExternalLink className="size-3 opacity-60" />
                          </Link>
                        ) : tx.disputeId ? (
                          <span className="text-muted-foreground">
                            Dispute #{tx.disputeId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right font-bold">
                        <span
                          className={
                            isDebit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : tx.type === "REFUND"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-foreground"
                          }
                        >
                          {isDebit ? "-" : tx.type === "REFUND" ? "+" : ""}
                          {money(tx.amount, tx.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <span
                            title={referenceId}
                            className="max-w-[140px] truncate"
                          >
                            {referenceId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(referenceId, "Reference ID")}
                            title="Copy ID"
                            className="size-5 rounded flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page <strong className="text-foreground">{page}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong> ({totalItems} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-8 rounded-full text-xs px-3"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-8 rounded-full text-xs px-3"
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
