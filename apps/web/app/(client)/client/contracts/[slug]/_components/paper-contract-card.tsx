"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Download, FileText, CheckCircle2, Clock } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ContractDetailType, SharedFileType } from "@shared/types";

interface PaperContractCardProps {
  contract: ContractDetailType;
  pdfFile?: SharedFileType | null;
  onViewFullTerms?: () => void;
}

export function PaperContractCard({
  contract,
  pdfFile,
  onViewFullTerms,
}: PaperContractCardProps) {
  const tRole = useTranslations("roleName");
  const format = useFormatter();

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
    contract.client?.email ||
    tRole("CLIENT");

  const freelancerName =
    contract.freelancer?.profile?.displayName ||
    contract.freelancer?.email ||
    tRole("FREELANCER");

  const totalAmount = Number(contract.totalAmount) || 0;
  const platformFee = Number(contract.platformFee) || totalAmount * 0.01;

  // Real or simulated download link for PDF
  const downloadUrl = pdfFile?.fileUrl || null;

  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs text-zinc-900 font-serif">
      {/* Paper aesthetic top stripe & header */}
      <div className="border-b border-zinc-200 pb-4 text-center">
        <span className="text-[10px] tracking-widest uppercase font-mono font-medium text-zinc-500 block">
          FREVIA SERVICE AGREEMENT
        </span>
        <h4 className="text-base font-bold font-sans uppercase tracking-wide text-zinc-900 mt-1">
          ELECTRONIC SERVICE AGREEMENT
        </h4>
        <div className="mt-1 flex items-center justify-center gap-2 font-mono text-[11px] text-zinc-500">
          <span>Contract ID: {contract.slug || `CTR-${contract.id}`}</span>
          <span>•</span>
          <span>Date: {formatDate(contract.createdAt)}</span>
        </div>
      </div>

      {/* Contract Core Meta in Paper Table style */}
      <div className="my-4 space-y-3 font-sans text-xs">
        {/* Project Title */}
        <div className="border-b border-zinc-100 pb-2">
          <span className="text-[11px] text-zinc-500 block">Scope of Work</span>
          <p className="font-semibold text-zinc-900 line-clamp-2">
            {contract.job?.title || "Professional Services Project"}
          </p>
        </div>

        {/* 2 Parties */}
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 pb-2">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
              Client (Party A)
            </span>
            <p className="font-bold text-zinc-900 mt-0.5">{clientName}</p>
            <span className="text-[10px] text-zinc-500">ID #{contract.clientId}</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
              Freelancer (Party B)
            </span>
            <p className="font-bold text-zinc-900 mt-0.5">{freelancerName}</p>
            <span className="text-[10px] text-zinc-500">ID #{contract.freelancerId}</span>
          </div>
        </div>

        {/* Financial info */}
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 pb-2">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
              Total Contract Value
            </span>
            <p className="text-sm font-bold text-zinc-900 font-mono">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
            </p>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
              Platform Fee (1%)
            </span>
            <p className="text-xs font-semibold text-zinc-700 font-mono">
              ${platformFee.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD / party
            </p>
          </div>
        </div>

        {/* Execution & Signature Stamps */}
        <div className="pt-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium mb-2">
            Signatures & Electronic Verification
          </span>
          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Client Signature Box */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-2.5 bg-zinc-50/50 flex flex-col items-center justify-center min-h-[70px]">
              <span className="text-[10px] text-zinc-500 mb-1">Party A (Client)</span>
              {contract.signedByClient ? (
                <div className="flex flex-col items-center text-emerald-700">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold border border-emerald-600/40 rounded px-1.5 py-0.5 bg-emerald-50">
                    <CheckCircle2 className="size-3" /> SIGNED
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">
                    {formatDate(contract.signedAt || contract.createdAt)}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-white">
                  <Clock className="size-3" /> PENDING
                </span>
              )}
            </div>

            {/* Freelancer Signature Box */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-2.5 bg-zinc-50/50 flex flex-col items-center justify-center min-h-[70px]">
              <span className="text-[10px] text-zinc-500 mb-1">Party B (Freelancer)</span>
              {contract.signedByFreelancer ? (
                <div className="flex flex-col items-center text-emerald-700">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold border border-emerald-600/40 rounded px-1.5 py-0.5 bg-emerald-50">
                    <CheckCircle2 className="size-3" /> SIGNED
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5">
                    {formatDate(contract.signedAt || contract.createdAt)}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-white">
                  <Clock className="size-3" /> PENDING
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paper Footer Action: Download or View Agreement */}
      <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between gap-2 font-sans">
        {downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 text-xs font-medium h-8 px-3 transition-colors"
          >
            <Download className="mr-1.5 size-3.5 text-zinc-700" />
            Download PDF Contract
          </a>
        ) : (
          <Button
            size="sm"
            onClick={onViewFullTerms}
            variant="outline"
            className="flex-1 rounded-xl border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 text-xs font-medium h-8"
          >
            <FileText className="mr-1.5 size-3.5 text-zinc-700" />
            View Terms & Conditions
          </Button>
        )}

        {onViewFullTerms && downloadUrl && (
          <Button
            size="sm"
            onClick={onViewFullTerms}
            variant="ghost"
            className="rounded-xl text-zinc-600 hover:text-zinc-900 text-xs font-medium h-8 px-2.5"
          >
            Details
          </Button>
        )}
      </div>
    </div>
  );
}
