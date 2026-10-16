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
import { DollarSign, Flag, Loader2 } from "@/components/icons";
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { MilestoneType } from "@shared/types";

interface CreateMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  maxAllowedAmount: number;
  milestoneToEdit?: MilestoneType | null;
  onSuccess?: () => void;
}

export function CreateMilestoneDialog({
  open,
  onOpenChange,
  contractId,
  maxAllowedAmount,
  milestoneToEdit,
  onSuccess,
}: CreateMilestoneDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title);
      setDescription(milestoneToEdit.description || "");
      setAmount(Number(milestoneToEdit.amount));
      setDueDate(
        milestoneToEdit.dueDate
          ? (new Date(milestoneToEdit.dueDate).toISOString().split("T")[0] ?? "")
          : "",
      );
    } else {
      setTitle("");
      setDescription("");
      setAmount(maxAllowedAmount > 0 ? maxAllowedAmount : 0);
      setDueDate("");
    }
  }, [milestoneToEdit, open, maxAllowedAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toastError({ message: "Please provide a milestone title" });
      return;
    }

    if (!amount || amount <= 0) {
      toastError({ message: "Milestone amount must be greater than 0" });
      return;
    }

    // When editing, the old amount is already part of the total, so available is maxAllowedAmount + oldAmount
    const currentMax = milestoneToEdit
      ? maxAllowedAmount + Number(milestoneToEdit.amount)
      : maxAllowedAmount;

    if (amount > currentMax) {
      toastError({
        message: `Milestone amount cannot exceed available budget ($${currentMax.toLocaleString()})`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let formattedDueDate: string | undefined = undefined;
      if (dueDate) {
        const d = new Date(dueDate);
        d.setHours(23, 59, 59, 999);
        formattedDueDate = d.toISOString();
      }

      const payload: {
        title: string;
        description?: string;
        amount: number;
        dueDate?: string;
      } = {
        title: title.trim(),
        amount: Number(amount),
      };

      if (description.trim()) {
        payload.description = description.trim();
      }
      if (formattedDueDate) {
        payload.dueDate = formattedDueDate;
      }

      if (milestoneToEdit) {
        await contractApiRequest.updateMilestone(
          contractId,
          milestoneToEdit.id,
          payload,
        );
        toastSuccess({ message: "Milestone updated successfully" });
      } else {
        await contractApiRequest.createMilestone(contractId, payload);
        toastSuccess({ message: "Milestone created successfully" });
      }

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      let errorMessage = "Failed to save milestone. Please try again.";
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
                <Flag className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {milestoneToEdit ? "Edit Milestone" : "Add New Milestone"}
              </SheetTitle>
            </div>
            <SheetDescription className="mt-1 text-xs text-muted-foreground">
              Break your contract into deliverable stages. Payments are released as each milestone is approved.
            </SheetDescription>
          </SheetHeader>

          <form id="milestone-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Milestone Title */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Milestone Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Prototype & Wireframes"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Available: ${maxAllowedAmount.toLocaleString()}
                </span>
              </div>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Target Completion Date (Optional)
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Deliverable Description / Criteria (Optional)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what is expected for this milestone to be completed..."
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
            form="milestone-form"
            disabled={isSubmitting}
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            {milestoneToEdit ? "Update Milestone" : "Save Milestone"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
