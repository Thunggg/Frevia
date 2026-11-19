"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  History,
  Link2,
  MessageSquare,
  Paperclip,
  ScrollText,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import type { DisputeDetailType } from "@shared/types";
import {
  formatResolutionCurrency,
  useResolutionHelpers,
} from "@/components/disputes/resolution-utils";

type DossierTab = "claim" | "submissions" | "scope" | "timeline";

interface ExpertDisputeDossierProps {
  dispute: DisputeDetailType;
  resolveUserLabel: (userId: number) => string;
}

interface TimelineEvent {
  id: string;
  at: Date;
  label: string;
  detail?: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
}

export function ExpertDisputeDossier({
  dispute,
  resolveUserLabel,
}: ExpertDisputeDossierProps) {
  const t = useTranslations("expertDisputes");
  const td = useTranslations("expertDisputes.dossier");
  const { formatDate, formatDateTime, translateStoredReason } =
    useResolutionHelpers();

  const [activeTab, setActiveTab] = useState<DossierTab>("claim");

  const submissions = useMemo(
    () => dispute.milestone?.submissions ?? [],
    [dispute.milestone?.submissions],
  );
  const milestoneFiles = dispute.milestone?.files ?? [];
  const contract = dispute.milestone?.contract;
  const contractMilestones = contract?.milestones ?? [];
  const completedMilestoneCount = contractMilestones.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const messages = dispute.conversationMessages ?? [];
  const dueDateMs = dispute.milestone?.dueDate
    ? new Date(dispute.milestone.dueDate).getTime()
    : null;

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    if (contract?.signedAt) {
      events.push({
        id: "contract-signed",
        at: new Date(contract.signedAt),
        label: td("timelineContractSigned"),
        tone: "neutral",
      });
    }

    if (dispute.milestone?.dueDate) {
      events.push({
        id: "milestone-due",
        at: new Date(dispute.milestone.dueDate),
        label: td("timelineMilestoneDue"),
        tone: "info",
      });
    }

    const chronologicalSubmissions = [...submissions].reverse();
    chronologicalSubmissions.forEach((sub, idx) => {
      const attempt = idx + 1;
      events.push({
        id: `sub-${sub.id}`,
        at: new Date(sub.submittedAt),
        label: td("timelineSubmission", { number: attempt }),
        detail: sub.message || undefined,
        tone: "info",
      });
      if (sub.status === "CHANGES_REQUESTED" && sub.reviewedAt) {
        events.push({
          id: `sub-cr-${sub.id}`,
          at: new Date(sub.reviewedAt),
          label: td("timelineChangeRequest", { number: attempt }),
          detail: sub.changeRequestMessage || undefined,
          tone: "warning",
        });
      }
    });

    events.push({
      id: "dispute-opened",
      at: new Date(dispute.createdAt),
      label: td("timelineDisputeOpened"),
      detail: translateStoredReason(dispute.reason),
      tone: "warning",
    });

    if (dispute.declinedAt) {
      events.push({
        id: "dispute-declined",
        at: new Date(dispute.declinedAt),
        label: td("timelineDeclined"),
        detail: dispute.declineReason || undefined,
        tone: "danger",
      });
    }

    if (dispute.escalatedAt) {
      events.push({
        id: "dispute-escalated",
        at: new Date(dispute.escalatedAt),
        label: td("timelineEscalated"),
        tone: "info",
      });
    }

    if (dispute.decisionAt) {
      events.push({
        id: "dispute-decision",
        at: new Date(dispute.decisionAt),
        label: td("timelineDecisionProposed"),
        tone: "info",
      });
    }

    if (dispute.finalDecisionAt) {
      events.push({
        id: "dispute-finalized",
        at: new Date(dispute.finalDecisionAt),
        label: td("timelineFinalized"),
        tone: "success",
      });
    }

    return events.sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [contract?.signedAt, dispute, submissions, td, translateStoredReason]);

  const toneDotClass = (tone: TimelineEvent["tone"]) => {
    switch (tone) {
      case "success":
        return "bg-emerald-500";
      case "danger":
        return "bg-rose-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-[#0069D3]";
      default:
        return "bg-zinc-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* 4-Tab Pill Bar */}
      <div className="flex h-9 items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted scrollbar-none">
        {(
          [
            { key: "claim", label: td("tabClaim") },
            {
              key: "submissions",
              label: td("tabSubmissions", { count: submissions.length }),
            },
            { key: "scope", label: td("tabScope") },
            { key: "timeline", label: td("tabTimelineChat") },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex h-7 cursor-pointer items-center whitespace-nowrap rounded-full px-3 text-xs transition-all ${
                active
                  ? "bg-background font-medium text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Claim, Decline Reason, Evidence & Party Reviews */}
      {activeTab === "claim" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-sm font-medium text-foreground">
              {t("claimDetails")}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">
                  {resolveUserLabel(dispute.openedById)}
                </span>
                <span>{formatDateTime(dispute.createdAt)}</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {translateStoredReason(dispute.reason)}
              </p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground leading-relaxed">
                {dispute.description}
              </p>
            </div>

            {dispute.declineReason && (
              <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-rose-700 dark:text-rose-300">
                  <span className="font-medium">{t("declineReasonTitle")}</span>
                  {dispute.declinedAt && (
                    <span>{formatDateTime(dispute.declinedAt)}</span>
                  )}
                </div>
                <p className="text-xs whitespace-pre-wrap break-words text-rose-900 dark:text-rose-200 leading-relaxed">
                  {dispute.declineReason}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              {t("evidence")}
            </h2>

            {dispute.evidences && dispute.evidences.length > 0 ? (
              <div className="space-y-2.5">
                {dispute.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 p-3.5 space-y-1.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {resolveUserLabel(evidence.submittedById)}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {evidence.type === "RESPONSE"
                          ? t("evidenceResponse")
                          : t("evidenceClaim")}
                      </Badge>
                    </div>
                    {evidence.description && (
                      <p className="whitespace-pre-wrap break-words text-muted-foreground leading-relaxed">
                        {evidence.description}
                      </p>
                    )}
                    {evidence.file &&
                      /^https?:\/\//i.test(evidence.file.fileUrl) && (
                        <a
                          href={evidence.file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0069D3] hover:underline dark:text-sky-300 pt-0.5"
                        >
                          <ExternalLink className="size-3.5 shrink-0" />
                          <span className="break-all">
                            {evidence.file.fileName || t("openFile")}
                          </span>
                        </a>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("noEvidence")}</p>
            )}

            {dispute.decisionReviews && dispute.decisionReviews.length > 0 && (
              <div className="pt-4 border-t border-zinc-200/70 dark:border-zinc-800 space-y-2.5">
                <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-muted-foreground" />
                  {t("partyReviews")}
                </h3>
                <div className="space-y-2">
                  {dispute.decisionReviews.map((review) => {
                    const statusBadgeClass =
                      review.response === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : review.response === "REJECTED"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

                    return (
                      <div
                        key={review.id}
                        className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 p-3 text-xs space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {resolveUserLabel(review.userId)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass}`}
                          >
                            {review.response === "ACCEPTED" && (
                              <CheckCircle2 className="size-3" />
                            )}
                            {review.response === "REJECTED" && (
                              <XCircle className="size-3" />
                            )}
                            {t(`reviewStatuses.${review.response}`)}
                          </span>
                        </div>
                        {review.reason && (
                          <p className="whitespace-pre-wrap break-words text-muted-foreground leading-relaxed pt-0.5">
                            {review.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: Milestone Submissions & Change Requests */}
      {activeTab === "submissions" && (
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {submissions.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground mb-1">
                <Send className="size-4" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {td("noSubmissionsTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {td("noSubmissionsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, index) => {
                const attemptNumber = submissions.length - index;
                const submittedMs = new Date(sub.submittedAt).getTime();
                const isLate = dueDateMs !== null && submittedMs > dueDateMs;
                const statusKey =
                  sub.status === "APPROVED" ||
                  sub.status === "CHANGES_REQUESTED" ||
                  sub.status === "PENDING_REVIEW"
                    ? sub.status
                    : "PENDING_REVIEW";

                const statusClass =
                  statusKey === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : statusKey === "CHANGES_REQUESTED"
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                      : "bg-sky-50 text-[#0069D3] dark:bg-sky-950/50 dark:text-sky-300";

                return (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {td("submissionAttempt", { number: attemptNumber })}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}
                        >
                          {td(`submissionStatuses.${statusKey}`)}
                        </span>
                        {dueDateMs !== null && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              isLate
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            }`}
                          >
                            {isLate ? (
                              <AlertTriangle className="size-3" />
                            ) : (
                              <CheckCircle2 className="size-3" />
                            )}
                            {td(isLate ? "submittedLate" : "submittedOnTime")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(sub.submittedAt)}
                      </span>
                    </div>

                    {sub.message && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {td("deliveryNote")}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-foreground leading-relaxed">
                          {sub.message}
                        </p>
                      </div>
                    )}

                    {sub.links && sub.links.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <Link2 className="size-3" />
                          {td("deliveredLinks")}
                        </p>
                        <div className="space-y-1">
                          {sub.links.map((link, linkIdx) => (
                            <a
                              key={`${sub.id}-link-${linkIdx}`}
                              href={
                                /^https?:\/\//i.test(link)
                                  ? link
                                  : `https://${link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-[#0069D3] hover:underline dark:text-sky-300 break-all"
                            >
                              <ExternalLink className="size-3 shrink-0" />
                              <span>{link}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.files && sub.files.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <Paperclip className="size-3" />
                          {td("deliveredFiles")}
                        </p>
                        <div className="space-y-1">
                          {sub.files.map((item) => (
                            <a
                              key={item.file.id}
                              href={item.file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-[#0069D3] hover:underline dark:text-sky-300 break-all"
                            >
                              <FileText className="size-3 shrink-0" />
                              <span>
                                {item.file.fileName || t("openFile")}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.changeRequestMessage && (
                      <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-3 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                          <span className="font-medium">
                            {td("clientChangeRequest")}
                          </span>
                          {sub.reviewedAt && (
                            <span>{formatDateTime(sub.reviewedAt)}</span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap break-words text-amber-950 dark:text-amber-100 leading-relaxed">
                          {sub.changeRequestMessage}
                        </p>
                        {sub.changeRequestDueDate && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            {td("revisedDueDate", {
                              date: formatDate(sub.changeRequestDueDate),
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Scope & Contract Terms */}
      {activeTab === "scope" && (
        <div className="space-y-4">
          {/* Milestone Deliverable Scope */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <ScrollText className="size-4 text-muted-foreground" />
                {td("milestoneScopeTitle")}
              </h2>
              {dispute.milestone?.dueDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  <Calendar className="size-3" />
                  {td("milestoneDueDate")}:{" "}
                  <strong className="font-medium text-foreground">
                    {formatDate(dispute.milestone.dueDate)}
                  </strong>
                </span>
              )}
            </div>

            <p className="whitespace-pre-wrap break-words text-muted-foreground leading-relaxed">
              {dispute.milestone?.description || td("noScopeDesc")}
            </p>

            {milestoneFiles.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {td("milestoneFiles")}
                </p>
                <div className="space-y-1">
                  {milestoneFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#0069D3] hover:underline dark:text-sky-300 break-all"
                    >
                      <Paperclip className="size-3 shrink-0" />
                      <span>{file.fileName || t("openFile")}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Contract & Agreed Terms */}
          {contract && (
            <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
              <h2 className="text-sm font-medium text-foreground">
                {td("contractContextTitle")}
              </h2>

              <dl className="grid gap-3 sm:grid-cols-2">
                {contract.job?.title && (
                  <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-0.5 sm:col-span-2">
                    <dt className="text-[11px] text-muted-foreground">
                      {td("jobTitle")}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {contract.job.title}
                    </dd>
                  </div>
                )}
                {contract.totalAmount !== undefined && (
                  <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-0.5">
                    <dt className="text-[11px] text-muted-foreground">
                      {td("contractTotal")}
                    </dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatResolutionCurrency(contract.totalAmount)}
                    </dd>
                  </div>
                )}
                {contract.signedAt && (
                  <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-0.5">
                    <dt className="text-[11px] text-muted-foreground">
                      {td("contractSignedAt")}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(contract.signedAt)}
                    </dd>
                  </div>
                )}
                {contract.expiresAt && (
                  <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/40 p-3 space-y-0.5">
                    <dt className="text-[11px] text-muted-foreground">
                      {td("contractExpiresAt")}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(contract.expiresAt)}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {td("contractTerms")}
                </p>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 p-3.5 whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">
                  {contract.terms || td("noContractTerms")}
                </div>
              </div>

              {contractMilestones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {td("contractMilestones", {
                      completed: completedMilestoneCount,
                      total: contractMilestones.length,
                    })}
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                    {contractMilestones.map((m) => {
                      const isCurrent = m.id === dispute.milestoneId;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                            isCurrent ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="truncate font-medium text-foreground">
                              {m.title}
                            </span>
                            {isCurrent && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                              >
                                {td("currentDisputedBadge")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="tabular-nums font-medium text-foreground">
                              {formatResolutionCurrency(m.amount)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* TAB 4: Audit Timeline & Read-Only Direct Messages */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          {/* Audit Timeline */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              {td("timelineTitle")}
            </h2>

            <ol className="relative border-l border-zinc-200 dark:border-zinc-800 ml-2 space-y-4">
              {timelineEvents.map((ev) => (
                <li key={ev.id} className="pl-4 relative text-xs">
                  <span
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-white dark:ring-zinc-950 ${toneDotClass(ev.tone)}`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {ev.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDateTime(ev.at)}
                    </span>
                  </div>
                  {ev.detail && (
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                      {ev.detail}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* Read-only Chat History */}
          <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                {td("chatTitle")}
              </h2>
              {messages.length > 0 && (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                  {td("chatReadOnlyBadge", { count: messages.length })}
                </span>
              )}
            </div>

            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {td("noChatHistory")}
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {messages.map((msg) => {
                  const isClientMsg = contract?.clientId === msg.senderId;
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-3 text-xs space-y-1 ${
                        isClientMsg
                          ? "border-sky-200/70 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20"
                          : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-medium text-foreground">
                          {resolveUserLabel(msg.senderId)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.message && (
                        <p className="whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">
                          {msg.message}
                        </p>
                      )}
                      {msg.fileUrl && /^https?:\/\//i.test(msg.fileUrl) && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#0069D3] hover:underline dark:text-sky-300"
                        >
                          <Paperclip className="size-3 shrink-0" />
                          <span className="break-all">
                            {msg.fileName || td("chatAttachment")}
                          </span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
