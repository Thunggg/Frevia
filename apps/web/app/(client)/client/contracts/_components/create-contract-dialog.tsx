"use client";

import { useState, useEffect, useMemo } from "react";
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
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Trash2,
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

interface MilestoneInputItem {
  id: string;
  title: string;
  description: string;
  amount: number | "";
  dueDate: string;
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
  const [milestones, setMilestones] = useState<MilestoneInputItem[]>([]);
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

      // Mặc định tạo 1 milestone đầu tiên ứng với toàn bộ số tiền đề xuất
      setMilestones([
        {
          id: `m-${Date.now()}-1`,
          title: `${jobTitle} - Milestone 1`,
          description: "Project deliverables and completion",
          amount: bid,
          dueDate: "",
        },
      ]);
    }
  }, [proposal, jobTitle, open]);

  // Khi người dùng đổi totalAmount và chỉ có 1 milestone duy nhất, tự đồng bộ số tiền milestone
  const handleTotalAmountChange = (newVal: number | "") => {
    setTotalAmount(newVal);
    if (milestones.length === 1) {
      setMilestones((prev) => [
        {
          ...prev[0]!,
          amount: newVal === "" ? "" : newVal,
        },
      ]);
    }
  };

  // Tính tổng số tiền các milestones
  const milestonesTotal = useMemo(() => {
    return milestones.reduce((sum, item) => {
      const val = typeof item.amount === "number" ? item.amount : 0;
      return sum + val;
    }, 0);
  }, [milestones]);

  const targetAmount = typeof totalAmount === "number" ? totalAmount : 0;
  const isBudgetValid = targetAmount > 0;
  const isAmountMatch = Math.abs(milestonesTotal - targetAmount) < 0.01;
  const amountDiff = Math.round((targetAmount - milestonesTotal) * 100) / 100;

  const handleAddMilestone = () => {
    const nextIndex = milestones.length + 1;
    const remaining = amountDiff > 0 ? amountDiff : 0;

    setMilestones((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}-${nextIndex}`,
        title: `Milestone ${nextIndex}`,
        description: "",
        amount: remaining > 0 ? remaining : 0,
        dueDate: "",
      },
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMilestoneChange = (
    id: string,
    field: keyof MilestoneInputItem,
    value: string | number,
  ) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (!isBudgetValid) {
      toastError({ message: "Total contract budget must be greater than 0" });
      return;
    }

    if (!isAmountMatch) {
      toastError({
        message: `Total milestone amount ($${milestonesTotal}) must equal contract total budget ($${targetAmount})`,
      });
      return;
    }

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m) continue;
      if (!m.title.trim()) {
        toastError({ message: `Please enter a title for Milestone ${i + 1}` });
        return;
      }
      if (typeof m.amount !== "number" || m.amount <= 0) {
        toastError({
          message: `Milestone ${i + 1} amount must be greater than 0`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        proposalId: proposal.id,
        totalAmount: targetAmount,
        terms: terms.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        milestones: milestones.map((m) => ({
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          amount: Number(m.amount),
          dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined,
        })),
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-border bg-card p-6 shadow-2xl font-sans">
        <DialogHeader className="border-b border-border/60 pb-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            Create Contract & Hire Freelancer
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Setup contract terms, budget, and milestones for{" "}
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
                      handleTotalAmountChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="pl-9 h-10 text-sm rounded-xl font-medium"
                    placeholder="e.g. 500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Client fee (3%) will be collected when funding Milestone 1 deposit.
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

            {/* Milestones Section */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Contract Milestones
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {milestones.length}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Define deliverables and payment stages. Freelancer fee (5%) will be deducted upon each release.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                  className="rounded-full h-8 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add Milestone
                </Button>
              </div>

              {/* Milestones List */}
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <Input
                          type="text"
                          required
                          value={m.title}
                          onChange={(e) =>
                            handleMilestoneChange(m.id, "title", e.target.value)
                          }
                          placeholder={`Milestone ${idx + 1} Title (required)`}
                          className="h-8 text-xs font-medium rounded-lg flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-36">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            step="0.01"
                            required
                            value={m.amount}
                            onChange={(e) =>
                              handleMilestoneChange(
                                m.id,
                                "amount",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                              )
                            }
                            placeholder="Amount"
                            className="pl-7 h-8 text-xs font-semibold rounded-lg text-right"
                          />
                        </div>

                        {milestones.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMilestone(m.id)}
                            className="size-8 text-muted-foreground hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Input
                          type="text"
                          value={m.description}
                          onChange={(e) =>
                            handleMilestoneChange(
                              m.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Deliverables description (optional)"
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) =>
                            handleMilestoneChange(
                              m.id,
                              "dueDate",
                              e.target.value,
                            )
                          }
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones vs Budget Balance Status */}
              <div
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                  isAmountMatch
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isAmountMatch ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0" />
                  )}
                  <span>
                    {isAmountMatch
                      ? "Milestone amounts match total budget perfectly"
                      : amountDiff > 0
                        ? `Remaining to allocate: $${amountDiff.toLocaleString()}`
                        : `Milestones exceed budget by: $${Math.abs(amountDiff).toLocaleString()}`}
                  </span>
                </div>
                <div className="font-bold">
                  ${milestonesTotal.toLocaleString()} / $
                  {targetAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Terms / Scope of Work */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Contract Terms & Scope of Work
              </label>
              <Textarea
                rows={3}
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
                disabled={isSubmitting || !isBudgetValid || !isAmountMatch}
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
