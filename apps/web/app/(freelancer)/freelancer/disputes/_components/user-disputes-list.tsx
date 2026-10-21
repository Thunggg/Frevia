"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  CalendarDays,
  ExternalLink,
  Gavel,
  Loader2,
} from "@/components/icons";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { DisputeDialog } from "@/app/(client)/client/contracts/[contractId]/_components/dispute-dialog";
import type { DisputeDetailType, MilestoneType } from "@shared/types";

interface UserDisputesListProps {
  isFreelancer: boolean;
}

function money(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return {
        label: "Open • Fee Pending",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "WAITING_RESPONSE":
      return {
        label: "Awaiting Rebuttal",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Admin Review",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "DECISION_MADE":
      return {
        label: "Decision Proposed",
        className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      };
    case "REVIEW_REQUESTED":
      return {
        label: "Secondary Review Requested",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      };
    case "FINALIZED":
      return {
        label: "Resolved & Finalized",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
      };
  }
}

export function UserDisputesList({ isFreelancer }: UserDisputesListProps) {
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [activeDispute, setActiveDispute] = useState<DisputeDetailType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-disputes", selectedStatus],
    queryFn: async () => {
      const res = await disputeApiRequest.getMyDisputes({
        limit: 50,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
      });
      return res.data;
    },
  });

  const disputes = data?.data ?? [];

  const handleOpenDispute = (dispute: DisputeDetailType) => {
    setActiveDispute(dispute);
    setDialogOpen(true);
  };

  // Construct milestone object for DisputeDialog
  const activeMilestone: MilestoneType | null = activeDispute?.milestone
    ? ({
        id: activeDispute.milestone.id,
        contractId: activeDispute.milestone.contractId,
        title: activeDispute.milestone.title,
        amount: activeDispute.milestone.amount,
        status: activeDispute.milestone.status as MilestoneType["status"],
        paymentStatus: activeDispute.milestone
          .paymentStatus as MilestoneType["paymentStatus"],
        description: null,
        dueDate: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as MilestoneType)
    : null;

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <Tabs
        value={selectedStatus}
        onValueChange={setSelectedStatus}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="ALL" className="text-xs">
            All Disputes
          </TabsTrigger>
          <TabsTrigger value="OPEN" className="text-xs">
            Fee Pending
          </TabsTrigger>
          <TabsTrigger value="WAITING_RESPONSE" className="text-xs">
            Awaiting Rebuttal
          </TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW" className="text-xs">
            Under Review
          </TabsTrigger>
          <TabsTrigger value="DECISION_MADE" className="text-xs">
            Decision Proposed
          </TabsTrigger>
          <TabsTrigger value="FINALIZED" className="text-xs">
            Finalized
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-8 text-[#0069D3] animate-spin" />
          <span className="text-xs text-muted-foreground">Loading your disputes...</span>
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Gavel className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No dispute cases found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {selectedStatus === "ALL"
              ? "You do not have any active or past arbitration cases."
              : `No disputes found under status "${selectedStatus}".`}
          </p>
          <Button asChild size="sm" className="mt-4 rounded-full text-xs bg-[#0069D3] text-white">
            <Link href={isFreelancer ? "/freelancer/contracts" : "/client/contracts"}>
              View Contracts
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => {
            const badge = getStatusBadge(dispute.status);
            const counterpartyEmail = isFreelancer
              ? dispute.openedBy?.email ?? "Client"
              : dispute.respondent?.email ?? "Freelancer";

            const contractHref = isFreelancer
              ? `/freelancer/contracts/${dispute.milestone?.contractId}`
              : `/client/contracts/${dispute.milestone?.contractId}`;

            return (
              <div
                key={dispute.id}
                onClick={() => handleOpenDispute(dispute)}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#0069D3]/40 hover:shadow-md sm:flex-row sm:items-center cursor-pointer"
              >
                {/* Left Information */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground">
                      Case #{dispute.id}
                    </span>
                    <Badge variant="outline" className={`text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {dispute.milestone?.title ?? `Milestone #${dispute.milestoneId}`}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      Reason: <span className="text-foreground/90 font-medium">{dispute.reason}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      Counterparty: <strong className="text-foreground">{counterpartyEmail}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" /> Filed {formatDate(dispute.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right Value & Actions */}
                <div
                  className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-muted-foreground block">Milestone Amount</span>
                    <span className="text-base font-extrabold text-foreground">
                      {money(dispute.milestone?.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
                    >
                      <Link href={contractHref}>
                        Contract <ExternalLink className="ml-1 size-3" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenDispute(dispute)}
                      className="rounded-full text-xs h-8 px-3.5 bg-[#0069D3] hover:bg-[#005bb8] text-white font-semibold"
                    >
                      <Gavel className="mr-1.5 size-3.5" />
                      Manage Dispute
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Dialog */}
      {activeDispute && activeMilestone && (
        <DisputeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contractId={activeDispute.milestone?.contractId ?? 0}
          milestone={activeMilestone}
          currentUserId={isFreelancer ? activeDispute.respondentId : activeDispute.openedById}
          isFreelancer={isFreelancer}
          mode="VIEW"
          onSuccess={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}
