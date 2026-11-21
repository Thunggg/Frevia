"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Gavel,
  Loader2,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Badge } from "@repo/ui/components/shadcn/badge";
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
  AdminDisputeDecisionBodySchema,
  type DisputeDetailType,
} from "@shared/types";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { useActionPermission } from "@/hooks/use-action-permission";
import {
  DisputeStatusBadge,
  formatResolutionCurrency,
  getDisputeApiErrorMessage,
  useResolutionHelpers,
} from "@/components/disputes/resolution-utils";
import { ExpertDisputeDossier } from "./expert-dispute-dossier";

interface ExpertDisputeDetailProps {
  dispute: DisputeDetailType;
  onBack: () => void;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function ExpertDisputeDetail({
  dispute,
  onBack,
}: ExpertDisputeDetailProps) {
  const t = useTranslations("expertDisputes");
  const { formatDate, formatDateTime, getTypeLabel } = useResolutionHelpers();
  const { can } = useActionPermission();
  const queryClient = useQueryClient();

  const milestoneAmount = Number(dispute.milestone?.amount ?? 0);
  const isFinalStage =
    dispute.status === "REVIEW_REQUESTED" ||
    dispute.status === "DECISION_MADE";
  const isDecidableStatus =
    dispute.status === "UNDER_REVIEW" ||
    dispute.status === "DECISION_MADE" ||
    dispute.status === "REVIEW_REQUESTED";

  const canSubmitDecision = isFinalStage
    ? can("POST", "/api/expert/disputes/:id/final-decision")
    : can("POST", "/api/expert/disputes/:id/decision");

  const [freelancerAmount, setFreelancerAmount] = useState<number>(0);
  const [clientAmount, setClientAmount] = useState<number>(0);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    freelancerAmount: number;
    clientAmount: number;
    decisionReason: string;
  } | null>(null);

  useEffect(() => {
    const existingFl = dispute.freelancerAmount;
    const existingCl = dispute.clientAmount;
    if (
      existingFl !== null &&
      existingFl !== undefined &&
      existingCl !== null &&
      existingCl !== undefined
    ) {
      setFreelancerAmount(Number(existingFl));
      setClientAmount(Number(existingCl));
    } else if (
      dispute.proposedFreelancerAmount !== null &&
      dispute.proposedFreelancerAmount !== undefined &&
      dispute.proposedClientAmount !== null &&
      dispute.proposedClientAmount !== undefined
    ) {
      setFreelancerAmount(Number(dispute.proposedFreelancerAmount));
      setClientAmount(Number(dispute.proposedClientAmount));
    } else {
      const half = roundCents(milestoneAmount / 2);
      setFreelancerAmount(half);
      setClientAmount(roundCents(milestoneAmount - half));
    }
    setDecisionReason(dispute.decisionReason ?? "");
  }, [
    dispute.id,
    dispute.status,
    dispute.freelancerAmount,
    dispute.clientAmount,
    dispute.proposedFreelancerAmount,
    dispute.proposedClientAmount,
    dispute.decisionReason,
    milestoneAmount,
  ]);

  const contract = dispute.milestone?.contract;
  const openerIsClient = contract
    ? dispute.openedById === contract.clientId
    : undefined;

  const clientParty =
    openerIsClient === true
      ? dispute.openedBy
      : openerIsClient === false
        ? dispute.respondent
        : undefined;
  const freelancerParty =
    openerIsClient === false
      ? dispute.openedBy
      : openerIsClient === true
        ? dispute.respondent
        : undefined;

  const formatPartyName = (
    party?: {
      email: string;
      profile?: { displayName?: string | null } | null;
    },
  ) => {
    if (!party) return undefined;
    return party.profile?.displayName
      ? `${party.profile.displayName} (${party.email})`
      : party.email;
  };

  const clientDisplay = formatPartyName(clientParty);
  const freelancerDisplay = formatPartyName(freelancerParty);

