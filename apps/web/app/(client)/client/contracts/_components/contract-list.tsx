"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import type {
  ContractDetailType,
  GetContractListResponseType,
} from "@shared/types";

type ContractStatus = ContractDetailType["status"];

const CONTRACT_STATUSES = [
  "ACTIVE",
  "PENDING_SIGN",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly ContractStatus[];

function getStatusBadgeConfig(status: ContractStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        badgeClass:
          "text-emerald-700 dark:text-emerald-400",
      };
    case "PENDING_SIGN":
      return {
        badgeClass:
          "text-amber-700 dark:text-amber-400",
      };
    case "COMPLETED":
      return {
        badgeClass:
          "text-[#0069D3] dark:text-blue-400 ",
      };
    case "CANCELLED":
      return {
        badgeClass:
          "text-zinc-600 dark:text-zinc-400",
      };
    default:
      return {
        badgeClass: "text-muted-foreground",
      };
  }
}

interface ContractCardProps {
  contract: ContractDetailType;
  basePath: string;
  isFreelancerView: boolean;
  formatDate: (date: string | Date | null) => string;
  money: (amount: number) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tStatus: (status: string) => string;
  index: number;
}

function ContractCard({
  contract,
  basePath,
  isFreelancerView,
  formatDate,
  money,
  t,
  tStatus,
  index,
}: ContractCardProps) {
  const { badgeClass } = getStatusBadgeConfig(contract.status);
  const statusLabel = (CONTRACT_STATUSES as readonly string[]).includes(
    contract.status,
  )
    ? tStatus(contract.status)
    : contract.status;

  const counterpartyName = isFreelancerView
    ? contract.client?.profile?.displayName ?? t("counterpartyClient")
    : contract.freelancer?.profile?.displayName ?? t("counterpartyFreelancer");

  const counterpartyAvatar = isFreelancerView
    ? contract.client?.profile?.avatarUrl
    : contract.freelancer?.profile?.avatarUrl;

  const counterpartyRole = isFreelancerView
    ? t("counterpartyClient")
    : t("counterpartyFreelancer");

  const contractHref = `${basePath}/contracts/${contract.slug || contract.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
      className="group relative flex h-full flex-col justify-between rounded-xl border border-border/80 bg-card p-3 transition-all duration-200 hover:border-[#0069D3]/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div>
        {/* Top Bar: Status Badge + Contract ID */}
        <div className="">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] ${badgeClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.1rem] text-[13px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[#0069D3]">
          <Link href={contractHref} className="focus:outline-none">
            {contract.job?.title || t("agreementFallback")}
          </Link>
        </h3>

        {/* Counterparty Row */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <Avatar className="size-6 shrink-0 border border-border/80">
            <AvatarImage src={counterpartyAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {counterpartyName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-foreground">
              {counterpartyName}
            </p>
            <p className="text-[10px] font-normal text-muted-foreground">
              {counterpartyRole}
            </p>
          </div>
        </div>

        {/* Financial & Fee Box */}
        <div className="my-2 rounded-lg border border-border/60 p-2">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("totalBudget")}
              </span>
              <span className="text-sm font-bold text-foreground">
                {money(contract.totalAmount)}
              </span>
            </div>
            {contract.platformFee > 0 && (
              <div className="text-right">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("platformFeeLabel")}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {money(contract.platformFee)}
                </span>
              </div>
            )}
          </div>

          {/* Signatures Status */}
          <div className="mt-1.5 grid grid-cols-2 gap-1 border-t border-border/40 pt-1.5 text-[9px]">
            {/* Client Signature */}
            <div className="flex items-center gap-1 truncate">
              {contract.signedByClient ? (
                <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span className="truncate">
                <span className="text-muted-foreground">
                  {isFreelancerView ? t("counterpartyClient") : t("youLabel")}:
                </span>{" "}
                <span
                  className={
                    contract.signedByClient
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {contract.signedByClient ? t("signed") : t("waiting")}
                </span>
              </span>
            </div>

            {/* Freelancer Signature */}
            <div className="flex items-center gap-1 truncate">
              {contract.signedByFreelancer ? (
                <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span className="truncate">
                <span className="text-muted-foreground">
                  {isFreelancerView
                    ? t("youLabel")
                    : t("counterpartyFreelancer")}
                  :
                </span>{" "}
                <span
                  className={
                    contract.signedByFreelancer
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {contract.signedByFreelancer ? t("signed") : t("waiting")}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Date + Action Link */}
      <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-border/60 pt-2">
        <div className="flex min-w-0 items-center gap-1 text-[9px] text-muted-foreground">
          <Calendar className="size-3 shrink-0 text-muted-foreground/80" />
          <span>{formatDate(contract.createdAt)}</span>
        </div>

        <Link
          href={contractHref}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#0069D3] px-2 py-0.5 text-[9px] font-semibold text-white shadow-xs transition-all hover:bg-[#005bb8] focus:outline-none"
        >
          <span>{t("viewDetails")}</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </motion.div>
  );
}

export function ContractList({
  initialData,
  basePath = "/client",
}: {
  initialData?: GetContractListResponseType | null;
  basePath?: string;
}) {
  const t = useTranslations("contracts");
  const tStatus = useTranslations("contractStatus");
  const format = useFormatter();
  const [selectedTab, setSelectedTab] = useState<ContractStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const statusTabs: { label: string; value: ContractStatus | "ALL" }[] = [
    { label: t("tabAll"), value: "ALL" },
    { label: tStatus("ACTIVE"), value: "ACTIVE" },
    { label: t("tabPendingSign"), value: "PENDING_SIGN" },
    { label: tStatus("COMPLETED"), value: "COMPLETED" },
    { label: tStatus("CANCELLED"), value: "CANCELLED" },
  ];

  const money = (amount: number) =>
    format.number(amount, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const formatDate = (date: string | Date | null) =>
    date
      ? format.dateTime(new Date(date), {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : t("notAvailable");

  const { data: contractListRes } = useQuery<GetContractListResponseType>({
    queryKey: ["contracts-list", basePath, selectedTab],
    queryFn: () =>
      contractApiRequest
        .getContractList({
          status: selectedTab === "ALL" ? undefined : selectedTab,
          limit: 50,
        })
        .then(extractContractData),
    initialData: selectedTab === "ALL" && initialData ? initialData : undefined,
  });

  const allContracts = useMemo(
    () => contractListRes?.data ?? initialData?.data ?? [],
    [contractListRes?.data, initialData?.data],
  );

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

  const contracts = useMemo(() => {
    let list = allContracts;
    if (selectedTab !== "ALL") {
      list = list.filter((c) => c.status === selectedTab);
    }
    if (!searchQuery.trim()) return list;
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

  const isFreelancerView = basePath === "/freelancer";

  return (
    <div className="space-y-4">
      {/* Control Bar: Filter Tabs + Search + View Switcher */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Tabs with counts */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs dark:bg-muted">
          {statusTabs.map((tab) => {
            const isActive = selectedTab === tab.value;
            const count = counts[tab.value as keyof typeof counts];
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedTab(tab.value)}
                className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${isActive
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${isActive
                      ? "bg-[#0069D3]/10 text-[#0069D3]"
                      : "bg-muted-foreground/15 text-muted-foreground"
                      }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-background py-1.5 pr-3 pl-8 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:ring-1 focus:ring-[#0069D3] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Contract Cards */}
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <p className="text-base font-semibold text-foreground">
            {t("emptyTitle")}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {selectedTab !== "ALL"
              ? t("emptyFiltered", { status: tStatus(selectedTab) })
              : basePath === "/freelancer"
                ? t("emptyFreelancer")
                : t("emptyClient")}
          </p>
          <div className="mt-5">
            <Link
              href={
                basePath === "/freelancer"
                  ? "/freelancer/find-work"
                  : "/client/jobs"
              }
              className="inline-flex h-8 items-center justify-center rounded-full bg-[#0069D3] px-4 text-xs font-medium text-white transition-colors hover:bg-[#005bb8]"
            >
              {basePath === "/freelancer"
                ? t("findWork")
                : t("viewJobProposals")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {contracts.map((contract: ContractDetailType, index: number) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              basePath={basePath}
              isFreelancerView={isFreelancerView}
              formatDate={formatDate}
              money={money}
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
