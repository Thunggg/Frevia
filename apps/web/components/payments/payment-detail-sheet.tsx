"use client";

import Link from "next/link";
import {
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { TransactionType } from "@shared/types";
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
  TransactionStatusPill,
} from "./payment-utils";

interface PaymentDetailSheetProps {
  transaction: TransactionType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath: "/client" | "/freelancer";
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface MetadataEntry {
  key: string;
  label: string;
  formatted: string;
}

const CURRENCY_METADATA_KEYS = new Set([
  "milestonesAmount",
  "platformFeeAmount",
  "contractTotal",
  "grossAmount",
  "netAmount",
  "feeAmount",
  "clientFee",
  "freelancerFee",
  "refundAmount",
]);

const METADATA_LABELS: Record<string, string> = {
  role: "Payer / Party Role",
  milestoneCount: "Milestones Covered",
  milestoneIds: "Milestone IDs",
  milestonesAmount: "Milestones Subtotal",
  platformFeeAmount: "Platform Fee",
  contractTotal: "Contract Value",
  grossAmount: "Gross Milestone Amount",
  netAmount: "Net Payout (95%)",
  feeAmount: "Fee Deducted",
  feeRate: "Fee Rate",
  holdMode: "Settlement Mode",
  reason: "Reason",
  note: "Note",
  description: "Description",
};

function formatMetadataEntries(
  metadata: unknown,
  currency: string,
): MetadataEntry[] {
  if (!isPlainRecord(metadata)) return [];

  const entries: MetadataEntry[] = [];
  for (const [key, rawValue] of Object.entries(metadata)) {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      continue;
    }

    const label =
      METADATA_LABELS[key] ??
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]+/g, " ")
        .replace(/^./, (c) => c.toUpperCase());

    let formatted: string;
    if (CURRENCY_METADATA_KEYS.has(key) && typeof rawValue === "number") {
      formatted = formatCurrency(rawValue, currency);
    } else if (Array.isArray(rawValue)) {
      formatted = rawValue.join(", ");
    } else if (typeof rawValue === "boolean") {
      formatted = rawValue ? "Yes" : "No";
    } else if (typeof rawValue === "object") {
      formatted = JSON.stringify(rawValue);
    } else {
      formatted = String(rawValue);
    }

    entries.push({ key, label, formatted });
  }

  return entries;
}

function getTransactionSummaryNote(tx: TransactionType): string {
  switch (tx.type) {
    case "ESCROW_DEPOSIT":
      return tx.status === "PENDING"
        ? "Authorization hold placed on card. Funds capture automatically when the contract is signed by both parties."
        : "Escrow funds secured in Stripe for contract milestone delivery.";
    case "MILESTONE_PAYOUT":
      return "Milestone release transferred to the freelancer's Stripe payout account.";
    case "PLATFORM_FEE":
      return "Frevia platform service fee recorded for contract processing.";
    case "REFUND":
      return "Escrow funds returned to the client's original payment method.";
    case "DISPUTE_FEE":
      return "Dispute settlement charge recorded on this contract.";
    default:
      return "Payment ledger entry recorded via Stripe.";
  }
}

/**
 * Right-side slide-over sheet displaying detailed receipt, contract links, Stripe IDs,
 * and structured metadata for a selected transaction.
 */
