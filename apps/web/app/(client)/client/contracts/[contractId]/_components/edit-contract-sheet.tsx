"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { DollarSign, FileText, Loader2 } from "@/components/icons";
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { ContractDetailType } from "@shared/types";

interface EditContractSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetailType;
  minAllowedAmount?: number;
  onSuccess?: () => void;
}

export function EditContractSheet({
  open,
  onOpenChange,
  contract,
  minAllowedAmount = 0,
  onSuccess,
}: EditContractSheetProps) {
  const queryClient = useQueryClient();
  const [totalAmount, setTotalAmount] = useState<number>(
    Number(contract.totalAmount) || 0,
  );
  const [terms, setTerms] = useState<string>(contract.terms || "");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTotalAmount(Number(contract.totalAmount) || 0);
      setTerms(contract.terms || "");
      setExpiresAt(
        contract.expiresAt
          ? (new Date(contract.expiresAt).toISOString().split("T")[0] ?? "")
          : "",
      );
    }
  }, [open, contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalAmount || totalAmount <= 0) {
      toastError({ message: "Contract total budget must be greater than 0" });
      return;
    }

    if (minAllowedAmount > 0 && totalAmount < minAllowedAmount) {
      toastError({
        message: `Contract budget cannot be less than the sum of created milestones ($${minAllowedAmount.toLocaleString()})`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        totalAmount: number;
        terms?: string;
        expiresAt?: string;
      } = {
        totalAmount: Number(totalAmount),
      };

      if (terms.trim()) {
        payload.terms = terms.trim();
      }

      if (expiresAt) {
        const d = new Date(expiresAt);
        d.setHours(23, 59, 59, 999);
        payload.expiresAt = d.toISOString();
      }

      await contractApiRequest.update(contract.id, payload);

      toastSuccess({ message: "Contract updated successfully!" });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contract.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      let errorMessage = "Failed to update contract. Please try again.";
      if (error instanceof ApiFail) {
        const errResp = error.response as unknown as Record<string, unknown>;
        if (Array.isArray(errResp?.message)) {
          errorMessage = errResp.message
            .map((item: unknown) =>
              typeof item === "object" && item !== null && "message" in item
                ? String((item as { message: string }).message)
                : String(item),
            )
            .join(", ");
        } else if (typeof errResp?.message === "string") {
          errorMessage = errResp.message;
        } else if (
          typeof errResp?.error === "object" &&
          errResp.error !== null &&
          "message" in errResp.error
        ) {
          errorMessage = String((errResp.error as { message: string }).message);
        } else if (typeof errResp?.error === "string") {
          errorMessage = errResp.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      toastError({ message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                <FileText className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Edit Contract Agreement
              </SheetTitle>
            </div>
            <SheetDescription className="mt-1 text-xs text-muted-foreground">
              Modify the contract terms or budget before formal signing.
            </SheetDescription>
          </SheetHeader>

          <form id="edit-contract-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Total Budget */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Contract Total Budget (USD) <span className="text-red-500">*</span>
                </label>
                {minAllowedAmount > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Min required: ${minAllowedAmount.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="number"
                  min={minAllowedAmount > 0 ? minAllowedAmount : 1}
                  step="any"
                  required
                  value={totalAmount || ""}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
                />
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Contract Expiration / Deadline (Optional)
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
              />
            </div>

            {/* Terms of Engagement */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Terms of Service & Delivery Scope
              </label>
              <textarea
                rows={6}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Detail the scope of work and agreed delivery terms..."
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3] resize-none leading-relaxed"
              />
            </div>
          </form>
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-contract-form"
            disabled={isSubmitting}
            className="rounded-full bg-[#0069D3] hover:bg-[#0058b3] text-white text-xs font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
