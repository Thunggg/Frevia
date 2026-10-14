"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { proposalApiRequest } from "@/apiRequests/proposal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
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
function statusLabel(status: ProposalDetailType["status"]) {
  return status[0] + status.slice(1).toLowerCase();
}

function isPast(value: string | Date | null) {
  return value !== null && new Date(value).getTime() <= Date.now();
}

export function ProposalDetailContent({
  proposal,
}: {
  proposal: ProposalDetailType;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"save" | "submit" | "withdraw" | null>(
    null,
  );
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const isDraft = proposal.status === "DRAFT";
  const isPending = proposal.status === "PENDING";
  const canEditDraft =
    isDraft &&
    proposal.job.status === "OPEN" &&
    !isPast(proposal.job.expiryDate) &&
    !isPast(proposal.job.deadline);
  const form = useForm<CreateProposalBodyType>({
    resolver: zodResolver(
      CreateProposalBodySchema,
    ) as Resolver<CreateProposalBodyType>,
    defaultValues: {
      coverLetter: proposal.coverLetter ?? "",
      bidAmount: proposal.bidAmount ?? undefined,
      deliveryDays: proposal.deliveryDays ?? undefined,
    },
  });

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
    const result = SaveProposalDraftBodySchema.safeParse(draftBody());
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
        message: issue?.message ?? ManageProposalMessage.DRAFT_CONTENT_REQUIRED,
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
    const body = validateDraft();
    if (!body) return;
    setAction("save");
    try {
      await proposalApiRequest.updateDraft(proposal.id, body);
      toastSuccess({ message: "Draft saved" });
      router.refresh();
    } catch (error) {
      handleApiError(error, "Unable to save draft. Please try again.");
    } finally {
      setAction(null);
    }
  };
  const submit = form.handleSubmit(async (body) => {
    setAction("submit");
    try {
      await proposalApiRequest.updateDraft(proposal.id, body);
      await proposalApiRequest.submitDraft(proposal.id);
      toastSuccess({ message: "Proposal submitted" });
      router.refresh();
    } catch (error) {
      handleApiError(error, "Unable to submit proposal. Please try again.");
    } finally {
      setAction(null);
    }
  });
  const withdraw = async () => {
    setAction("withdraw");
    try {
      await proposalApiRequest.withdraw(proposal.id);
      toastSuccess({ message: "Proposal withdrawn" });
      setWithdrawOpen(false);
      router.refresh();
    } catch (error) {
      handleApiError(error, "Unable to withdraw proposal. Please try again.");
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/proposals"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4fae2e]"
            >
              <ArrowLeft className="size-4" />
              My proposals
            </Link>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="secondary">
                  {statusLabel(proposal.status)}
                </Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {proposal.job.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Client:{" "}
                  {proposal.client.profile?.displayName ??
                    proposal.client.email}
                </p>
              </div>
              <Link
                href={`/job/${proposal.job.slug}`}
                className="text-sm font-medium text-[#4fae2e]"
              >
                View job
              </Link>
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
          <section>
            <h2 className="text-xl font-semibold">Your proposal</h2>
            <form onSubmit={submit} className="mt-5">
              <FieldGroup className="gap-5">
                <Controller
                  name="coverLetter"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Cover letter</FieldLabel>
                      <Textarea
                        {...field}
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
                        <FieldLabel>Your bid</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!canEditDraft || action !== null}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
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
                          disabled={!canEditDraft || action !== null}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? undefined
                                : Number(event.target.value),
                            )
                          }
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
                  <Button
                    type="button"
                    variant="outline"
                    disabled={action !== null}
                    onClick={() => void saveDraft()}
                  >
                    {action === "save" ? (
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
                </div>
              ) : null}
              {isDraft && !canEditDraft ? (
                <p className="text-sm text-muted-foreground">
                  This job is no longer accepting proposals, so this draft can
                  no longer be edited or submitted.
                </p>
              ) : null}
            </form>
          </section>
          <aside className="h-fit rounded-xl border border-border p-5">
            <h2 className="font-semibold">Proposal summary</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Bid</dt>
                <dd className="mt-1 font-medium">
                  {proposal.bidAmount === null
                    ? "Not set"
                    : `$${proposal.bidAmount.toLocaleString()}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="mt-1 font-medium">
                  {proposal.deliveryDays
                    ? `${proposal.deliveryDays} days`
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="mt-1 font-medium">
                  {proposal.submittedAt
                    ? new Date(proposal.submittedAt).toLocaleDateString()
                    : "Not submitted"}
                </dd>
              </div>
            </dl>
            {isPending ? (
              <Button
                variant="outline"
                className="mt-6 w-full text-destructive hover:text-destructive"
                onClick={() => setWithdrawOpen(true)}
              >
                Withdraw proposal
              </Button>
            ) : null}
          </aside>
        </div>
      </main>
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will no longer be able to accept this proposal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={action === "withdraw"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={action === "withdraw"}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void withdraw();
              }}
            >
              {action === "withdraw" ? "Withdrawing..." : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
