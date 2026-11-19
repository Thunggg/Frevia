"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import {
  Calendar,
  FileText,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  FileEdit,
} from "lucide-react";
import { useActionPermission } from "@/hooks/use-action-permission";
import type { ContractDetailType, SharedFileType } from "@shared/types";
import type { MilestoneItemData } from "./manage-milestone-dialog";

interface ContractDocumentPaperProps {
  contract: ContractDetailType;
  pdfFile?: SharedFileType | null;
  isFreelancer?: boolean;
  basePath?: string;
  onEditContract?: () => void;
  onAddMilestone?: () => void;
  onEditMilestone?: (milestone: MilestoneItemData) => void;
  onDeleteMilestone?: (milestoneId: number, title: string) => void;
}

export function ContractDocumentPaper({
  contract,
  isFreelancer = false,
  basePath = "/client",
  onEditContract,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
}: ContractDocumentPaperProps) {
  const format = useFormatter();
  const t = useTranslations("contractWorkspace.paper");

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const clientName =
    contract.client?.profile?.displayName ||
    contract.client?.email?.split("@")[0] ||
    t("clientLabel");

  const freelancerName =
    contract.freelancer?.profile?.displayName ||
    contract.freelancer?.email?.split("@")[0] ||
    t("freelancerLabel");

  const clientEmail = contract.client?.email || "client@example.com";
  const freelancerEmail =
    contract.freelancer?.email || "freelancer@example.com";

  const totalAmount = Number(contract.totalAmount) || 0;
  const clientFeeAmount =
    Number(contract.clientPlatformFee) ||
    Number(contract.platformFee) ||
    Math.round(totalAmount * 0.03 * 100) / 100;
  const clientFeePercent =
    totalAmount > 0 ? Math.round((clientFeeAmount / totalAmount) * 100) : 3;

  // Formatted Contract ID like #CON-2025-1001
  const contractYear = contract.createdAt
    ? new Date(contract.createdAt).getFullYear()
    : 2025;
  const contractCode =
    contract.slug?.startsWith("CTR-") || contract.slug?.startsWith("CON-")
      ? `#${contract.slug}`
      : `#CON-${contractYear}-${String(contract.id).padStart(4, "0")}`;

  const hasRealMilestones = Boolean(
    contract.milestones && contract.milestones.length > 0,
  );

  // Find due date from milestones or contract expiresAt
  const milestones: MilestoneItemData[] = hasRealMilestones
    ? contract.milestones!.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      amount: Number(m.amount),
      dueDate: m.dueDate,
      status: m.status,
    }))
    : [
      {
        id: 0,
        title: contract.job?.title || t("fallbackMilestoneTitle"),
        description: contract.terms || t("fallbackMilestoneDesc"),
        amount: totalAmount,
        dueDate: contract.expiresAt || new Date(Date.now() + 14 * 86400000),
        status: "PENDING",
      },
    ];

  const latestMilestoneDueMs = milestones
    .map((m) => (m.dueDate ? new Date(m.dueDate).getTime() : 0))
    .reduce((max, t) => (t > max ? t : max), 0);

  const finalDueDate =
    latestMilestoneDueMs > 0
      ? new Date(latestMilestoneDueMs)
      : contract.expiresAt || new Date(Date.now() + 14 * 86400000);

  const { can } = useActionPermission();
  const canUpdateContract = can("PATCH", "/api/contracts/:id");
  const canCreateMilestone = can("POST", "/api/contracts/:contractId/milestones");
  const canUpdateMilestone = can("PATCH", "/api/contracts/:contractId/milestones/:id");
  const canDeleteMilestone = can("DELETE", "/api/contracts/:contractId/milestones/:id");
  const canViewMilestoneDetail = can("GET", "/api/contracts/:contractId/milestones/:id");

  const canEditMilestones =
    !isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT");

  const canEditContract =
    !isFreelancer &&
    (contract.status === "PENDING_SIGN" ||
      contract.status === "AWAITING_PAYMENT") &&
    canUpdateContract;

  return (
    <article className="relative bg-white text-zinc-900 border border-zinc-200/90 p-6 sm:p-12 md:p-14 font-sans max-w-4xl mx-auto selection:bg-zinc-200">
      {/* ── TOP HEADER ── */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-zinc-950">
        <div>
          <span className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans lowercase">
            frevia
          </span>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">
            {t("topHeader")}
          </p>
          <p className="font-mono text-xs font-semibold text-zinc-700 mt-0.5">
            {contractCode}
          </p>
        </div>
      </div>

      {/* ── TITLE & CREATED META ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-8 items-start">
        <div className="md:col-span-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
            {t("titleLine1")} <br />
            {t("titleLine2")}
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-600 mt-3 leading-relaxed max-w-xl">
            {t("intro")}
          </p>
        </div>

        <div className="md:col-span-4 border-l border-zinc-200 pl-6 space-y-4 my-auto">
          <div className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Calendar className="size-4" />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-zinc-500">
                {t("createdAt")}
              </span>
              <span className="block text-xs font-semibold text-zinc-900">
                {formatDate(contract.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Clock className="size-4" />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-zinc-500">
                {t("contractEndDate")}
              </span>
              <span className="block text-xs font-semibold text-zinc-900">
                {formatDate(contract.expiresAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <FileText className="size-4" />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-zinc-500">
                {t("version")}
              </span>
              <span className="block text-xs font-semibold text-zinc-900">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-7 text-xs sm:text-[13px] leading-relaxed text-zinc-700">
        {/* ── 1. PARTIES ── */}
        <section className="pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
            {t("sec1Title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                {t("clientLabel")}
              </span>
              <p className="text-sm font-bold text-zinc-950 mt-1">
                {clientName}
              </p>
              <p className="flex items-center gap-2 text-zinc-600 mt-1 text-xs">
                <Mail className="size-3 text-zinc-400" />
                <span>{clientEmail}</span>
              </p>
              <p className="flex items-center gap-2 text-zinc-600 mt-0.5 text-xs">
                <MapPin className="size-3 text-zinc-400" />
                <span>Ho Chi Minh City, Vietnam</span>
              </p>
            </div>

            {/* Freelancer */}
            <div className="md:border-l md:border-zinc-200 md:pl-6">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                {t("freelancerLabel")}
              </span>
              <p className="text-sm font-bold text-zinc-950 mt-1">
                {freelancerName}
              </p>
              <p className="flex items-center gap-2 text-zinc-600 mt-1 text-xs">
                <Mail className="size-3 text-zinc-400" />
                <span>{freelancerEmail}</span>
              </p>
              <p className="flex items-center gap-2 text-zinc-600 mt-0.5 text-xs">
                <MapPin className="size-3 text-zinc-400" />
                <span>Hanoi, Vietnam</span>
              </p>
            </div>
          </div>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 2. SCOPE AND DELIVERABLES ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
              {t("sec2Title")}
            </h2>
            {canEditContract && onEditContract && (
              <button
                type="button"
                onClick={onEditContract}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0069D3] hover:underline cursor-pointer"
              >
                <FileEdit className="size-3.5" />
                <span>{t("editScopeTerms")}</span>
              </button>
            )}
          </div>
          <p className="text-zinc-600 mb-3">{t("sec2Intro")}</p>

          <div className="border border-zinc-300 rounded-xs grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-300 text-xs">
            <div className="p-3">
              <span className="font-bold text-zinc-950">
                {t("jobTitleLabel")}{" "}
              </span>
              <span className="text-zinc-800">
                {contract.job?.title || t("defaultProjectTitle")}
              </span>
            </div>
            <div className="p-3">
              <span className="font-bold text-zinc-950">
                {t("deliverablesLabel")}{" "}
              </span>
              <span className="text-zinc-800">
                {contract.terms?.slice(0, 150) || t("defaultDeliverables")}
              </span>
            </div>
          </div>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 3. PRICE AND PAYMENT SCHEDULE (WITH MILESTONE ACTIONS) ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
              {t("sec3Title")}
            </h2>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {canEditMilestones && canCreateMilestone && onAddMilestone && (
                <button
                  type="button"
                  onClick={onAddMilestone}
                  className="w-full h-9 inline-flex items-center justify-center py-1 text-xs font-semibold text-[#0069D3] transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>{t("addMilestone")}</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-zinc-600 mb-3">
            {t("sec3Summary", {
              totalAmount: `$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              feePercent: clientFeePercent,
              feeAmount: `$${clientFeeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            })}
          </p>

          <div className="overflow-x-auto border border-zinc-300 rounded-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-300 text-zinc-900 font-semibold">
                  <th className="py-2.5 px-3 w-16 border-r border-zinc-300">
                    {t("colMilestone")}
                  </th>
                  <th className="py-2.5 px-3 border-r border-zinc-300">
                    {t("colDescription")}
                  </th>
                  <th className="py-2.5 px-3 w-28 border-r border-zinc-300">
                    {t("colAmount")}
                  </th>
                  <th className="py-2.5 px-3 w-28 border-r border-zinc-300">
                    {t("colDueDate")}
                  </th>
                  {canEditMilestones && (
                    <th className="py-2.5 px-3 w-20 text-center">
                      {t("colActions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {milestones.map((m, idx) => {
                  const isRealMilestone = Boolean(m.id && m.id > 0);
                  const isEditable =
                    canEditMilestones &&
                    isRealMilestone &&
                    m.status !== "COMPLETED";

                  return (
                    <tr key={m.id || idx} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 border-r border-zinc-200 font-mono text-zinc-800">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-zinc-200 text-zinc-800">
                        {isRealMilestone && canViewMilestoneDetail ? (
                          <Link
                            href={`${basePath}/contracts/${encodeURIComponent(contract.slug || String(contract.id))}/milestones/${m.id}`}
                            className="font-medium text-zinc-950 hover:text-[#0069D3] hover:underline transition-colors"
                          >
                            {m.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-zinc-950">{m.title}</p>
                        )}
                        {m.description && (
                          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                            {m.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border-r border-zinc-200 font-mono font-semibold text-zinc-900">
                        $
                        {Number(m.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 border-r border-zinc-200 text-zinc-600 font-mono text-[11px]">
                        {formatDate(m.dueDate)}
                      </td>

                      {/* Milestone Actions for Client */}
                      {canEditMilestones && (
                        <td className="py-2.5 px-3 text-center">
                          {isEditable ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {canUpdateMilestone && onEditMilestone && (
                                <button
                                  type="button"
                                  onClick={() => onEditMilestone(m)}
                                  title={t("editMilestoneTooltip")}
                                  className="flex size-6 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-[#0069D3] transition-colors cursor-pointer"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                              {canDeleteMilestone &&
                                onDeleteMilestone &&
                                !(
                                  contract.status === "PENDING_SIGN" &&
                                  contract.holdMilestoneIds?.includes(m.id)
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteMilestone(m.id, m.title)}
                                    title={t("deleteMilestoneTooltip")}
                                    className="flex size-6 items-center justify-center rounded-md text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 4. REVISIONS AND EXTRA WORK ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-1.5">
            {t("sec4Title")}
          </h2>
          <p className="text-zinc-600">{t("sec4Body")}</p>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 5. TIMELINE AND CLIENT DEPENDENCIES ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-1.5">
            {t("sec5Title")}
          </h2>
          <p className="text-zinc-600">
            {contract.expiresAt &&
              t("sec5EndDatePrefix", { endDate: formatDate(contract.expiresAt) })}
            {t("sec5Body", { dueDate: formatDate(finalDueDate) })}
          </p>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 6. OWNERSHIP ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-1.5">
            {t("sec6Title")}
          </h2>
          <p className="text-zinc-600">{t("sec6Body")}</p>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 7. DISPUTE RESOLUTION ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-1.5">
            {t("sec7Title")}
          </h2>
          <p className="text-zinc-600">{t("sec7Body")}</p>
        </section>

        <hr className="border-zinc-200" />

        {/* ── 8. SIGNATURES ── */}
        <section className="pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-1.5">
            {t("sec8Title")}
          </h2>
          <p className="text-zinc-600 mb-8">{t("sec8Intro")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center pt-4">
            {/* Client Signature */}
            <div className="flex flex-col items-center">
              <div className="w-56 border-t-2 border-zinc-900 pt-2 mb-1" />
              <p className="font-bold text-sm text-zinc-950">{clientName}</p>
              <p className="text-xs text-zinc-500">{t("clientLabel")}</p>
              {contract.signedByClient ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 mt-1 font-semibold">
                  <CheckCircle2 className="size-3.5" />
                  <span>
                    {t("signedDate", {
                      date: formatDate(
                        contract.clientSignedAt || contract.signedAt,
                      ),
                    })}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 mt-1 border border-dashed border-zinc-300 rounded px-2 py-0.5 bg-zinc-50">
                  <Clock className="size-3" />
                  <span>{t("pendingSignature")}</span>
                </div>
              )}
            </div>

            {/* Freelancer Signature */}
            <div className="flex flex-col items-center">
              <div className="w-56 border-t-2 border-zinc-900 pt-2 mb-1" />
              <p className="font-bold text-sm text-zinc-950">{freelancerName}</p>
              <p className="text-xs text-zinc-500">{t("freelancerLabel")}</p>
              {contract.signedByFreelancer ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 mt-1 font-semibold">
                  <CheckCircle2 className="size-3.5" />
                  <span>
                    {t("signedDate", {
                      date: formatDate(
                        contract.freelancerSignedAt || contract.signedAt,
                      ),
                    })}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 mt-1 border border-dashed border-zinc-300 rounded px-2 py-0.5 bg-zinc-50">
                  <Clock className="size-3" />
                  <span>{t("pendingSignature")}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
