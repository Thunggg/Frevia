"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Calendar, FileText } from "@/components/icons";
import type { ContractDetailType } from "@shared/types";
import {
  CONTRACT_STATUSES,
  getStatusBadgeConfig,
} from "./contract-status-badge";

export interface ContractCardProps {
  contract: ContractDetailType;
  basePath: string;
  formatDate: (date: string | Date | null) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tStatus: (status: string) => string;
  index: number;
}

export function ContractCard({
  contract,
  basePath,
  formatDate,
  t,
  tStatus,
  index,
}: ContractCardProps) {
  const badgeClass = getStatusBadgeConfig(contract.status);

  const statusLabel = (
    CONTRACT_STATUSES as readonly string[]
  ).includes(contract.status)
    ? tStatus(contract.status)
    : contract.status;

  const contractHref = `${basePath}/contracts/${contract.slug || contract.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.25),
      }}
      className="
        group overflow-hidden rounded-md
        border border-border/70 bg-card
        shadow-xs transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      <Link href={contractHref} className="block focus:outline-none">
        {/* Document Preview */}
        <div className="
          flex h-[190px] items-center justify-center
          overflow-hidden bg-[#F0F1F3] p-4
          dark:bg-muted/50
        ">
          {/* White Contract Paper */}
          <div className="
            relative h-full w-[68%] max-w-[190px]
            overflow-hidden bg-white
            px-3 py-2.5 shadow-xs
            transition-transform duration-300
            group-hover:scale-[1.03]
          ">
            {/* Document Header */}
            <div className="
              flex items-center justify-between
              border-b border-gray-300 pb-1.5
            ">
              <span className="
                text-[8px] font-bold
                tracking-tight text-gray-900
              ">
                frevia
              </span>

              <span className="
                text-[4px] font-semibold
                text-gray-600
              ">
                CONTRACT AGREEMENT
              </span>
            </div>

            {/* Document Title */}
            <div className="mt-3">
              <p className="
                text-[7px] font-bold
                text-gray-900
              ">
                FREELANCE CONTRACT
              </p>

              <p className="
                mt-1 line-clamp-2
                text-[6px] font-semibold
                leading-tight text-gray-700
              ">
                {contract.job?.title || t("agreementFallback")}
              </p>

              <div className="mt-1 space-y-[3px]">
                <div className="h-[2px] w-full rounded bg-gray-200" />
                <div className="h-[2px] w-[85%] rounded bg-gray-200" />
              </div>
            </div>

            {/* Document Sections */}
            <div className="mt-3 space-y-2">
              {[
                "PARTIES",
                "SCOPE AND DELIVERABLES",
                "PRICE AND PAYMENT",
                "TIMELINE",
                "OWNERSHIP",
                "TERMS AND CONDITIONS",
              ].map((section, i) => (
                <div key={section}>
                  <p className="
                    text-[5px] font-bold
                    text-gray-800
                  ">
                    {i + 1}. {section}
                  </p>

                  <div className="mt-1 space-y-[3px]">
                    <div className="h-[2px] w-full rounded bg-gray-200" />
                    <div className="h-[2px] w-[90%] rounded bg-gray-200" />
                    <div className="h-[2px] w-[75%] rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="
              absolute bottom-2 left-3 right-3
              border-t border-gray-200 pt-1
            ">
              <div className="h-[2px] w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Card Information */}
        <div className="p-3">
          {/* Contract Name */}
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />

            <h3 className="
              min-w-0 flex-1 truncate
              text-[13px] font-semibold
              text-foreground
              transition-colors
              group-hover:text-[#0069D3]
            ">
              {contract.job?.title || t("agreementFallback")}
            </h3>
          </div>

          {/* Updated Date + Status */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="
              flex min-w-0 items-center
              gap-1 text-[10px]
              text-muted-foreground
            ">
              <Calendar className="size-3 shrink-0" />
              <span className="truncate">{formatDate(contract.createdAt)}</span>
            </div>

            <span className={`shrink-0 text-[10px] font-medium ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