  const resolveUserLabel = (userId: number): string => {
    if (contract?.clientId === userId) {
      return clientDisplay
        ? `${t("clientLabel")} · ${clientDisplay}`
        : t("clientLabel");
    }
    if (contract?.freelancerId === userId) {
      return freelancerDisplay
        ? `${t("freelancerLabel")} · ${freelancerDisplay}`
        : t("freelancerLabel");
    }
    if (dispute.openedById === userId) {
      return formatPartyName(dispute.openedBy) || t("submittedBy", { id: userId });
    }
    if (dispute.respondentId === userId) {
      return (
        formatPartyName(dispute.respondent) || t("submittedBy", { id: userId })
      );
    }
    return t("submittedBy", { id: userId });
  };

  const handleFreelancerChange = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = roundCents(Math.max(0, Math.min(milestoneAmount, parsed)));
    setFreelancerAmount(clamped);
    setClientAmount(roundCents(milestoneAmount - clamped));
  };

  const handleClientChange = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = roundCents(Math.max(0, Math.min(milestoneAmount, parsed)));
    setClientAmount(clamped);
    setFreelancerAmount(roundCents(milestoneAmount - clamped));
  };

  const applyPreset = (freelancerShare: number) => {
    const fl = roundCents(milestoneAmount * freelancerShare);
    setFreelancerAmount(fl);
    setClientAmount(roundCents(milestoneAmount - fl));
  };

  const splitSum = roundCents(freelancerAmount + clientAmount);
  const isSplitValid =
    Math.round(splitSum * 100) === Math.round(milestoneAmount * 100);
  const freelancerPercent =
    milestoneAmount > 0
      ? Math.round((freelancerAmount / milestoneAmount) * 100)
      : 0;
  const clientPercent = 100 - freelancerPercent;

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = AdminDisputeDecisionBodySchema.safeParse({
      freelancerAmount,
      clientAmount,
      decisionReason: decisionReason.trim(),
    });
    if (!parsed.success || !isSplitValid) {
      toastError({ message: t("invalidDecision") });
      return;
    }
    setConfirmation(parsed.data);
  };

  const handleConfirmDecision = async () => {
    if (!confirmation) return;
    setPending(true);
    try {
      if (isFinalStage) {
        await disputeApiRequest.expertFinalDecision(dispute.id, confirmation);
      } else {
        await disputeApiRequest.expertMakeDecision(dispute.id, confirmation);
      }
      setConfirmation(null);
      toastSuccess({ message: t(isFinalStage ? "savedFinal" : "saved") });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expert-disputes"] }),
        queryClient.invalidateQueries({
          queryKey: ["expert-dispute", dispute.id],
        }),
      ]);
    } catch (err) {
      toastError({
        message: getDisputeApiErrorMessage(err, t("loadFailed")),
      });
    } finally {
      setPending(false);
    }
  };

  const caseCode = `RES-${String(dispute.id).padStart(4, "0")}`;

  return (
    <div className="space-y-5">
      {/* Top navigation & Case Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            {t("back")}
          </Button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
              <span className="font-mono text-muted-foreground text-base sm:text-lg">
                {caseCode}
              </span>
              <span>·</span>
              <span>{dispute.milestone?.title || `#${dispute.milestoneId}`}</span>
            </h1>
            <DisputeStatusBadge
              status={dispute.status}
              declinedAt={dispute.declinedAt}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {t("openedAt", { date: formatDateTime(dispute.createdAt) })}
            </span>
            {dispute.escalatedAt && (
              <span className="inline-flex items-center gap-1 text-[#0069D3] dark:text-sky-300">
                <ShieldAlert className="size-3.5" />
                {t("escalatedAt", { date: formatDateTime(dispute.escalatedAt) })}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-right shrink-0">
          <p className="text-[11px] text-muted-foreground">{t("colEscrow")}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {formatResolutionCurrency(milestoneAmount)}
          </p>
        </div>
      </div>

      {/* Main 2-column Arbitration Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT: Case Dossier, Claim, Evidence, Reviews */}
        <div className="space-y-5 lg:col-span-7">
          {/* Summary & Participants Card */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Scale className="size-4 text-muted-foreground" />
              {t("milestone")}
            </h2>

            <dl className="grid gap-3.5 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-1">
                <dt className="text-muted-foreground">{t("requestedType")}</dt>
                <dd className="font-medium text-foreground">
                  {getTypeLabel(dispute.resolutionType)}
                </dd>
              </div>

              {dispute.resolutionType === "EXTEND_DEADLINE" &&
              dispute.proposedDueDate ? (
                <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {t("proposedDueDate")}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(dispute.proposedDueDate)}
                  </dd>
                </div>
              ) : (
                <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-1">
                  <dt className="text-muted-foreground">{t("proposedSplit")}</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {t("clientLabel")}{" "}
                    {formatResolutionCurrency(
                      dispute.proposedClientAmount ??
                        (dispute.resolutionType === "FULL_RELEASE"
                          ? 0
                          : milestoneAmount),
                    )}{" "}
                    · {t("freelancerLabel")}{" "}
                    {formatResolutionCurrency(
                      dispute.proposedFreelancerAmount ??
                        (dispute.resolutionType === "FULL_RELEASE"
                          ? milestoneAmount
                          : 0),
                    )}
                  </dd>
                </div>
              )}

              <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 p-3 space-y-1">
                <dt className="flex items-center justify-between text-muted-foreground">
                  <span>{t("clientLabel")}</span>
                  {openerIsClient !== undefined && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {openerIsClient ? t("openerBadge") : t("respondentBadge")}
                    </Badge>
                  )}
                </dt>
                <dd className="font-medium text-foreground break-all">
                  {clientDisplay || dispute.openedBy?.email || "—"}
                </dd>
              </div>

              <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 p-3 space-y-1">
                <dt className="flex items-center justify-between text-muted-foreground">
                  <span>{t("freelancerLabel")}</span>
                  {openerIsClient !== undefined && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {openerIsClient ? t("respondentBadge") : t("openerBadge")}
                    </Badge>
                  )}
                </dt>
                <dd className="font-medium text-foreground break-all">
                  {freelancerDisplay || dispute.respondent?.email || "—"}
                </dd>
              </div>
            </dl>
          </section>

          {/* 4-Tab Case Dossier: Claim/Evidence, Submissions, Scope/Contract, Timeline/Chat */}
          <ExpertDisputeDossier
            dispute={dispute}
            resolveUserLabel={resolveUserLabel}
          />
        </div>

        {/* RIGHT: Sticky Expert Arbitration Panel */}
        <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-6">
          {/* Existing / Final Decision Summary */}
          {dispute.decisionReason && (
            <section className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  {dispute.status === "FINALIZED"
                    ? t("finalDecisionSummary")
                    : t("currentDecision")}
                </h2>
                {(dispute.finalDecisionAt || dispute.decisionAt) && (
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                    {formatDateTime(
                      dispute.finalDecisionAt ?? dispute.decisionAt,
                    )}
                  </span>
                )}
              </div>

              {dispute.freelancerAmount !== null &&
                dispute.freelancerAmount !== undefined && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl bg-white/80 dark:bg-zinc-950/60 border border-emerald-200/60 dark:border-emerald-900/50 p-2.5">
                      <span className="text-[11px] text-muted-foreground block">
                        {t("freelancerLabel")}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatResolutionCurrency(dispute.freelancerAmount)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-zinc-950/60 border border-emerald-200/60 dark:border-emerald-900/50 p-2.5">
                      <span className="text-[11px] text-muted-foreground block">
                        {t("clientLabel")}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatResolutionCurrency(dispute.clientAmount ?? 0)}
                      </span>
                    </div>
                  </div>
                )}

              <p className="text-xs whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">
                {dispute.decisionReason}
              </p>
            </section>
          )}

          {/* Decision Form (when decidable) */}
          {isDecidableStatus ? (
            canSubmitDecision ? (
              <form
                onSubmit={handleFormSubmit}
                className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isFinalStage
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-sky-50 text-[#0069D3] dark:bg-sky-950/60 dark:text-sky-300"
                    }`}
                  >
                    <Gavel className="size-3" />
                    {t(isFinalStage ? "stage2Badge" : "stage1Badge")}
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    {t(isFinalStage ? "finalDecision" : "decision")}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(isFinalStage ? "stage2Hint" : "stage1Hint")}
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(1)}
                    className="h-7 rounded-lg text-[11px] cursor-pointer"
                  >
                    {t("presetFreelancer")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0.5)}
                    className="h-7 rounded-lg text-[11px] cursor-pointer"
                  >
                    {t("presetSplit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0)}
                    className="h-7 rounded-lg text-[11px] cursor-pointer"
                  >
                    {t("presetClient")}
                  </Button>
                </div>

                {/* Visual Split Bar */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 flex">
                    <div
                      className="h-full bg-[#4fae2e] transition-all"
                      style={{ width: `${freelancerPercent}%` }}
                    />
                    <div
                      className="h-full bg-[#0069D3] transition-all"
                      style={{ width: `${clientPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                    <span>
                      {t("freelancerLabel")}: {freelancerPercent}%
                    </span>
                    <span>
                      {t("clientLabel")}: {clientPercent}%
                    </span>
                  </div>
                </div>

                {/* Auto-balancing Amount Inputs */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="expertFreelancerAmount"
                      className="text-xs font-medium"
                    >
                      {t("freelancerAmount")}
                    </Label>
                    <Input
                      id="expertFreelancerAmount"
                      type="number"
                      min={0}
                      max={milestoneAmount}
                      step="0.01"
                      required
                      value={freelancerAmount}
                      onChange={(e) => handleFreelancerChange(e.target.value)}
                      className="h-9 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="expertClientAmount"
                      className="text-xs font-medium"
                    >
                      {t("clientAmount")}
                    </Label>
                    <Input
                      id="expertClientAmount"
                      type="number"
                      min={0}
                      max={milestoneAmount}
                      step="0.01"
                      required
                      value={clientAmount}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="h-9 text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span
                    className={
                      isSplitValid
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-600"
                    }
                  >
                    {isSplitValid
                      ? t("splitTotal", {
                          total: formatResolutionCurrency(splitSum),
                          target: formatResolutionCurrency(milestoneAmount),
                        })
                      : t("splitMismatch", {
                          amount: formatResolutionCurrency(milestoneAmount),
                        })}
                  </span>
                </div>

                {/* Reasoning */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="expertDecisionReason"
                    className="text-xs font-medium"
                  >
                    {t("reason")}
                  </Label>
                  <Textarea
                    id="expertDecisionReason"
                    rows={4}
                    minLength={5}
                    maxLength={3000}
                    required
                    placeholder={t("reasonPlaceholder")}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    pending || !isSplitValid || decisionReason.trim().length < 5
                  }
                  className={`w-full h-9 rounded-lg text-xs cursor-pointer ${
                    isFinalStage
                      ? "bg-[#0069D3] hover:bg-[#0055b3] text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white"
                  }`}
                >
                  <Gavel className="mr-1.5 size-3.5" />
                  {t(isFinalStage ? "finalDecision" : "decision")}
                </Button>
              </form>
            ) : (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-5 text-xs text-muted-foreground flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{t("noDecisionPermission")}</span>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-5 text-xs text-muted-foreground flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                {dispute.status === "FINALIZED"
                  ? t("readOnlyFinalized")
                  : dispute.status === "CANCELLED"
                    ? t("readOnlyCancelled")
                    : t("readOnlyWaiting")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(isFinalStage ? "finalDecision" : "decision")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(isFinalStage ? "confirmFinal" : "confirmDecision")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmation && (
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("freelancerLabel")}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatResolutionCurrency(confirmation.freelancerAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("clientLabel")}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatResolutionCurrency(confirmation.clientAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                <span className="text-muted-foreground block mb-1">
                  {t("reason")}
                </span>
                <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {confirmation.decisionReason}
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDecision();
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
