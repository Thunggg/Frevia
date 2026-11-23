"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useBackendMessage } from "@/hooks/use-backend-message";
import { useTranslatedResolver } from "@/lib/form-resolver";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "@/components/icons";
import { Controller, useForm } from "react-hook-form";

import { proposalApiRequest } from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContractLifecyclePanel } from "@/components/contract-lifecycle-panel";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { useActionPermission } from "@/hooks/use-action-permission";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  CreateProposalBodySchema,
  ManageProposalMessage,
  SaveProposalDraftBodySchema,
  type CreateProposalBodyType,
  type ProposalDetailType,
  type SaveProposalDraftBodyType,
} from "@shared/types";
function isPast(value: string | Date | null) {
  return value !== null && new Date(value).getTime() <= Date.now();
}

export function ProposalDetailContent({
  proposal,
  embedded = false,
  basePath,
}: {
  proposal: ProposalDetailType;
  embedded?: boolean;
  basePath?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("proposalDetail");
  const tStatus = useTranslations("proposalStatus");
  const tList = useTranslations("proposals");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const translateMessage = useBackendMessage();
  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/proposals" : "/proposals");
  const jobBaseUrl = embedded ? "/freelancer/jobs" : "/job";

  const [action, setAction] = useState<"save" | "submit" | "withdraw" | null>(
    null,
  );
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { can } = useActionPermission();
  const canUpdateDraft = can("PATCH", "/api/proposals/:id/draft");
  const canSubmitDraft = can("PATCH", "/api/proposals/:id/submit");
  const canWithdraw = can("PATCH", "/api/proposals/:id/withdraw");
  const canUpdate = can("PATCH", "/api/proposals/:id");

  const isDraft = proposal.status === "DRAFT";
  // Freelancer chỉ rút được đề xuất đang chờ khách hàng xử lý.
  const isActionable = proposal.status === "SUBMITTED";
  const canEditDraft =
    isDraft &&
    proposal.job.status === "OPEN" &&
    !isPast(proposal.job.expiryDate) &&
    !isPast(proposal.job.deadline) &&
    (canUpdateDraft || canUpdate);

  const maxDaysFromDeadline = proposal.job.deadline
    ? Math.max(
      1,
      Math.ceil(
        (new Date(proposal.job.deadline).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000),
      ),
    )
    : undefined;
  const form = useForm<CreateProposalBodyType>({
    mode: "onChange",
    resolver: useTranslatedResolver<CreateProposalBodyType>(
      CreateProposalBodySchema,
    ),
    defaultValues: {
      coverLetter: proposal.coverLetter ?? "",
      bidAmount: proposal.bidAmount ?? undefined,
      deliveryDays: proposal.deliveryDays ?? undefined,
    },
  });

  const watchedBid = form.watch("bidAmount");
  const budgetMin =
    proposal.job.budgetMin !== null ? Number(proposal.job.budgetMin) : null;
  const budgetMax =
    proposal.job.budgetMax !== null ? Number(proposal.job.budgetMax) : null;
  const isBelowBudget =
    budgetMin !== null &&
    watchedBid !== undefined &&
    watchedBid !== null &&
    watchedBid > 0 &&
    watchedBid < budgetMin;
  const isAboveBudget =
    budgetMax !== null &&
    watchedBid !== undefined &&
    watchedBid !== null &&
    watchedBid > budgetMax;

  const draftBody = (): SaveProposalDraftBodyType => {
    const values = form.getValues();
    return {
      ...(values.coverLetter?.trim() && {
        coverLetter: values.coverLetter.trim(),
      }),
      ...(values.bidAmount !== undefined && { bidAmount: values.bidAmount }),
      ...(values.deliveryDays !== undefined && {
        deliveryDays: values.deliveryDays,
      }),
    };
  };

  const validateDraft = () => {
    const body = draftBody();
    if (
      maxDaysFromDeadline &&
      body.deliveryDays !== undefined &&
      body.deliveryDays > maxDaysFromDeadline
    ) {
      form.setError("deliveryDays", {
        type: "manual",
        message: t("deliveryExceedsDeadline", { days: maxDaysFromDeadline }),
      });
      return null;
    }

    const result = SaveProposalDraftBodySchema.safeParse(body);
    if (result.success) return result.data;

    const issue = result.error.issues[0];
    const field = issue?.path[0];
    form.setError(
      field === "bidAmount" ||
        field === "deliveryDays" ||
        field === "coverLetter"
        ? field
        : "coverLetter",
      {
        type: "manual",
        message: translateMessage(
          issue?.message ?? ManageProposalMessage.DRAFT_CONTENT_REQUIRED,
        ),
      },
    );
    return null;
  };

  const handleApiError = (error: unknown, fallback: string) => {
    if (error instanceof ApiFail) {
      handleErrorApi({ error: error.response, setError: form.setError });
      return;
    }
    toastError({ message: fallback });
  };

  const saveDraft = async () => {
    if (!canUpdateDraft && !canUpdate) {
      toastError({ message: t("noPermissionEditDraft") });
      return;
    }
    const body = validateDraft();
    if (!body) return;
    setAction("save");
    try {
      await proposalApiRequest.updateDraft(proposal.id, body);
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toastSuccess({ message: t("draftSaved") });
      router.refresh();
    } catch (error) {
      handleApiError(error, t("saveDraftFailed"));
    } finally {
      setAction(null);
    }
  };
  const submit = form.handleSubmit(async (body) => {
    if (!canSubmitDraft) {
      toastError({ message: t("noPermissionSubmitDraft") });
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
      await proposalApiRequest.updateDraft(proposal.id, body);
      await proposalApiRequest.submitDraft(proposal.id);
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toastSuccess({ message: t("submitted") });
      router.refresh();
    } catch (error) {
      handleApiError(error, t("submitFailed"));
    } finally {
      setAction(null);
    }
  });
  const withdraw = async () => {
    if (!canWithdraw) {
      toastError({ message: t("noPermissionWithdraw") });
      return;
    }
    setAction("withdraw");
    try {
      await proposalApiRequest.withdraw(proposal.id);
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toastSuccess({ message: t("withdrawn") });
      setWithdrawOpen(false);
      router.refresh();
    } catch (error) {
      handleApiError(error, t("withdrawFailed"));
    } finally {
      setAction(null);
    }
  };

  return (
    <div
      className={`flex flex-col bg-background font-sans ${embedded ? "min-h-0 flex-1" : "min-h-dvh"
        }`}
    >
      {!embedded && <Header role="FREELANCER" />}
      <main className="flex-1">
        <section
          className={
            embedded
              ? "border-b border-border bg-background"
              : "border-b border-[#0069D3]/15 bg-[#D0E1F8]/30 dark:border-white/10 dark:bg-[#111c2e]"
          }
        >
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href={effectiveBasePath}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-[#0069D3] transition-colors"
            >
              <ArrowLeft className="size-4" />
              {t("backToList")}
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="secondary">
                  {tStatus(proposal.status)}
                </Badge>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {proposal.job.title}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("clientLabel", {
                    name:
                      proposal.client.profile?.displayName ??
                      proposal.client.email,
                  })}
                </p>
              </div>
              <Link
                href={`${jobBaseUrl}/${proposal.job.slug}`}
                className="text-xs font-semibold text-[#0069D3] hover:underline"
              >
                {t("viewJob")}
              </Link>
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
          {proposal.status === "HIRED" ? (
            <div className="lg:col-span-2">
              <ContractLifecyclePanel
                proposalId={proposal.id}
                role="FREELANCER"
              />
            </div>
          ) : null}
          <section>
            <h2 className="text-xl font-semibold">{t("yourProposal")}</h2>
            <form onSubmit={submit} className="mt-5">
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
                        disabled={!canEditDraft || action !== null}
                        className="min-h-52"
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
                          <FieldLabel>{t("yourBid")}</FieldLabel>
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
                          type="text"
                          inputMode="decimal"
                          disabled={!canEditDraft || action !== null}
                          value={field.value ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(event) => {
                            let val = event.target.value.replace(/[^\d.]/g, "");
                            if (/^0\d/.test(val)) {
                              val = val.replace(/^0+/, "");
                              if (val === "") val = "0";
                            }
                            field.onChange(
                              val === "" ? undefined : Number(val),
                            );
                            if (form.formState.errors.bidAmount) {
                              form.clearErrors("bidAmount");
                            }
                          }}
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
                          <FieldLabel>{t("deliveryDaysInput")}</FieldLabel>
                          {proposal.job.deadline && maxDaysFromDeadline ? (
                            <span className="text-xs text-muted-foreground">
                              {t("deadlineHint", {
                                deadline: format.dateTime(
                                  new Date(proposal.job.deadline),
                                  { dateStyle: "medium" },
                                ),
                                days: maxDaysFromDeadline,
                              })}
                            </span>
                          ) : null}
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          disabled={!canEditDraft || action !== null}
                          value={field.value ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(event) => {
                            let val = event.target.value.replace(/[^\d]/g, "");
                            if (/^0\d/.test(val)) {
                              val = val.replace(/^0+/, "");
                              if (val === "") val = "0";
                            }
                            field.onChange(
                              val === "" ? undefined : Number(val),
                            );
                            if (form.formState.errors.deliveryDays) {
                              form.clearErrors("deliveryDays");
                            }
                          }}
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
              {canEditDraft ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {canUpdateDraft || canUpdate ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={action !== null}
                      onClick={() => void saveDraft()}
                    >
                      {action === "save" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {t("saveDraft")}
                    </Button>
                  ) : null}
                  {canSubmitDraft ? (
                    <Button
                      type="submit"
                      className="bg-[#0069D3] text-white hover:bg-[#005bb8]"
                      disabled={action !== null}
                    >
                      {action === "submit" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {t("submitProposal")}
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {isDraft && !canEditDraft ? (
                <p className="text-sm text-muted-foreground">
                  {t("draftLocked")}
                </p>
              ) : null}
            </form>
          </section>
          <aside className="h-fit rounded-xl border border-border p-5">
            <h2 className="font-semibold">{t("summaryTitle")}</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">{tList("bidLabel")}</dt>
                <dd className="mt-1 font-medium">
                  {proposal.bidAmount === null
                    ? tCommon("notSet")
                    : `$${format.number(proposal.bidAmount)}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {tList("deliveryLabel")}
                </dt>
                <dd className="mt-1 font-medium">
                  {proposal.deliveryDays
                    ? tList("deliveryDays", { count: proposal.deliveryDays })
                    : tCommon("notSet")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("submittedLabel")}
                </dt>
                <dd className="mt-1 font-medium">
                  {proposal.submittedAt
                    ? format.dateTime(new Date(proposal.submittedAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : tList("notSubmitted")}
                </dd>
              </div>
            </dl>
            {isActionable && canWithdraw ? (
              <Button
                variant="outline"
                className="mt-6 w-full text-destructive hover:text-destructive"
                onClick={() => setWithdrawOpen(true)}
              >
                {t("withdrawAction")}
              </Button>
            ) : null}
          </aside>
        </div>
      </main>
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("withdrawTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("withdrawHint")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={action === "withdraw"}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={action === "withdraw"}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void withdraw();
              }}
            >
              {action === "withdraw" ? t("withdrawing") : t("withdraw")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!embedded && <Footer />}
    </div>
  );
}
