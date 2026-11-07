"use client";

import Link from "next/link";
import { FileText } from "@/components/icons";

interface ContractEmptyStateProps {
  selectedTab: string;
  basePath: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tStatus: (status: string) => string;
}

export function ContractEmptyState({
  selectedTab,
  basePath,
  t,
  tStatus,
}: ContractEmptyStateProps) {
  const isFreelancer = basePath === "/freelancer";

  return (
    <div className="
      flex flex-col items-center
      justify-center rounded-2xl
      border border-dashed
      border-border bg-card/40
      px-6 py-16 text-center
    ">
      <div className="
        mb-4 flex size-12
        items-center justify-center
        rounded-2xl bg-muted
        text-muted-foreground
      ">
        <FileText className="size-6" />
      </div>

      <p className="text-base font-semibold text-foreground">
        {t("emptyTitle")}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {selectedTab !== "ALL"
          ? t("emptyFiltered", {
              status: tStatus(selectedTab),
            })
          : isFreelancer
            ? t("emptyFreelancer")
            : t("emptyClient")}
      </p>

      <div className="mt-5">
        <Link
          href={isFreelancer ? "/freelancer/find-work" : "/client/jobs"}
          className="
            inline-flex h-8
            items-center justify-center
            rounded-full bg-[#0069D3]
            px-4 text-xs font-medium
            text-white transition-colors
            hover:bg-[#005bb8]
          "
        >
          {isFreelancer ? t("findWork") : t("viewJobProposals")}
        </Link>
      </div>
    </div>
  );
}

