"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  Link2,
  Loader2,
  MessageSquare,
  Paperclip,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
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
} from "@/app/(client)/_components/disputes/resolution-utils";

interface ExpertDisputeDetailProps {
  dispute: DisputeDetailType;
  onBack: () => void;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Clean, comprehensive Expert Dispute Detail view.
 * Displays all necessary case information on the left with full i18n and colored chat messages.
 * Simplified, focused binding decision panel on the right.
 */
export function ExpertDisputeDetail({
  dispute,
  onBack,
}: ExpertDisputeDetailProps) {
  const t = useTranslations("expertDisputes");
  const td = useTranslations("expertDisputes.dossier");
  const { formatDate, formatDateTime, getTypeLabel, translateStoredReason } =
    useResolutionHelpers();
  const { can } = useActionPermission();
  const queryClient = useQueryClient();

  const milestoneAmount = Number(dispute.milestone?.amount ?? 0);
  const isDecidableStatus =
    dispute.status === "UNDER_REVIEW" ||
    dispute.status === "DECISION_MADE" ||
    dispute.status === "REVIEW_REQUESTED";

  const canSubmitDecision =
    can("POST", "/api/expert/disputes/:id/decision") ||
    can("POST", "/api/expert/disputes/:id/final-decision");

  const [freelancerAmount, setFreelancerAmount] = useState<string>("0");
  const [clientAmount, setClientAmount] = useState<string>("0");
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
      setFreelancerAmount(Number(existingFl).toString());
      setClientAmount(Number(existingCl).toString());
    } else if (
      dispute.proposedFreelancerAmount !== null &&
      dispute.proposedFreelancerAmount !== undefined &&
      dispute.proposedClientAmount !== null &&
      dispute.proposedClientAmount !== undefined
    ) {
      setFreelancerAmount(Number(dispute.proposedFreelancerAmount).toString());
      setClientAmount(Number(dispute.proposedClientAmount).toString());
    } else {
      const half = roundCents(milestoneAmount / 2);
      setFreelancerAmount(half.toString());
      setClientAmount(roundCents(milestoneAmount - half).toString());
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
  const contractSlug =
    contract?.slug ||
    (dispute.milestone?.contractId
      ? String(dispute.milestone.contractId)
      : null);
  const contractCode = contractSlug
    ? contractSlug.startsWith("CTR-") || contractSlug.startsWith("CON-")
      ? `#${contractSlug}`
      : `#CON-${contractSlug}`
    : null;

  const jobTitle = contract?.job?.title;

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

  const formatPartyName = (party?: {
    email: string;
    profile?: { displayName?: string | null } | null;
  }) => {
    if (!party) return undefined;
    return party.profile?.displayName
      ? `${party.profile.displayName} (${party.email})`
      : party.email;
  };

  const clientDisplay = formatPartyName(clientParty);
  const freelancerDisplay = formatPartyName(freelancerParty);

  const resolveSenderInfo = (senderId: number) => {
    if (contract?.clientId === senderId) {
      return {
        role: t("clientLabel"),
        name: clientDisplay || dispute.openedBy?.email || t("clientLabel"),
        isClient: true,
        isFreelancer: false,
      };
    }
    if (contract?.freelancerId === senderId) {
      return {
        role: t("freelancerLabel"),
        name: freelancerDisplay || dispute.respondent?.email || t("freelancerLabel"),
        isClient: false,
        isFreelancer: true,
      };
    }
    return {
      role: t("parties"),
      name: `User #${senderId}`,
      isClient: false,
      isFreelancer: false,
    };
  };

  const handleFreelancerChange = (raw: string) => {
    if (raw === "") {
      setFreelancerAmount("");
      setClientAmount("");
      return;
    }
    let clean = raw.replace(/[^\d.]/g, "");
    if (/^0\d/.test(clean)) {
      clean = clean.replace(/^0+/, "");
      if (clean === "") clean = "0";
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setFreelancerAmount(clean);
      return;
    }
    const clamped = roundCents(Math.max(0, Math.min(milestoneAmount, parsed)));
    setFreelancerAmount(clean);
    setClientAmount(roundCents(milestoneAmount - clamped).toString());
  };

  const handleClientChange = (raw: string) => {
    if (raw === "") {
      setClientAmount("");
      setFreelancerAmount("");
      return;
    }
    let clean = raw.replace(/[^\d.]/g, "");
    if (/^0\d/.test(clean)) {
      clean = clean.replace(/^0+/, "");
      if (clean === "") clean = "0";
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setClientAmount(clean);
      return;
    }
    const clamped = roundCents(Math.max(0, Math.min(milestoneAmount, parsed)));
    setClientAmount(clean);
    setFreelancerAmount(roundCents(milestoneAmount - clamped).toString());
  };

  const handleFreelancerBlur = () => {
    if (freelancerAmount === "") {
      setFreelancerAmount("0");
      setClientAmount(milestoneAmount.toString());
    }
  };

  const handleClientBlur = () => {
    if (clientAmount === "") {
      setClientAmount("0");
      setFreelancerAmount(milestoneAmount.toString());
    }
  };

  const flNum = parseFloat(freelancerAmount) || 0;
  const clNum = parseFloat(clientAmount) || 0;
  const splitSum = roundCents(flNum + clNum);
  const isSplitValid =
    Math.round(splitSum * 100) === Math.round(milestoneAmount * 100) &&
    freelancerAmount !== "" &&
    clientAmount !== "";

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = AdminDisputeDecisionBodySchema.safeParse({
      freelancerAmount: flNum,
      clientAmount: clNum,
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
      await disputeApiRequest.expertMakeDecision(dispute.id, confirmation);
      setConfirmation(null);
      toastSuccess({ message: t("savedFinal") });
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

  const caseCode = `#RES-${String(dispute.id).padStart(4, "0")}`;
  const evidenceList = (dispute.evidences ?? []).filter(
    (ev) => ev.file?.fileUrl,
  );
  const submissions = dispute.milestone?.submissions ?? [];
  const milestoneFiles = dispute.milestone?.files ?? [];
  const conversationMessages = dispute.conversationMessages ?? [];

  return (
    <div className="space-y-6 font-sans mx-auto pb-16">
      {/* ── Top Bar: Back, Case Code & Escrow ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/30">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-0.5"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("back")}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {caseCode}
            </span>
            <span className="text-border/60">•</span>
            <span className="text-sm sm:text-base font-semibold text-foreground">
              {dispute.milestone?.title || `#${dispute.milestoneId}`}
            </span>
            {contractCode && (
              <span className="text-xs text-muted-foreground font-mono">
                ({contractCode})
              </span>
            )}
            <DisputeStatusBadge
              status={dispute.status}
              declinedAt={dispute.declinedAt}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              <span>{t("openedAt", { date: formatDateTime(dispute.createdAt) })}</span>
            </span>
            {dispute.escalatedAt && (
              <>
                <span className="text-border/60">•</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="size-3" />
                  <span>{t("escalatedAt", { date: formatDateTime(dispute.escalatedAt) })}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Escrow display */}
        <div className="text-left sm:text-right shrink-0">
          <span className="text-[11px] text-muted-foreground block">
            {t("colEscrow")}
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatResolutionCurrency(milestoneAmount)}
          </span>
        </div>
      </div>

      {/* ── 2-Column Arbitration Layout ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN (7 cols): Full context & facts to resolve the dispute */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Project & Milestone Context */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="size-3 text-muted-foreground" />
              <span>{t("projectMilestoneInfo")}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border-l-2 border-border/80 pl-3 py-1 space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">
                  {t("projectJob")}
                </span>
                <p className="font-medium text-foreground">
                  {jobTitle || t("projectFromContract")}
                </p>
                {contractCode && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {t("contractPrefix", { code: contractCode })}
                  </p>
                )}
              </div>

              <div className="border-l-2 border-border/80 pl-3 py-1 space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">
                  {t("milestoneAndEscrow")}
                </span>
                <p className="font-medium text-foreground tabular-nums">
                  {dispute.milestone?.title || `#${dispute.milestoneId}`} ·{" "}
                  {formatResolutionCurrency(milestoneAmount)}
                </p>
                {dispute.milestone?.dueDate && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{t("dueDatePrefix", { date: formatDate(dispute.milestone.dueDate) })}</span>
                  </p>
                )}
              </div>
            </div>

            {dispute.milestone?.description && (
              <div className="pt-1 text-xs text-muted-foreground">
                <span className="text-[11px] font-medium text-foreground block">
                  {td("milestoneScopeTitle")}:
                </span>
                <p className="whitespace-pre-wrap leading-relaxed mt-0.5">
                  {dispute.milestone.description}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Parties involved */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("parties")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border-l-2 border-border/80 pl-3 py-1 space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">
                  {t("clientLabel")}{" "}
                  {openerIsClient === true && (
                    <span className="text-foreground">({t("openerBadge")})</span>
                  )}
                  {openerIsClient === false && (
                    <span className="text-muted-foreground">({t("respondentBadge")})</span>
                  )}
                </span>
                <p className="font-medium text-foreground truncate">
                  {clientDisplay || dispute.openedBy?.email || "—"}
                </p>
              </div>

              <div className="border-l-2 border-border/80 pl-3 py-1 space-y-0.5">
                <span className="text-[11px] text-muted-foreground block">
                  {t("freelancerLabel")}{" "}
                  {openerIsClient === false && (
                    <span className="text-foreground">({t("openerBadge")})</span>
                  )}
                  {openerIsClient === true && (
                    <span className="text-muted-foreground">({t("respondentBadge")})</span>
                  )}
                </span>
                <p className="font-medium text-foreground truncate">
                  {freelancerDisplay || dispute.respondent?.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Claim Details */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("claimDetails")}
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs py-1">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("requestedType")}
                </span>
                <span className="font-medium text-foreground">
                  {getTypeLabel(dispute.resolutionType)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("proposedSplit")}
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  Client:{" "}
                  {formatResolutionCurrency(dispute.proposedClientAmount ?? 0)} ·{" "}
                  Freelancer:{" "}
                  {formatResolutionCurrency(
                    dispute.proposedFreelancerAmount ?? 0,
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  {t("claimReason")}
                </span>
                <p className="font-semibold text-foreground">
                  {translateStoredReason(dispute.reason)}
                </p>
              </div>

              {dispute.description && (
                <div className="pt-0.5">
                  <span className="text-[11px] text-muted-foreground block">
                    {t("claimDescription")}
                  </span>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-0.5">
                    {dispute.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Evidence Files */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Paperclip className="size-3 text-muted-foreground" />
              <span>{t("attachedEvidenceCount", { count: evidenceList.length })}</span>
            </h2>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {t("noEvidence")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {evidenceList.map((ev) => {
                  const isByOpener = ev.submittedById === dispute.openedById;
                  const submitterText = isByOpener
                    ? openerIsClient
                      ? t("clientLabel")
                      : t("freelancerLabel")
                    : openerIsClient
                      ? t("freelancerLabel")
                      : t("clientLabel");

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 text-xs transition-colors"
                    >
                      <a
                        href={ev.file!.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground hover:underline truncate min-w-0 flex-1 font-medium"
                      >
                        <FileText className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {ev.file?.fileName || t("fileFallback", { id: ev.id })}
                        </span>
                        <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                      </a>
                      <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-0.5 rounded-full bg-muted/60">
                        {submitterText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Counterparty Decline Reason (if declined) */}
          {dispute.declineReason && (
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                {t("declineReasonTitle")}
              </h2>
              <div className="border-l-2 border-rose-500/80 pl-3 py-1 space-y-1 text-xs">
                {dispute.declinedAt && (
                  <span className="text-[11px] text-muted-foreground block">
                    {formatDateTime(dispute.declinedAt)}
                  </span>
                )}
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {dispute.declineReason}
                </p>
              </div>
            </div>
          )}

          {/* Section 6: Milestone Submissions / Deliverables */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-3 text-muted-foreground" />
              <span>{td("tabSubmissions", { count: submissions.length })}</span>
            </h2>

            {submissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {td("noSubmissionsDesc")}
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, index) => (
                  <div
                    key={sub.id}
                    className="border-l-2 border-border/70 pl-3 py-1 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {td("submissionAttempt", {
                          number: submissions.length - index,
                        })}
                      </span>
                      <span>{formatDateTime(sub.submittedAt)}</span>
                    </div>

                    {sub.message && (
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-muted-foreground block">
                          {td("deliveryNote")}:
                        </span>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {sub.message}
                        </p>
                      </div>
                    )}

                    {sub.links && sub.links.length > 0 && (
                      <div className="space-y-0.5 pt-0.5">
                        <span className="text-[11px] text-muted-foreground block">
                          {td("deliveredLinks")}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sub.links.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-foreground hover:underline"
                            >
                              <Link2 className="size-3 text-muted-foreground" />
                              <span className="truncate max-w-[260px]">{link}</span>
                              <ExternalLink className="size-2.5 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.files && sub.files.length > 0 && (
                      <div className="space-y-0.5 pt-0.5">
                        <span className="text-[11px] text-muted-foreground block">
                          {td("deliveredFiles")}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map((item) => (
                            <a
                              key={item.file.id}
                              href={item.file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-foreground hover:underline"
                            >
                              <Paperclip className="size-3 text-muted-foreground" />
                              <span>
                                {item.file.fileName || t("fileFallback", { id: item.file.id })}
                              </span>
                              <ExternalLink className="size-2.5 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.changeRequestMessage && (
                      <div className="border-l-2 border-amber-500/80 pl-2.5 py-1 space-y-0.5 text-xs text-amber-900 dark:text-amber-200 mt-1">
                        <span className="font-medium text-[11px] block">
                          {td("clientChangeRequest")}:
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {sub.changeRequestMessage}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Milestone Initial Files (if any) */}
          {milestoneFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="size-3 text-muted-foreground" />
                <span>{t("milestoneAttachedFilesCount", { count: milestoneFiles.length })}</span>
              </h2>
              <div className="space-y-1.5">
                {milestoneFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 text-xs transition-colors"
                  >
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:underline truncate min-w-0 flex-1 font-medium"
                    >
                      <FileText className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {f.fileName || t("fileFallback", { id: f.id })}
                      </span>
                      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: Recent Conversation History with Color-Coded Participants */}
          {conversationMessages.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/30">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3 text-muted-foreground" />
                <span>{td("chatTitle")} ({conversationMessages.length})</span>
              </h2>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {conversationMessages.map((msg) => {
                  const sender = resolveSenderInfo(msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`
                        rounded-xl p-3 text-xs space-y-1.5 border transition-colors
                        ${
                          sender.isClient
                            ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40"
                            : sender.isFreelancer
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
                              : "bg-muted/20 border-border/50"
                        }
                      `}
                    >
                      {/* Message Header with Color-Coded Sender & Role Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`
                              inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                              ${
                                sender.isClient
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                                  : sender.isFreelancer
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                                    : "bg-muted text-muted-foreground"
                              }
                            `}
                          >
                            {sender.role}
                          </span>
                          <span
                            className={`
                              font-semibold truncate text-xs
                              ${
                                sender.isClient
                                  ? "text-blue-950 dark:text-blue-100"
                                  : sender.isFreelancer
                                    ? "text-emerald-950 dark:text-emerald-100"
                                    : "text-foreground"
                              }
                            `}
                          >
                            {sender.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>

                      {/* Message Content */}
                      {msg.message && (
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </p>
                      )}

                      {/* Attachment Button */}
                      {msg.fileUrl && (
                        <div className="pt-1">
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-background hover:bg-muted/40 text-[11px] text-foreground font-medium transition-colors"
                          >
                            <Paperclip className="size-3 text-muted-foreground" />
                            <span className="truncate max-w-[220px]">
                              {msg.fileName || t("attachedFile")}
                            </span>
                            <ExternalLink className="size-2.5 text-muted-foreground" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols, sticky): Simple, focused arbitration decision panel */}
        <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-6">
          {/* If already FINALIZED: Show clean summary */}
          {dispute.status === "FINALIZED" ? (
            <div className="space-y-3 border-l-2 border-emerald-500/80 pl-4 py-1 text-xs">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>{t("finalDecisionSummary")}</span>
                </span>
                {dispute.finalDecisionAt && (
                  <span className="text-[11px] text-muted-foreground block">
                    {formatDateTime(dispute.finalDecisionAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 py-1">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("clientAmount")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatResolutionCurrency(dispute.clientAmount ?? 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {t("freelancerAmount")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatResolutionCurrency(dispute.freelancerAmount ?? 0)}
                  </span>
                </div>
              </div>

              {dispute.decisionReason && (
                <div className="space-y-1 pt-1 border-t border-border/20">
                  <span className="text-[11px] text-muted-foreground block">
                    {t("reason")}
                  </span>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {dispute.decisionReason}
                  </p>
                </div>
              )}
            </div>
          ) : isDecidableStatus ? (
            /* Actionable Decision Form (Simplified: removed presets & visual bar) */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1 pb-2 border-b border-border/30">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Gavel className="size-4 text-foreground" />
                  <span>{t("finalDecision")}</span>
                </h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t("stage2Hint")}
                </p>
              </div>

              {/* Two Linked Numeric Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="clientDecisionAmount"
                    className="text-xs font-medium text-foreground"
                  >
                    {t("clientAmount")}
                  </Label>
                  <Input
                    id="clientDecisionAmount"
                    type="text"
                    inputMode="decimal"
                    value={clientAmount}
                    onChange={(e) => handleClientChange(e.target.value)}
                    onBlur={handleClientBlur}
                    className="h-8 text-xs tabular-nums font-medium bg-transparent border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="freelancerDecisionAmount"
                    className="text-xs font-medium text-foreground"
                  >
                    {t("freelancerAmount")}
                  </Label>
                  <Input
                    id="freelancerDecisionAmount"
                    type="text"
                    inputMode="decimal"
                    value={freelancerAmount}
                    onChange={(e) => handleFreelancerChange(e.target.value)}
                    onBlur={handleFreelancerBlur}
                    className="h-8 text-xs tabular-nums font-medium bg-transparent border-border/60"
                  />
                </div>
              </div>

              {!isSplitValid && (
                <p className="text-[11px] text-rose-600">
                  {t("splitMismatch", {
                    amount: formatResolutionCurrency(milestoneAmount),
                  })}
                </p>
              )}

              {/* Decision Reason Textarea */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="expertDecisionReason"
                  className="text-xs font-medium text-foreground"
                >
                  {t("reason")} <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="expertDecisionReason"
                  rows={5}
                  placeholder={t("reasonPlaceholder")}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="text-xs resize-none bg-transparent border-border/60"
                />
              </div>

              {/* Submit Decision Button */}
              <Button
                type="submit"
                disabled={
                  !isSplitValid ||
                  decisionReason.trim().length < 5 ||
                  pending ||
                  !canSubmitDecision
                }
                className="w-full h-8 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-medium cursor-pointer"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <Gavel className="size-3.5 mr-1.5" />
                )}
                <span>{t("finalDecision")}</span>
              </Button>
            </form>
          ) : (
            /* Read-only status info for WAITING_RESPONSE or CANCELLED */
            <div className="border-l-2 border-border/70 pl-3 py-1 space-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground block">
                {dispute.status === "WAITING_RESPONSE"
                  ? t("readOnlyWaiting")
                  : t("readOnlyCancelled")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent className="max-w-md font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              {t("confirmDecisionTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("confirmFinal")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmation && (
            <div className="py-2 space-y-2 text-xs border-y border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("confirmRefundClient")}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatResolutionCurrency(confirmation.clientAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("confirmPayFreelancer")}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatResolutionCurrency(confirmation.freelancerAmount)}
                </span>
              </div>
              <div className="pt-1 text-muted-foreground text-[11px] leading-relaxed">
                <strong className="text-foreground">{t("confirmReason")} </strong>
                {confirmation.decisionReason}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="h-8 rounded-full border-border/60 text-xs cursor-pointer hover:bg-muted/30">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => void handleConfirmDecision()}
              className="h-8 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-medium cursor-pointer"
            >
              {pending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
