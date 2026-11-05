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
  LayoutGrid,
  List,
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
  "DISPUTED",
] as const satisfies readonly ContractStatus[];

function getStatusBadgeConfig(status: ContractStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        badgeClass:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        dotClass: "bg-emerald-500",
      };
    case "PENDING_SIGN":
      return {
        badgeClass:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        dotClass: "bg-amber-500",
      };
    case "COMPLETED":
      return {
        badgeClass:
          "bg-blue-500/10 text-[#0069D3] dark:text-blue-400 border-blue-500/20",
        dotClass: "bg-[#0069D3]",
      };
    case "CANCELLED":
      return {
        badgeClass:
          "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        dotClass: "bg-zinc-400",
      };
    case "DISPUTED":
      return {
        badgeClass:
          "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
        dotClass: "bg-rose-500",
      };
    default:
      return {
        badgeClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground",
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
  const { badgeClass, dotClass } = getStatusBadgeConfig(contract.status);
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
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-[#0069D3]/40 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div>
        {/* Top Bar: Status Badge + Contract ID */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            <span className={`size-1.5 rounded-full ${dotClass}`} />
            {statusLabel}
          </span>
          <span className="font-mono text-[11px] font-medium text-muted-foreground/70">
            #{contract.id}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="mt-3 line-clamp-2 min-h-[2.85rem] text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[#0069D3]">
          <Link href={contractHref} className="focus:outline-none">
            {contract.job?.title || t("agreementFallback")}
          </Link>
        </h3>

        {/* Counterparty Row */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0 border border-border/80">
            <AvatarImage src={counterpartyAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {counterpartyName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {counterpartyName}
            </p>
            <p className="text-[11px] font-normal text-muted-foreground">
              {counterpartyRole}
            </p>
          </div>
        </div>

        {/* Financial & Fee Box */}
        <div className="my-3.5 rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("totalBudget")}
              </span>
              <span className="text-lg font-bold text-foreground">
                {money(contract.totalAmount)}
              </span>
            </div>
            {contract.platformFee > 0 && (
              <div className="text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("platformFeeLabel")}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {money(contract.platformFee)}
                </span>
              </div>
            )}
          </div>

          {/* Signatures Status */}
          <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-[11px]">
            {/* Client Signature */}
            <div className="flex items-center gap-1.5 truncate">
              {contract.signedByClient ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
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
            <div className="flex items-center gap-1.5 truncate">
              {contract.signedByFreelancer ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
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
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
          <span>{formatDate(contract.createdAt)}</span>
        </div>

        <Link
          href={contractHref}
          className="inline-flex items-center gap-1 rounded-full bg-[#0069D3] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:gap-1.5 hover:bg-[#005bb8] focus:outline-none"
        >
          <span>{t("viewDetails")}</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function ContractRow({
  contract,
  basePath,
  isFreelancerView,
  formatDate,
  money,
  t,
  tStatus,
  index,
}: ContractCardProps) {
  const { badgeClass, dotClass } = getStatusBadgeConfig(contract.status);
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

  const contractHref = `${basePath}/contracts/${contract.slug || contract.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-[#0069D3]/40 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
    >
      {/* Main Info */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            <span className={`size-1.5 rounded-full ${dotClass}`} />
            {statusLabel}
          </span>
          <span className="text-xs text-muted-foreground/60">•</span>
          <span className="font-mono text-xs text-muted-foreground">
            #{contract.id}
          </span>
          <span className="text-xs text-muted-foreground/60">•</span>
          <span className="text-xs text-muted-foreground">
            {t("createdAt", {
              date: formatDate(contract.createdAt),
            })}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-[#0069D3]">
          <Link href={contractHref}>
            {contract.job?.title || t("agreementFallback")}
          </Link>
        </h3>

        {/* Counterparty & Signatures */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Avatar className="size-6 border border-border">
              <AvatarImage src={counterpartyAvatar || undefined} />
              <AvatarFallback className="text-[10px] font-semibold">
                {counterpartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {counterpartyName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>
              {isFreelancerView ? t("counterpartyClient") : t("youLabel")}:{" "}
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
            <span>•</span>
            <span>
              {isFreelancerView
                ? t("youLabel")
                : t("counterpartyFreelancer")}
              :{" "}
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

      {/* Right: Budget & Action */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/60 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="text-left sm:text-right">
          <span className="block text-[11px] text-muted-foreground">
            {t("totalBudget")}
          </span>
          <span className="text-lg font-bold text-foreground">
            {money(contract.totalAmount)}
          </span>
        </div>

        <Link
          href={contractHref}
          className="inline-flex h-8 items-center justify-center rounded-full bg-[#0069D3] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#005bb8]"
        >
          {t("viewDetails")}
          <ChevronRight className="ml-1 size-3.5" />
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const allContracts = contractListRes?.data ?? initialData?.data ?? [];

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
    <div className="space-y-6">
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
                className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-all ${
                  isActive
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      isActive
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

        {/* Right Section: Search & View Switcher */}
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

          {/* View Toggle: Card Grid vs List */}
          <div className="flex items-center rounded-full border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`cursor-pointer rounded-full p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`cursor-pointer rounded-full p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contract Items: Cards or List */}
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
      ) : (
        <div className="grid gap-3">
          {contracts.map((contract: ContractDetailType, index: number) => (
            <ContractRow
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
