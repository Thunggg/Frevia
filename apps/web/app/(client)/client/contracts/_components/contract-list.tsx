"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  Search,
} from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import type {
  ContractDetailType,
  GetContractListResponseType,
} from "@shared/types";

type ContractStatus = ContractDetailType["status"];

const STATUS_TABS: { label: string; value: ContractStatus | "ALL" }[] = [
  { label: "All Contracts", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending Sign", value: "PENDING_SIGN" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusBadge(status: ContractStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        className: "text-[#0069D3] font-semibold",
      };
    case "PENDING_SIGN":
      return {
        label: "Pending Signature",
        className: "text-foreground/80 font-medium",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        className: "text-muted-foreground font-medium",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "text-muted-foreground",
      };
    case "DISPUTED":
      return {
        label: "In Dispute",
        className: "text-red-600 font-medium",
      };
    default:
      return {
        label: status,
        className: "",
      };
  }
}

export function ContractList({
  initialData,
  basePath = "/client",
}: {
  initialData?: GetContractListResponseType | null;
  basePath?: string;
}) {
  const [selectedTab, setSelectedTab] = useState<ContractStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const contracts = useMemo(() => {
    const list = contractListRes?.data ?? initialData?.data ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c: ContractDetailType) =>
        c.job?.title?.toLowerCase().includes(q) ||
        c.freelancer?.profile?.displayName?.toLowerCase().includes(q) ||
        String(c.id).includes(q),
    );
  }, [contractListRes, initialData, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Control Bar: Filter Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-[#F1F0F5] p-1 text-xs">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedTab(tab.value)}
                className={`rounded-full px-3.5 py-1.5 font-medium transition-all cursor-pointer whitespace-nowrap ${isActive
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts or jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
          />
        </div>
      </div>

      {/* Contract Cards List */}
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No contracts found
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {selectedTab !== "ALL"
              ? `You don't have any contracts with status "${selectedTab}".`
              : "Contracts appear here once you hire a freelancer from your job proposals."}
          </p>
          <div className="mt-5">
            <Button asChild size="sm" className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs">
              <Link href="/client/jobs">View Job Proposals</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract: ContractDetailType) => {
            const badge = getStatusBadge(contract.status);
            const freelancerName =
              contract.freelancer?.profile?.displayName || "Freelancer";
            const avatarUrl = contract.freelancer?.profile?.avatarUrl;

            return (
              <div
                key={contract.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#0069D3]/40 hover:shadow-md sm:flex-row sm:items-center"
              >
                {/* Main Content */}
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-xs text-muted-foreground">
                      Created {formatDate(contract.createdAt)}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-base font-bold text-foreground line-clamp-1">
                    <Link
                      href={`${basePath}/contracts/${contract.id}`}
                      className="hover:text-[#0069D3] transition-colors"
                    >
                      {contract.job?.title || "Contract Agreement"}
                    </Link>
                  </h3>

                  {/* Freelancer Info & Sign Status */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 border border-border">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] font-semibold">
                          {freelancerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {freelancerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span
                        className={
                          contract.signedByClient
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        Client: {contract.signedByClient ? "Signed ✓" : "Unsigned"}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          contract.signedByFreelancer
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        Freelancer: {contract.signedByFreelancer ? "Signed ✓" : "Waiting"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Total Amount & Action Button */}
                <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      Total Budget
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {money(contract.totalAmount)}
                    </span>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-medium px-4 h-8"
                  >
                    <Link href={`${basePath}/contracts/${contract.id}`}>
                      View Details
                      <ChevronRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
