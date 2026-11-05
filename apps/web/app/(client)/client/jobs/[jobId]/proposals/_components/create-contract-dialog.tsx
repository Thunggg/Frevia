"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormatter } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Calendar,
  DollarSign,
  FileText,
  Loader2,
} from "@/components/icons";
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { SubmittedProposalStatusType } from "@shared/types";

export interface ProposalForContract {
  id: number;
  status: SubmittedProposalStatusType;
  bidAmount: number;
  deliveryDays: number;
  coverLetter?: string;
  freelancer: {
    id: number;
    displayName: string;
    avatarUrl?: string | null;
    title?: string | null;
  };
}

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: ProposalForContract | null;
  jobId: number;
  jobTitle: string;
}

export function CreateContractDialog({
  open,
  onOpenChange,
  proposal,
  jobId,
  jobTitle,
}: CreateContractDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const format = useFormatter();

  const [totalAmount, setTotalAmount] = useState<number | "">(0);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [terms, setTerms] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo dữ liệu form khi proposal thay đổi hoặc dialog mở
  useEffect(() => {
    if (proposal && open) {
      const bid = Number(proposal.bidAmount) || 0;
      setTotalAmount(bid);
      setTerms(
        `Scope of work based on proposal for "${jobTitle}". All deliverables are subject to client review and approval.`,
      );
      setExpiresAt("");
    }
  }, [proposal, jobTitle, open]);

  const targetAmount = typeof totalAmount === "number" ? totalAmount : 0;
  const isBudgetValid = targetAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (!isBudgetValid) {
      toastError({ message: "Total contract budget must be greater than 0" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        proposalId: proposal.id,
        totalAmount: targetAmount,
        terms: terms.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const res = await contractApiRequest.create(payload);
      const contract = res.data;

      await queryClient.invalidateQueries({
        queryKey: ["client-job-proposals", jobId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contracts"],
      });

      toastSuccess({
        message:
          "Contract created successfully! Freelancer has been hired and proposal updated.",
      });

      onOpenChange(false);

      if (contract?.slug) {
        router.push(`/client/contracts/${contract.slug}`);
      } else {
        router.push("/client/contracts");
      }
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to create contract. Please check input and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-border bg-card p-6 shadow-2xl font-sans">
        <DialogHeader className="border-b border-border/60 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            Create Contract & Hire Freelancer
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Setup contract terms and budget for{" "}
            <span className="font-semibold text-foreground">{jobTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        {proposal ? (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Freelancer & Proposal Summary Card */}
            <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border border-border">
                  <AvatarImage src={proposal.freelancer.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {proposal.freelancer.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {proposal.freelancer.displayName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {proposal.freelancer.title || "Freelancer"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">
                  Proposal Bid
                </span>
                <span className="text-base font-extrabold text-foreground font-mono">
                  ${format.number(proposal.bidAmount)}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Est. {proposal.deliveryDays} days
                </span>
              </div>
            </div>

            {/* Budget & Expiration Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Total Contract Budget (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) =>
                      setTotalAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="pl-9 h-10 text-sm rounded-xl font-medium"
                    placeholder="e.g. 500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Platform fee (1%) will be calculated upon signing.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Contract Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="pl-9 h-10 text-sm rounded-xl"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Optional deadline for completion.
                </p>
              </div>
            </div>

            {/* Terms / Scope of Work */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Contract Terms & Scope of Work
              </label>
              <Textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="text-xs rounded-xl resize-none leading-relaxed"
                placeholder="Describe deliverables, expectations, acceptance criteria..."
              />
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="rounded-full text-xs font-medium h-9"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !isBudgetValid}
                className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-5 shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 size-3.5" />
                )}
                Create & Hire Freelancer
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
