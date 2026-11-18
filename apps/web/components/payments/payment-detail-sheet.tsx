"use client";

import { Copy } from "lucide-react";
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
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface EssentialMetadataItem {
  key: string;
  label: string;
  value: string;
}

const CURRENCY_KEYS = new Set([
  "milestonesAmount",
  "platformFeeAmount",
  "contractTotal",
  "grossAmount",
  "netAmount",
  "feeAmount",
  "refundAmount",
]);

const ESSENTIAL_METADATA_LABELS: Record<string, string> = {
  milestonesAmount: "Milestones Subtotal",
  platformFeeAmount: "Platform Fee",
  grossAmount: "Gross Amount",
  netAmount: "Net Payout",
  feeAmount: "Fee Deducted",
  refundAmount: "Refund Amount",
  milestoneCount: "Milestones Covered",
  reason: "Reason",
  note: "Note",
};

function extractEssentialMetadata(
  metadata: unknown,
  currency: string,
): EssentialMetadataItem[] {
  if (!isPlainRecord(metadata)) return [];

  const items: EssentialMetadataItem[] = [];
  for (const [key, label] of Object.entries(ESSENTIAL_METADATA_LABELS)) {
    const rawValue = metadata[key];
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      continue;
    }

    let formatted: string;
    if (CURRENCY_KEYS.has(key) && typeof rawValue === "number") {
      formatted = formatCurrency(rawValue, currency);
    } else if (typeof rawValue === "string" || typeof rawValue === "number") {
      formatted = String(rawValue);
    } else {
      continue;
    }

    items.push({ key, label, value: formatted });
  }

  return items;
}

function getShortDescription(tx: TransactionType): string {
  switch (tx.type) {
    case "ESCROW_DEPOSIT":
      return tx.status === "PENDING"
        ? "Authorization hold placed on card until contract signing."
        : "Escrow funds held in Stripe for milestone delivery.";
    case "MILESTONE_PAYOUT":
      return "Released milestone payout transferred via Stripe.";
    case "PLATFORM_FEE":
      return "Frevia platform service fee.";
    case "REFUND":
      return "Escrow refund returned to original payment method.";
    case "DISPUTE_FEE":
      return "Dispute settlement charge.";
    default:
      return "Transaction recorded via Stripe.";
  }
}

/**
 * Clean read-only sheet displaying only essential transaction information without page navigation.
 */
export function PaymentDetailSheet({
  transaction,
  open,
  onOpenChange,
}: PaymentDetailSheetProps) {
  if (!transaction) return null;

  const txCode = `TX-${String(transaction.id).padStart(4, "0")}`;
  const stripeRef =
    transaction.stripePaymentIntentId ||
    transaction.stripeTransferId ||
    transaction.stripeRefundId ||
    null;

  const breakdownItems = extractEssentialMetadata(
    transaction.metadata,
    transaction.currency,
  );

  const handleCopyRef = (value: string) => {
    void navigator.clipboard.writeText(value);
    toastSuccess({ message: "Reference ID copied." });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-white dark:bg-zinc-950 z-50"
      >
        <div className="space-y-6">
          {/* Header */}
          <SheetHeader className="p-0 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between gap-2 pr-6">
              <div>
                <SheetTitle className="text-base font-medium text-foreground">
                  Transaction Detail
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                  {txCode}
                </SheetDescription>
              </div>
              <TransactionStatusPill
                status={transaction.status}
                type={transaction.type}
              />
            </div>
          </SheetHeader>

          {/* Amount Block */}
          <div className="rounded-sm border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 p-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{getTransactionTypeLabel(transaction.type)}</span>
              <span className="uppercase tracking-wider text-[11px]">
                {transaction.currency}
              </span>
            </div>
            <p className="text-2xl font-medium tracking-tight tabular-nums text-foreground">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
              {getShortDescription(transaction)}
            </p>
          </div>

          {/* Essential Information List (Read-only, no page links) */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Date</span>
              <span className="text-foreground text-right tabular-nums">
                {formatDateTime(transaction.createdAt)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Type</span>
              <span className="text-foreground text-right">
                {getTransactionTypeLabel(transaction.type)}
              </span>
            </div>

            {transaction.contractId && (
              <div className="py-3 flex items-start justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Contract</span>
                <span className="text-foreground text-right">
                  Contract #{transaction.contractId}
                  {transaction.contract?.job?.title
                    ? ` — ${transaction.contract.job.title}`
                    : ""}
                </span>
              </div>
            )}

            {transaction.milestoneId && (
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground shrink-0">
                  Milestone
                </span>
                <span className="font-mono text-foreground text-right">
                  MLS-{String(transaction.milestoneId).padStart(4, "0")}
                </span>
              </div>
            )}

            {transaction.disputeId && (
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Dispute</span>
                <span className="text-foreground text-right">
                  Dispute #{transaction.disputeId}
                </span>
              </div>
            )}

            {breakdownItems.map((item) => (
              <div
                key={item.key}
                className="py-3 flex items-start justify-between gap-4"
              >
                <span className="text-muted-foreground shrink-0">
                  {item.label}
                </span>
                <span className="text-foreground text-right tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}

            {stripeRef && (
              <div className="py-3 flex items-center justify-between gap-3">
                <span className="text-muted-foreground shrink-0">
                  Reference ID
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-foreground truncate max-w-[190px]">
                    {stripeRef}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(stripeRef)}
                    aria-label="Copy reference ID"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-0 pt-4 mt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs h-8 px-4 cursor-pointer"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
