"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "@/components/icons";
import {
  contractApiRequest,
  extractContractData,
} from "@/apiRequests/contract";
import type {
  ContractDetailType,
  GetContractListResponseType,
} from "@shared/types";
import { type ContractStatus } from "./contract-status-badge";
import { ContractCard } from "./contract-card";
import { ContractEmptyState } from "./contract-empty-state";
import { ContractStatusTabs, type StatusTabItem } from "./contract-status-tabs";

export interface ContractListProps {
  initialData?: GetContractListResponseType | null;
  basePath?: string;
}

export function ContractList({
  initialData,
  basePath = "/client",
}: ContractListProps) {
  const t = useTranslations("contracts");
  const tStatus = useTranslations("contractStatus");
  const format = useFormatter();

  const [selectedTab, setSelectedTab] = useState<ContractStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Status Tabs Configuration
  const statusTabs: StatusTabItem[] = useMemo(
    () => [
      { label: t("tabAll"), value: "ALL" },
      { label: tStatus("ACTIVE"), value: "ACTIVE" },
      { label: t("tabPendingSign"), value: "PENDING_SIGN" },
      { label: tStatus("COMPLETED"), value: "COMPLETED" },
      { label: tStatus("CANCELLED"), value: "CANCELLED" },
    ],
    [t, tStatus],
  );

  // Date Formatter
  const formatDate = (date: string | Date | null) =>
    date
      ? format.dateTime(new Date(date), {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : t("notAvailable");

  // Fetch Contracts Query
  const { data: contractListRes } = useQuery<GetContractListResponseType>({
    queryKey: ["contracts-list", basePath, selectedTab],
    queryFn: () =>
      contractApiRequest
        .getContractList({
          status: selectedTab === "ALL" ? undefined : selectedTab,
          limit: 50,
        })
        .then(extractContractData),
    initialData:
      selectedTab === "ALL" && initialData ? initialData : undefined,
  });

  // All Contracts
  const allContracts = useMemo(
    () => contractListRes?.data ?? initialData?.data ?? [],
    [contractListRes?.data, initialData?.data],
  );

  // Tab Badge Counts
  const counts = useMemo(() => {
    return {
      ALL: allContracts.length,
      ACTIVE: allContracts.filter((c) => c.status === "ACTIVE").length,
      PENDING_SIGN: allContracts.filter((c) => c.status === "PENDING_SIGN")
        .length,
      COMPLETED: allContracts.filter((c) => c.status === "COMPLETED").length,
      CANCELLED: allContracts.filter((c) => c.status === "CANCELLED").length,
    };
  }, [allContracts]);

  // Filtered & Searched Contracts
  const filteredContracts = useMemo(() => {
    let list = allContracts;

    if (selectedTab !== "ALL") {
      list = list.filter((c) => c.status === selectedTab);
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase();

    return list.filter(
      (c: ContractDetailType) =>
        c.job?.title?.toLowerCase().includes(q) ||
        c.freelancer?.profile?.displayName?.toLowerCase().includes(q) ||
        c.client?.profile?.displayName?.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)),
    );
  }, [allContracts, selectedTab, searchQuery]);

  return (
    <div className="space-y-5 font-sans">
      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ContractStatusTabs
          tabs={statusTabs}
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          counts={counts}
        />

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full rounded-full
                border border-border
                bg-background py-1.5
                pr-3 pl-8 text-xs
                text-foreground
                placeholder:text-muted-foreground/60
                focus:border-[#0069D3]
                focus:ring-1
                focus:ring-[#0069D3]
                focus:outline-none
              "
            />
          </div>
        </div>
      </div>

      {/* Contract Cards Grid or Empty State */}
      {filteredContracts.length === 0 ? (
        <ContractEmptyState
          selectedTab={selectedTab}
          basePath={basePath}
          t={t}
          tStatus={tStatus}
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredContracts.map((contract, index) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              basePath={basePath}
              formatDate={formatDate}
              t={t}
              tStatus={tStatus}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

