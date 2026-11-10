"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Flag, Loader2 } from "lucide-react";
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
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import {
  getTodayDateInputValue,
  toDateInputValue,
  toEndOfDayIso,
} from "@/lib/format";

export interface MilestoneItemData {
  id: number;
  title: string;
  description?: string | null;
  amount: number;
  dueDate?: Date | string | null;
  status?: string;
}

interface ManageMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  totalContractAmount: number;
  currentAllocatedAmount: number;
  contractExpiresAt?: Date | string | null;
  milestoneToEdit?: MilestoneItemData | null;
  onSuccess?: () => void;
}

export function ManageMilestoneDialog({
  open,
  onOpenChange,
  contractId,
  totalContractAmount,
  currentAllocatedAmount,
  contractExpiresAt,
  milestoneToEdit,
  onSuccess,
}: ManageMilestoneDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = getTodayDateInputValue();
  const contractEndDateStr = toDateInputValue(contractExpiresAt);

  // Remaining budget available to allocate
  const unallocatedAmount = Math.max(
    0,
    totalContractAmount - currentAllocatedAmount,
  );
  const maxAvailable = milestoneToEdit
    ? unallocatedAmount + Number(milestoneToEdit.amount)
    : unallocatedAmount;

  useEffect(() => {
    if (open) {
      if (milestoneToEdit) {
        setTitle(milestoneToEdit.title);
        setDescription(milestoneToEdit.description || "");
        setAmount(Number(milestoneToEdit.amount));
        setDueDate(toDateInputValue(milestoneToEdit.dueDate));
      } else {
        setTitle("");
        setDescription("");
        setAmount(maxAvailable > 0 ? maxAvailable : 0);
        setDueDate("");
      }
    }
  }, [milestoneToEdit, open, maxAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toastError({ message: "Milestone title is required." });
      return;
    }

    if (!amount || amount <= 0) {
      toastError({ message: "Amount must be greater than 0." });
      return;
    }

    if (maxAvailable > 0 && amount > maxAvailable) {
      toastError({
        message: `Milestone amount cannot exceed available contract balance of $${maxAvailable.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
      });
      return;
    }

    if (!contractExpiresAt) {
      toastError({
        message:
          "Please set a contract end date before adding or updating milestones.",
      });
      return;
    }

    if (!dueDate) {
      toastError({ message: "Milestone due date is required." });
      return;
    }

    if (dueDate < todayStr) {
      toastError({ message: "Milestone due date cannot be in the past." });
      return;
    }

    if (contractEndDateStr && dueDate > contractEndDateStr) {
      toastError({
        message: `Milestone due date cannot exceed the contract end date (${contractEndDateStr}).`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDueDate = toEndOfDayIso(dueDate);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        dueDate: formattedDueDate,
      };

      if (milestoneToEdit) {
        await contractApiRequest.updateMilestone(
          contractId,
          milestoneToEdit.id,
          payload,
        );
        toastSuccess({ message: "Milestone updated successfully!" });
      } else {
        await contractApiRequest.createMilestone(contractId, payload);
        toastSuccess({ message: "Milestone created successfully!" });
      }

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["milestone-detail", contractId],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      let errorMessage = "Failed to save milestone. Please try again.";
      if (error instanceof ApiFail) {
        const errResp = error.response as unknown as Record<string, unknown>;
        if (typeof errResp?.message === "string") {
          errorMessage = errResp.message;
        } else if (
          typeof errResp?.error === "object" &&
          errResp.error !== null &&
          "message" in errResp.error
        ) {
          errorMessage = String((errResp.error as { message: string }).message);
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
        className="w-full sm:max-w-md overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#0069D3]/10">
                <Flag className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {milestoneToEdit ? "Edit Milestone" : "Add New Milestone"}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400 mt-0.5">
                  {milestoneToEdit
                    ? "Update milestone scope, budget allocation, or deadline."
                    : "Break down your contract work into deliverable stages."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form id="manage-milestone-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Milestone Title */}
            <div>
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Milestone Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Landing Page & UI components"
                className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#0069D3] focus:outline-hidden"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Amount (USD) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Available: ${maxAvailable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 focus:border-[#0069D3] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                {contractEndDateStr && (
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Max: {contractEndDateStr}
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                min={todayStr}
                max={contractEndDateStr || undefined}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`mt-1.5 w-full rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-[#0069D3] focus:outline-hidden ${
                  contractEndDateStr && dueDate && dueDate > contractEndDateStr
                    ? "border-rose-500 text-rose-600 dark:text-rose-400"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              />
              {!contractExpiresAt ? (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  Please set a contract end date before adding or updating milestones.
                </p>
              ) : contractEndDateStr && dueDate && dueDate > contractEndDateStr ? (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  Milestone due date cannot exceed contract end date ({contractEndDateStr}).
                </p>
              ) : null}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Description & Deliverables
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe deliverables required for this milestone..."
                className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#0069D3] focus:outline-hidden resize-none leading-relaxed"
              />
            </div>
          </form>
        </div>

        <SheetFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs h-8 px-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="manage-milestone-form"
            disabled={isSubmitting}
            className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {milestoneToEdit ? "Update Milestone" : "Add Milestone"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
