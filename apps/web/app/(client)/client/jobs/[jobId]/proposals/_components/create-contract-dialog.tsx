"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: number;
  jobId: number;
  jobTitle?: string;
  freelancerName: string;
  bidAmount: number;
  deliveryDays?: number;
}

export function CreateContractDialog({
  open,
  onOpenChange,
  proposalId,
  jobId,
  jobTitle = "this job",
  freelancerName,
  bidAmount,
  deliveryDays,
}: CreateContractDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [totalAmount, setTotalAmount] = useState<number>(bidAmount || 0);
  const [terms, setTerms] = useState<string>(
    `Contract for "${jobTitle}". Work will be executed according to the submitted proposal${
      deliveryDays ? ` with expected delivery within ${deliveryDays} days` : ""
    }. Milestones will outline specific deliverables and payment release criteria.`,
  );
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if bidAmount changes
  useState(() => {
    if (bidAmount) setTotalAmount(bidAmount);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalAmount || totalAmount <= 0) {
      toastError({ message: "Contract total amount must be greater than 0" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        proposalId: number;
        totalAmount: number;
        terms?: string;
        expiresAt?: string;
      } = {
        proposalId,
        totalAmount: Number(totalAmount),
        terms: terms.trim() || undefined,
      };

      if (expiresAt) {
        const d = new Date(expiresAt);
        d.setHours(23, 59, 59, 999);
        payload.expiresAt = d.toISOString();
      }

      const res = await contractApiRequest.create(payload);
      const contract = extractContractData(res);

      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });

      toastSuccess({ message: "Contract created successfully!" });
      onOpenChange(false);
      router.push(`/client/contracts/${contract.id}`);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to create contract. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
      >
        <div>
          <SheetHeader>
            <div className="flex items-center gap-2 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                <FileText className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Hire & Create Contract
              </SheetTitle>
            </div>
            <SheetDescription className="mt-1 text-xs text-muted-foreground">
              Set up the formal agreement terms with{" "}
              <span className="font-semibold text-foreground">
                {freelancerName}
              </span>
              . Once created, both parties can sign and fund milestones.
            </SheetDescription>
          </SheetHeader>

          <form id="create-contract-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Contract Amount */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Contract Total Budget (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={totalAmount || ""}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Defaulted to freelancer&apos;s proposed bid (${bidAmount.toLocaleString()}).
              </p>
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

            {/* Terms & Scope */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Terms of Engagement & Scope
              </label>
              <textarea
                rows={6}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Outline specific terms, expectations, and milestones..."
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
            form="create-contract-form"
            disabled={isSubmitting}
            className="rounded-full bg-[#0069D3] hover:bg-[#0058b3] text-white text-xs font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 size-3.5" />
            )}
            Create & Proceed to Contract
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
