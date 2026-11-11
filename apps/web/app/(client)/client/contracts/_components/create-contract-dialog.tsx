"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFormatter } from "next-intl";
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
import { getTodayDateInputValue, toEndOfDayIso } from "@/lib/format";
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

  // Khởi tạo dữ liệu form khi proposal thay đổi hoặc sheet mở
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

  const todayStr = getTodayDateInputValue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (!isBudgetValid) {
      toastError({ message: "Total contract budget must be greater than 0" });
      return;
    }

    if (!expiresAt) {
      toastError({ message: "Please select a contract end date" });
      return;
    }

    if (expiresAt < todayStr) {
      toastError({ message: "Contract end date cannot be in the past" });
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
      if (!m.dueDate) {
        toastError({
          message: `Please select a due date for Milestone ${i + 1}`,
        });
        return;
      }
      if (m.dueDate < todayStr) {
        toastError({
          message: `Milestone ${i + 1} due date cannot be in the past`,
        });
        return;
      }
      if (m.dueDate > expiresAt) {
        toastError({
          message: `Milestone ${i + 1} due date cannot exceed the contract end date`,
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
        expiresAt: toEndOfDayIso(expiresAt),
        milestones: milestones.map((m) => ({
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          amount: Number(m.amount),
          dueDate: toEndOfDayIso(m.dueDate),
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col gap-0 border-l border-border bg-background shadow-2xl z-50 font-sans"
      >
        <SheetHeader className="px-6 pr-12 py-5 border-b border-border/60 bg-background shrink-0 text-left">
          <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
            Create Contract & Hire Freelancer
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-0.5">
            Setup contract terms, budget, and milestones for{" "}
            <span className="font-semibold text-foreground">{jobTitle}</span>.
          </SheetDescription>
        </SheetHeader>

        {proposal ? (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Freelancer & Proposal Summary Row */}
              <div className="flex items-center justify-between pb-5 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 border border-border/60">
                    <AvatarImage
                      src={proposal.freelancer.avatarUrl || undefined}
                    />
                    <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                      {proposal.freelancer.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
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
                  <span className="text-base font-bold text-foreground font-mono">
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
                    Total Contract Budget (USD){" "}
                    <span className="text-red-500">*</span>
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
                      className="pl-9 h-10 text-sm rounded-xl font-medium border-border/70 focus-visible:ring-[#0069D3]"
                      placeholder="e.g. 500"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Client authorizes at least 1 milestone (or all) + 3% contract fee hold before signing; Freelancer is charged 5% per released milestone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Contract End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="date"
                      required
                      min={todayStr}
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="pl-9 h-10 text-sm rounded-xl border-border/70 focus-visible:ring-[#0069D3]"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Required contract expiration date. All milestones must be completed by this date.
                  </p>
                </div>
              </div>

              {/* Milestones Section */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      Contract Milestones
                      <span className="text-xs font-medium text-muted-foreground">
                        ({milestones.length})
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define deliverables and payment stages. Freelancer fee
                      (5%) applies upon release.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMilestone}
                    className="rounded-full h-8 text-xs font-semibold border-[#0069D3]/40 text-[#0069D3] hover:bg-[#0069D3]/5 gap-1 cursor-pointer shrink-0 transition-colors"
                  >
                    <Plus className="size-3.5" />
                    Add Milestone
                  </Button>
                </div>

                {/* Milestones List */}
                <div className="space-y-3">
                  {milestones.map((m, idx) => {
                    const isDateExceeding = Boolean(
                      expiresAt && m.dueDate && m.dueDate > expiresAt,
                    );

                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border/60 bg-background p-3.5 space-y-3 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 text-center">
                              {idx + 1}.
                            </span>
                            <Input
                              type="text"
                              required
                              value={m.title}
                              onChange={(e) =>
                                handleMilestoneChange(
                                  m.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder={`Milestone ${idx + 1} Title (required)`}
                              className="h-8 text-xs font-medium rounded-lg flex-1 border-border/70 focus-visible:ring-[#0069D3]"
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
                                className="pl-7 h-8 text-xs font-semibold rounded-lg text-right border-border/70 focus-visible:ring-[#0069D3]"
                              />
                            </div>

                            {milestones.length > 1 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMilestone(m.id)}
                                className="size-8 text-muted-foreground hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pl-6">
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
                              className="h-8 text-xs rounded-lg border-border/70 focus-visible:ring-[#0069D3]"
                            />
                          </div>
                          <div>
                            <Input
                              type="date"
                              required
                              min={todayStr}
                              max={expiresAt || undefined}
                              aria-label={`Milestone ${idx + 1} Due Date`}
                              value={m.dueDate}
                              onChange={(e) =>
                                handleMilestoneChange(
                                  m.id,
                                  "dueDate",
                                  e.target.value,
                                )
                              }
                              className={`h-8 text-xs rounded-lg focus-visible:ring-[#0069D3] ${
                                isDateExceeding
                                  ? "border-rose-500 text-rose-600 dark:text-rose-400"
                                  : "border-border/70"
                              }`}
                            />
                          </div>
                        </div>

                        {isDateExceeding && (
                          <p className="pl-6 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                            Due date cannot exceed contract end date ({expiresAt}).
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Milestones vs Budget Balance Status (No border, no background color) */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div
                    className={`flex items-center gap-1.5 font-medium ${
                      isAmountMatch
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
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
                  <div className="font-semibold text-foreground tabular-nums">
                    ${milestonesTotal.toLocaleString()} / $
                    {targetAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Terms / Scope of Work */}
              <div className="pt-4 border-t border-border/60">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Contract Terms & Scope of Work
                </label>
                <Textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="text-xs rounded-xl resize-none leading-relaxed border-border/70 focus-visible:ring-[#0069D3]"
                  placeholder="Describe deliverables, expectations, acceptance criteria..."
                />
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <SheetFooter className="px-6 py-4 border-t border-border/60 bg-background shrink-0 flex flex-row items-center justify-end gap-2.5 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="rounded-full text-xs font-medium h-9 px-5 border-border/80 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !isBudgetValid || !isAmountMatch}
                className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-9 px-6 shadow-xs cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 size-3.5" />
                )}
                Create & Hire Freelancer
              </Button>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
