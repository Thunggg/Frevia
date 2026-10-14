"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useState } from "react";

import { proposalApiRequest } from "@/apiRequests/proposal";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  CreateProposalBodySchema,
  SaveProposalDraftBodySchema,
  type CreateProposalBodyType,
  type SaveProposalDraftBodyType,
} from "@shared/types";

type ProposalDialogProps = {
  jobId: number;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProposalDialog({
  jobId,
  jobTitle,
  open,
  onOpenChange,
}: ProposalDialogProps) {
  const router = useRouter();
  const [action, setAction] = useState<"draft" | "submit" | null>(null);
  const form = useForm<CreateProposalBodyType>({
    resolver: zodResolver(
      CreateProposalBodySchema,
    ) as Resolver<CreateProposalBodyType>,
    defaultValues: {
      coverLetter: "",
      bidAmount: undefined,
      deliveryDays: undefined,
    },
  });

  const finish = (proposalId: number, message: string, redirect = true) => {
    toastSuccess({ message });
    onOpenChange(false);
    if (redirect) router.push(`/proposals/${proposalId}`);
    router.refresh();
  };
  const handleApiError = (error: unknown, fallback: string) => {
    if (error instanceof ApiFail && error.status === 409) {
      onOpenChange(false);
      toastError({
        message: "You already have a proposal for this job. Opening it now.",
      });
      void proposalApiRequest.getMyProposalForJob(jobId).then((proposal) => {
        if (proposal) router.push(`/proposals/${proposal.id}`);
        else router.refresh();
      });
      return;
    }

    if (error instanceof ApiFail)
      handleErrorApi({ error: error.response, setError: form.setError });
    else toastError({ message: fallback });
  };

  const saveDraft = async () => {
    const values = form.getValues();
    const body: SaveProposalDraftBodyType = {
      ...(values.coverLetter?.trim() && {
        coverLetter: values.coverLetter.trim(),
      }),
      ...(values.bidAmount !== undefined && { bidAmount: values.bidAmount }),
      ...(values.deliveryDays !== undefined && {
        deliveryDays: values.deliveryDays,
      }),
    };
    if (!Object.keys(body).length) {
      form.setError("coverLetter", {
        type: "manual",
        message: "Error.ProposalDraftContentRequired",
      });
      return;
    }

    const validation = SaveProposalDraftBodySchema.safeParse(body);
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === "coverLetter" ||
          field === "bidAmount" ||
          field === "deliveryDays"
        ) {
          form.setError(field, { type: "manual", message: issue.message });
        }
      });
      return;
    }

    setAction("draft");
    try {
      const response = await proposalApiRequest.saveDraft(
        jobId,
        validation.data,
      );
      finish(response.data.id, "Proposal saved as a draft", false);
    } catch (error) {
      handleApiError(error, "Unable to save your proposal. Please try again.");
    } finally {
      setAction(null);
    }
  };

  const submit = form.handleSubmit(async (body) => {
    setAction("submit");
    try {
      const response = await proposalApiRequest.create(jobId, body);
      finish(response.data.id, "Proposal submitted");
    } catch (error) {
      handleApiError(
        error,
        "Unable to submit your proposal. Please try again.",
      );
    } finally {
      setAction(null);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit a proposal</DialogTitle>
          <DialogDescription>
            Share your approach, fixed bid, and estimated delivery for{" "}
            {jobTitle}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="py-2">
          <FieldGroup className="gap-5">
            <Controller
              name="coverLetter"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Cover letter</FieldLabel>
                  <Textarea
                    {...field}
                    className="min-h-40 resize-y"
                    placeholder="Explain why you are a good fit for this project."
                    maxLength={5000}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="bidAmount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Your bid</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                      placeholder="15000000"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
              <Controller
                name="deliveryDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Delivery days</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                      placeholder="20"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={action !== null}
              onClick={() => void saveDraft()}
            >
              {action === "draft" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save draft
            </Button>
            <Button
              type="submit"
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              disabled={action !== null}
            >
              {action === "submit" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Submit proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
