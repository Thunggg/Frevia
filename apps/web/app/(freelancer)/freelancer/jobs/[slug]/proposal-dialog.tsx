"use client";

import { useTranslatedResolver } from "@/lib/form-resolver";
import { useBackendMessage } from "@/hooks/use-backend-message";
import { Loader2 } from "@/components/icons";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
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
import { useActionPermission } from "@/hooks/use-action-permission";
import {
  CreateProposalBodySchema,
  SaveProposalDraftBodySchema,
  MAX_PROPOSAL_DELIVERY_DAYS,
  type CreateProposalBodyType,
  type SaveProposalDraftBodyType,
} from "@shared/types";

type ProposalDialogProps = {
  jobId: number;
  jobTitle: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  deadline?: Date | string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProposalDialog({
  jobId,
  jobTitle,
  budgetMin,
  budgetMax,
  deadline,
  open,
  onOpenChange,
}: ProposalDialogProps) {
  const router = useRouter();
  const t = useTranslations("jobProposal");
  const format = useFormatter();
  const translateMessage = useBackendMessage();
  const [action, setAction] = useState<"draft" | "submit" | null>(null);

  const { can } = useActionPermission();
  const canCreate = can("POST", "/api/proposals/jobs/:jobId");
  const canSaveDraft = can("POST", "/api/proposals/jobs/:jobId/drafts");

  const maxDaysFromDeadline = deadline
    ? Math.max(
        1,
        Math.ceil(
          (new Date(deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      )
    : undefined;

  const form = useForm<CreateProposalBodyType>({
    mode: "onChange",
    resolver: useTranslatedResolver<CreateProposalBodyType>(
      CreateProposalBodySchema,
    ),
    defaultValues: {
      coverLetter: "",
      bidAmount: undefined,
      deliveryDays: undefined,
    },
  });

  const watchedBid = form.watch("bidAmount");
  const isBelowBudget =
    budgetMin !== undefined &&
    budgetMin !== null &&
    watchedBid !== undefined &&
    watchedBid !== null &&
    watchedBid > 0 &&
    watchedBid < budgetMin;
  const isAboveBudget =
    budgetMax !== undefined &&
    budgetMax !== null &&
    watchedBid !== undefined &&
    watchedBid !== null &&
    watchedBid > budgetMax;

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
        message: t("alreadyExists"),
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
    if (!canSaveDraft) {
      toastError({ message: t("saveFailed") });
      return;
    }
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
        message: translateMessage("Error.ProposalDraftContentRequired"),
      });
      return;
    }

    if (
      maxDaysFromDeadline &&
      body.deliveryDays !== undefined &&
      body.deliveryDays > maxDaysFromDeadline
    ) {
      form.setError("deliveryDays", {
        type: "manual",
        message: t("deliveryExceedsDeadline", { days: maxDaysFromDeadline }),
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
          form.setError(field, {
            type: "manual",
            message: translateMessage(issue.message),
          });
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
      finish(response.data.id, t("draftSaved"), false);
    } catch (error) {
      handleApiError(error, t("saveFailed"));
    } finally {
      setAction(null);
    }
  };

  const submit = form.handleSubmit(async (body) => {
    if (!canCreate) {
      toastError({ message: t("submitFailed") });
      return;
    }

    if (maxDaysFromDeadline && body.deliveryDays > maxDaysFromDeadline) {
      form.setError("deliveryDays", {
        type: "manual",
        message: t("deliveryExceedsDeadline", { days: maxDaysFromDeadline }),
      });
      return;
    }
    setAction("submit");
    try {
      const response = await proposalApiRequest.create(jobId, body);
      finish(response.data.id, t("submitted"));
    } catch (error) {
      handleApiError(error, t("submitFailed"));
    } finally {
      setAction(null);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { jobTitle })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="py-2">
          <FieldGroup className="gap-5">
            <Controller
              name="coverLetter"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("coverLetter")}</FieldLabel>
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (form.formState.errors.coverLetter) {
                        form.clearErrors("coverLetter");
                      }
                    }}
                    className="min-h-40 resize-y"
                    placeholder={t("coverLetterPlaceholder")}
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
                    <div className="flex flex-col gap-0.5">
                      <FieldLabel>{t("bid")}</FieldLabel>
                      {budgetMin || budgetMax ? (
                        <span className="text-xs text-muted-foreground">
                          {t("budgetHint", {
                            range:
                              budgetMin && budgetMax
                                ? `${format.number(budgetMin)} - ${format.number(budgetMax)}`
                                : budgetMin
                                  ? `>= ${format.number(budgetMin)}`
                                  : `<= ${format.number(budgetMax!)}`,
                          })}
                        </span>
                      ) : null}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        );
                        if (form.formState.errors.bidAmount) {
                          form.clearErrors("bidAmount");
                        }
                      }}
                      placeholder="15000000"
                      aria-invalid={fieldState.invalid}
                    />
                    {isBelowBudget ? (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ {t("bidBelowMin", { min: format.number(budgetMin!) })}
                      </p>
                    ) : null}
                    {isAboveBudget ? (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ {t("bidAboveMax", { max: format.number(budgetMax!) })}
                      </p>
                    ) : null}
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
                    <div className="flex flex-col gap-0.5">
                      <FieldLabel>{t("deliveryDays")}</FieldLabel>
                      {deadline && maxDaysFromDeadline ? (
                        <span className="text-xs text-muted-foreground">
                          {t("deadlineHint", {
                            deadline: format.dateTime(new Date(deadline), {
                              dateStyle: "medium",
                            }),
                            days: maxDaysFromDeadline,
                          })}
                        </span>
                      ) : null}
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max={
                        maxDaysFromDeadline
                          ? Math.min(
                              MAX_PROPOSAL_DELIVERY_DAYS,
                              maxDaysFromDeadline,
                            )
                          : MAX_PROPOSAL_DELIVERY_DAYS
                      }
                      step="1"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        );
                        if (form.formState.errors.deliveryDays) {
                          form.clearErrors("deliveryDays");
                        }
                      }}
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
            {canSaveDraft ? (
              <Button
                type="button"
                variant="outline"
                disabled={action !== null}
                onClick={() => void saveDraft()}
              >
                {action === "draft" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {t("saveDraft")}
              </Button>
            ) : null}
            {canCreate ? (
              <Button
                type="submit"
                className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                disabled={action !== null}
              >
                {action === "submit" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {t("submit")}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