export function PaymentDetailSheet({
  transaction,
  open,
  onOpenChange,
  basePath,
}: PaymentDetailSheetProps) {
  if (!transaction) return null;

  const txCode = `TX-${String(transaction.id).padStart(4, "0")}`;
  const primaryRef =
    transaction.stripePaymentIntentId ||
    transaction.stripeTransferId ||
    transaction.stripeRefundId ||
    txCode;

  const stripeRefs = [
    transaction.stripePaymentIntentId
      ? { label: "Payment Intent ID", value: transaction.stripePaymentIntentId }
      : null,
    transaction.stripeTransferId
      ? { label: "Stripe Transfer ID", value: transaction.stripeTransferId }
      : null,
    transaction.stripeRefundId
      ? { label: "Stripe Refund ID", value: transaction.stripeRefundId }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  const metadataEntries = formatMetadataEntries(
    transaction.metadata,
    transaction.currency,
  );

  const copyValue = (val: string, label: string) => {
    void navigator.clipboard.writeText(val);
    toastSuccess({ message: `Copied ${label} to clipboard.` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-white dark:bg-zinc-950 shadow-2xl z-50"
      >
        <div className="space-y-5">
          <SheetHeader className="p-0 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0069D3]">
                  <Receipt className="size-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold text-foreground">
                    Payment Detail
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground font-mono">
                    {txCode}
                  </SheetDescription>
                </div>
              </div>
              <TransactionStatusPill
                status={transaction.status}
                type={transaction.type}
              />
            </div>
          </SheetHeader>

          {/* Amount Hero Box */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 space-y-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {getTransactionTypeLabel(transaction.type)}
              </span>
              <span className="rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {transaction.currency}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getTransactionSummaryNote(transaction)}
            </p>
          </div>

          {/* Transaction & Contract Context */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transaction Summary
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block">Created Date</span>
                <span className="font-medium text-foreground">
                  {formatDateTime(transaction.createdAt)}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground block">Type</span>
                <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-muted-foreground" />
                  {getTransactionTypeLabel(transaction.type)}
                </span>
              </div>

              {transaction.contractId && (
                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-muted-foreground block">
                    Related Contract
                  </span>
                  <Link
                    href={`${basePath}/contracts/${transaction.contractId}`}
                    onClick={() => onOpenChange(false)}
                    className="font-medium text-[#0069D3] hover:underline inline-flex items-center gap-1.5"
                  >
                    <FileText className="size-3.5" />
                    <span>
                      Contract #{transaction.contractId}
                      {transaction.contract?.job?.title
                        ? ` — ${transaction.contract.job.title}`
                        : ""}
                    </span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              )}

              {transaction.contractId && transaction.milestoneId && (
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block">Milestone</span>
                  <Link
                    href={`${basePath}/contracts/${transaction.contractId}/milestones/${transaction.milestoneId}`}
                    onClick={() => onOpenChange(false)}
                    className="font-medium text-[#0069D3] hover:underline inline-flex items-center gap-1"
                  >
                    <span>
                      MLS-{String(transaction.milestoneId).padStart(4, "0")}
                    </span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              )}

              {transaction.disputeId && (
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block">Dispute</span>
                  <span className="font-medium text-foreground">
                    Dispute #{transaction.disputeId}
                  </span>
                </div>
              )}

              {transaction.updatedAt && (
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block">
                    Last Updated
                  </span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(transaction.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stripe References */}
          {stripeRefs.length > 0 && (
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-3.5 text-[#0069D3]" />
                <span>Stripe Verification IDs</span>
              </div>

              <div className="space-y-2.5">
                {stripeRefs.map((ref) => (
                  <div
                    key={ref.label}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] text-muted-foreground block">
                        {ref.label}
                      </span>
                      <span className="font-mono text-foreground truncate block">
                        {ref.value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue(ref.value, ref.label)}
                      title={`Copy ${ref.label}`}
                      aria-label={`Copy ${ref.label}`}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Breakdown */}
          {metadataEntries.length > 0 && (
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Breakdown & Metadata
              </h4>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                {metadataEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <span className="text-muted-foreground shrink-0">
                      {entry.label}
                    </span>
                    <span className="font-medium text-foreground text-right break-all">
                      {entry.formatted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="p-0 pt-5 mt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyValue(primaryRef, "transaction reference")}
            className="rounded-lg text-xs h-9 px-3 cursor-pointer"
          >
            <Copy className="mr-1.5 size-3.5" />
            Copy Ref
          </Button>

          <div className="flex items-center gap-2">
            {transaction.contractId && (
              <Button
                type="button"
                size="sm"
                asChild
                className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-4"
              >
                <Link
                  href={`${basePath}/contracts/${transaction.contractId}`}
                  onClick={() => onOpenChange(false)}
                >
                  <ExternalLink className="mr-1.5 size-3.5" />
                  Open Contract
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs h-9 px-3 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

